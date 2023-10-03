import { assertPoolAccess, assertRequestInput, guard } from '@thxnetwork/api/middlewares';
import { upload } from '@thxnetwork/api/util/multer';
import express from 'express';
import ListCouponReward from './list.controller';
import ListCouponCodePayments from './payments/list.controller';
import CreateCouponReward from './post.controller';
import UpdateCouponReward from './patch.controller';
import RemoveCouponReward from './delete.controller';
import RemoveCouponCode from './codes/delete.controller';

const router = express.Router();

router.get(
    '/',
    guard.check(['coupon_rewards:read']),
    assertPoolAccess,
    assertRequestInput(ListCouponReward.validation),
    ListCouponReward.controller,
);

router.get('/payments', ListCouponCodePayments.controller);

router.patch(
    '/:id',
    upload.single('file'),
    guard.check(['coupon_rewards:write', 'coupon_rewards:read']),
    assertPoolAccess,
    assertRequestInput(UpdateCouponReward.validation),
    UpdateCouponReward.controller,
);
router.post(
    '/',
    upload.single('file'),
    guard.check(['coupon_rewards:write', 'coupon_rewards:read']),
    assertPoolAccess,
    assertRequestInput(CreateCouponReward.validation),
    CreateCouponReward.controller,
);
router.delete(
    '/:id',
    guard.check(['coupon_rewards:write']),
    assertPoolAccess,
    assertRequestInput(RemoveCouponReward.validation),
    RemoveCouponReward.controller,
);
router.delete(
    '/:id/codes/:couponCodeId',
    guard.check(['coupon_rewards:write']),
    assertPoolAccess,
    assertRequestInput(RemoveCouponCode.validation),
    RemoveCouponCode.controller,
);

export default router;
