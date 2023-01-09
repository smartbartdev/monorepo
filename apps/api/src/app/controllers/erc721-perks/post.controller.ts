import { body, check } from 'express-validator';
import { Request, Response } from 'express';
import { createERC721Perk } from '@thxnetwork/api/util/rewards';
import ImageService from '@thxnetwork/api/services/ImageService';
import { TERC721Perk } from '@thxnetwork/types/interfaces/ERC721Perk';
import PoolService from '@thxnetwork/api/services/PoolService';
import ERC721Service from '@thxnetwork/api/services/ERC721Service';
import { NotFound } from '@aws-sdk/client-s3';
import { NotFoundError } from '@thxnetwork/api/util/errors';

const validation = [
    body('title').exists().isString(),
    body('description').exists().isString(),
    body('erc721metadataIds').exists().isString(),
    body('expiryDate').optional().isString(),
    body('claimAmount').optional().isInt({ gt: 0 }),
    body('platform').optional().isNumeric(),
    body('interaction').optional().isNumeric(),
    body('content').optional().isString(),
    body('pointPrice').optional().isNumeric(),
    check('file')
        .optional()
        .custom((value, { req }) => {
            return ['jpg', 'jpeg', 'gif', 'png'].includes(req.file.mimetype);
        }),
    body('isPromoted').optional().isBoolean(),
];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721 Rewards']
    let image: string;

    if (req.file) {
        const response = await ImageService.upload(req.file);
        image = ImageService.getPublicUrl(response.key);
    }

    const metadataIdList = JSON.parse(req.body.erc721metadataIds);
    const pool = await PoolService.getById(req.header('X-PoolId'));
    if (!pool) throw new NotFoundError('Could not find pool');

    // Get one metadata so we can obtain erc721Id from it
    const metadata = await ERC721Service.findMetadataById(metadataIdList[0]);
    if (!metadata) throw new NotFoundError('Could not find first metadata from list');

    const erc721 = await ERC721Service.findById(metadata.erc721);
    if (!erc721) throw new NotFoundError('Could not find erc721');

    // Check if erc721 already is mintable by pool
    const isMinter = await ERC721Service.isMinter(erc721, pool.address);
    if (!isMinter) {
        await ERC721Service.addMinter(erc721, pool.address);
    }

    const perks = await Promise.all(
        metadataIdList.map(async (erc721metadataId: string) => {
            const config = {
                poolId: String(pool._id),
                erc721metadataId,
                image,
                erc721Id: erc721._id,
                title: req.body.title,
                description: req.body.description,
                expiryDate: req.body.expiryDate,
                claimAmount: req.body.claimAmount,
                pointPrice: req.body.pointPrice,
                isPromoted: req.body.isPromoted,
            } as TERC721Perk;
            const { reward, claims } = await createERC721Perk(pool, config);

            return { ...reward.toJSON(), claims, erc721 };
        }),
    );

    res.status(201).json(perks);
};

export default { controller, validation };
