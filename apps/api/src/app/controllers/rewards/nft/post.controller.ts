import { body } from 'express-validator';
import { Request, Response } from 'express';
import { createRewardNft } from '../utils';

const validation = [
    body('title').exists().isString(),
    body('slug').exists().isString(),
    body('expiryDate').optional().isString(),
    body('erc721metadataId').exists().isString(),
    body('rewardConditionId').optional().isString(),
    body('amount').optional().isInt({ gt: 0 }),
];

const controller = async (req: Request, res: Response) => {
    const { reward, claims } = await createRewardNft(req.assetPool, req.body);
    res.status(201).json({ ...reward.toJSON(), claims });
};

export default { controller, validation };
