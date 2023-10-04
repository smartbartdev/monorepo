import { NotFoundError } from '@thxnetwork/api/util/errors';
import { Request, Response } from 'express';
import { body, param, check } from 'express-validator';
import { TInfoLink } from '@thxnetwork/types/interfaces';
import { isValidUrl } from '@thxnetwork/api/util/url';
import { QuestVariant } from '@thxnetwork/common/lib/types';
import ReferralRewardClaimService from '@thxnetwork/api/services/ReferralRewardClaimService';
import ImageService from '@thxnetwork/api/services/ImageService';
import QuestService from '@thxnetwork/api/services/QuestService';

const validation = [
    param('id').isMongoId(),
    body('pathname').optional().isString(),
    body('isPublished').optional().isBoolean(),
    check('file')
        .optional()
        .custom((value, { req }) => {
            return ['jpg', 'jpeg', 'gif', 'png'].includes(req.file.mimetype);
        }),
    body('successUrl').optional().isURL({ require_tld: false }),
    body('index').optional().isInt(),
    body('infoLinks')
        .optional()
        .customSanitizer((infoLinks) => {
            return JSON.parse(infoLinks).filter((link: TInfoLink) => link.label.length && isValidUrl(link.url));
        }),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Rewards Referral']
    const { title, description, pathname, amount, successUrl, infoLinks, isMandatoryReview, index, isPublished } =
        req.body;
    const image = req.file && (await ImageService.upload(req.file));
    const quest = await QuestService.update(QuestVariant.Invite, req.params.id, {
        title,
        description,
        image,
        amount,
        pathname,
        successUrl,
        isMandatoryReview,
        infoLinks,
        index,
        isPublished,
    });
    const claims = await ReferralRewardClaimService.findByReferralReward(quest);

    res.json({ ...quest.toJSON(), claims });
};

export default { controller, validation };
