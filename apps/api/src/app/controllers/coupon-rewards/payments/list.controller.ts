import { Request, Response } from 'express';
import { CouponRewardPayment } from '@thxnetwork/api/models/CouponRewardPayment';
import SafeService from '@thxnetwork/api/services/SafeService';
import { ChainId } from '@thxnetwork/types/enums';
import { query } from 'express-validator';
import { NotFoundError } from '@thxnetwork/api/util/errors';
import { CouponCode } from '@thxnetwork/api/models/CouponCode';

const validation = [query('chainId').exists().isNumeric()];

const controller = async (req: Request, res: Response) => {
    const chainId = Number(req.query.chainId) as ChainId;
    const wallet = await SafeService.findPrimary(req.auth.sub, chainId);
    if (!wallet) throw new NotFoundError('Could not find the wallet for the user');

    const couponRewardPayments = await CouponRewardPayment.find({ walletId: wallet._id });
    const couponCodes = await Promise.all(
        couponRewardPayments.map(async (p) => {
            const code = await CouponCode.findById(p.couponCodeId);
            return { ...p.toJSON(), code };
        }),
    );

    res.json(couponCodes);
};

export default { controller, validation };
