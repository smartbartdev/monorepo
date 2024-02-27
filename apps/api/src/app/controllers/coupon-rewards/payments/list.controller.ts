import { Request, Response } from 'express';
import { CouponCode } from '@thxnetwork/api/models/CouponCode';
import { RewardCoupon, RewardCouponPayment } from '@thxnetwork/api/models';

const validation = [];

const controller = async (req: Request, res: Response) => {
    const payments = await RewardCouponPayment.find({ sub: req.auth.sub });
    const promises = payments.map(async (p) => {
        const couponCode = await CouponCode.findById(p.couponCodeId);
        const reward = couponCode ? await RewardCoupon.findById(couponCode.couponRewardId) : null;
        return { ...p.toJSON(), code: couponCode.code, webshopURL: reward && reward.webshopURL };
    });
    const results = await Promise.allSettled(promises);
    const couponCodes = results
        .filter((result) => result.status === 'fulfilled')
        .map((result: any & { value: boolean }) => result.value);

    res.json(couponCodes);
};

export default { controller, validation };
