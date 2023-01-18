import { Request, Response } from 'express';
import { query } from 'express-validator';
import ClaimService from '@thxnetwork/api/services/ClaimService';
import ERC721PerkService from '@thxnetwork/api/services/ERC721PerkService';
import PoolService from '@thxnetwork/api/services/PoolService';
import ERC721Service from '@thxnetwork/api/services/ERC721Service';
import { ERC721PerkPayment } from '@thxnetwork/api/models/ERC721PerkPayment';

export const validation = [query('limit').optional().isInt({ gt: 0 }), query('page').optional().isInt({ gt: 0 })];

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['ERC721 Rewards']

    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const page = req.query.page ? Number(req.query.page) : 1;
    const pool = await PoolService.getById(req.header('X-PoolId'));
    const perks = await ERC721PerkService.findByPool(pool, page, limit);
    perks.results = await Promise.all(
        perks.results.map(async (perk) => {
            const claims = await ClaimService.findByReward(perk);
            const erc721 = await ERC721Service.findById(perk.erc721Id);
            const payments = await ERC721PerkPayment.find({ perkId: perk._id });
            return {
                claims,
                payments,
                erc721,
                ...perk,
            };
        }),
    );

    res.json(perks);
};

export default { controller, validation };
