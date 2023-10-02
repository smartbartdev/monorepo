import mongoose from 'mongoose';
import { TCouponRewardPayment } from '@thxnetwork/types/interfaces';

export type CouponRewardPaymentDocument = mongoose.Document & TCouponRewardPayment;

const schema = new mongoose.Schema(
    {
        walletId: String,
        sub: String,
        rewardId: String,
        coupontCodeId: String,
        poolId: String,
        amount: Number,
    },
    { timestamps: true },
);

export const CouponRewardPayment = mongoose.model<CouponRewardPaymentDocument>('couponrewardpayments', schema);
