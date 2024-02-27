import { v4 } from 'uuid';
import { Request, Response } from 'express';
import { body } from 'express-validator';
import ImageService from '@thxnetwork/api/services/ImageService';
import { RewardCoupon, CouponCode } from '@thxnetwork/api/models';
import { ForbiddenError } from '@thxnetwork/api/util/errors';
import { defaults } from '@thxnetwork/api/util/validation';

const validation = [
    ...defaults.reward,
    body('webshopURL').optional().isURL({ require_tld: false }),
    body('codes')
        .optional()
        .custom((value: string) => value && JSON.parse(value).length > 0),
];

const controller = async (req: Request, res: Response) => {
    const poolId = req.header('X-PoolId');
    const image = req.file && (await ImageService.upload(req.file));

    if (!req.body.codes || !req.body.codes.length) {
        throw new ForbiddenError('Could not find coupon codes');
    }

    const codes = JSON.parse(req.body.codes);
    const reward = await RewardCoupon.create({ ...req.body, uuid: v4(), poolId, image });
    const couponCodes = await Promise.all(
        codes.map(async (code) => await CouponCode.create({ code, couponRewardId: reward._id })),
    );

    res.status(201).json({ ...reward.toJSON(), couponCodes });
};

export default { controller, validation };
