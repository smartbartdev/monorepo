import { Request, Response } from 'express';
import { body, check } from 'express-validator';
import { isValidUrl } from '@thxnetwork/api/util/url';
import { TInfoLink } from '@thxnetwork/types/interfaces';
import { QuestVariant } from '@thxnetwork/common/lib/types';
import ImageService from '@thxnetwork/api/services/ImageService';
import QuestService from '@thxnetwork/api/services/QuestService';

const validation = [
    body('index').isInt(),
    body('title').isString(),
    body('description').isString(),
    body('isPublished').optional().isBoolean(),
    body('amount').isInt({ gt: 0 }),
    check('file')
        .optional()
        .custom((value, { req }) => {
            return ['jpg', 'jpeg', 'gif', 'png'].includes(req.file.mimetype);
        }),
    body('platform').isNumeric(),
    body('interaction').optional().isNumeric(),
    body('content').optional().isString(),
    body('contentMetadata').optional().isString(),
    body('infoLinks')
        .optional()
        .customSanitizer((infoLinks) => {
            return JSON.parse(infoLinks).filter((link: TInfoLink) => link.label.length && isValidUrl(link.url));
        }),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Quest Social']
    const poolId = req.header('X-PoolId');
    const { title, description, amount, infoLinks, platform, interaction, content, contentMetadata, isPublished } =
        req.body;
    const image = req.file && (await ImageService.upload(req.file));
    const quest = await QuestService.create(QuestVariant.Social, poolId, {
        title,
        description,
        amount,
        image,
        platform,
        interaction,
        content,
        contentMetadata,
        infoLinks,
        isPublished,
    });

    res.status(201).json(quest);
};

export default { validation, controller };
