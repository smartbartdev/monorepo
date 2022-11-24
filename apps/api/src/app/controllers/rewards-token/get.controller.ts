import { Request, Response } from 'express';
import { NotFoundError } from '@thxnetwork/api/util/errors';
import { param } from 'express-validator';
import WithdrawalService from '@thxnetwork/api/services/WithdrawalService';
import ClaimService from '@thxnetwork/api/services/ClaimService';
import ERC20RewardService from '@thxnetwork/api/services/ERC20RewardService';

const validation = [param('id').exists()];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['RewardsToken']
    const reward = await ERC20RewardService.get(req.params.id);
    if (!reward) throw new NotFoundError();

    const claims = await ClaimService.findByReward(reward);
    const withdrawals = await WithdrawalService.findByQuery({
        poolId: String(req.assetPool._id),
        rewardId: reward.id,
    });

    res.json({ ...reward.toJSON(), claims, poolAddress: req.assetPool.address, progress: withdrawals.length });
};

export default { controller, validation };
