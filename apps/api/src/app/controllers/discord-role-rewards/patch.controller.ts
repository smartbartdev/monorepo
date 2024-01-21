import ImageService from '@thxnetwork/api/services/ImageService';
import { Request, Response } from 'express';
import { param } from 'express-validator';
import { ForbiddenError } from '@thxnetwork/api/util/errors';
import { DiscordRoleReward } from '@thxnetwork/api/models/DiscordRoleReward';
import CreateController from './post.controller';

const validation = [param('id').isMongoId(), ...CreateController.validation];

const controller = async (req: Request, res: Response) => {
    const poolId = req.header('X-PoolId');
    const image = req.file && (await ImageService.upload(req.file));

    const discordRoleReward = await DiscordRoleReward.findById(req.params.id);
    if (discordRoleReward.poolId !== poolId) throw new ForbiddenError('Not your discord role reward');

    const reward = await DiscordRoleReward.findByIdAndUpdate(
        req.params.id,
        { ...req.body, poolId, image },
        { new: true },
    );

    res.status(201).json(reward);
};

export default { controller, validation };
