import { Request, Response } from 'express';
import jwt_decode from 'jwt-decode';
import { ERC20Perk } from '@thxnetwork/api/models/ERC20Perk';
import { ERC721Perk } from '@thxnetwork/api/models/ERC721Perk';
import { ERC721PerkPayment } from '@thxnetwork/api/models/ERC721PerkPayment';
import { ERC20PerkPayment } from '@thxnetwork/api/models/ERC20PerkPayment';
import { WalletDocument } from '@thxnetwork/api/models/Wallet';
import ERC20Service from '@thxnetwork/api/services/ERC20Service';
import PoolService from '@thxnetwork/api/services/PoolService';
import SafeService from '@thxnetwork/api/services/SafeService';
import PerkService from '@thxnetwork/api/services/PerkService';
import AccountProxy from '@thxnetwork/api/proxies/AccountProxy';
import { CustomReward } from '@thxnetwork/api/models/CustomReward';
import { Wallet } from '@thxnetwork/api/models/Wallet';
import { CustomRewardPayment } from '@thxnetwork/api/models/CustomRewardPayment';
import { CouponReward } from '@thxnetwork/api/models/CouponReward';
import { CouponRewardPayment } from '@thxnetwork/api/models/CouponRewardPayment';
import { CouponCode } from '@thxnetwork/api/models/CouponCode';
import { DiscordRoleReward } from '@thxnetwork/api/models/DiscordRoleReward';
import { DiscordRoleRewardPayment } from '@thxnetwork/api/models/DiscordRoleRewardPayment';
import { AccessTokenKind } from '@thxnetwork/types/enums';
import { TAccount } from '@thxnetwork/types/interfaces';
import { Identity } from '@thxnetwork/api/models/Identity';

const controller = async (req: Request, res: Response) => {
    // #swagger.tags = ['Perks']
    const pool = await PoolService.getById(req.header('X-PoolId'));
    const [erc20Perks, erc721Perks, customRewards, couponRewards, discordRoleRewards] = await Promise.all([
        ERC20Perk.find({
            poolId: String(pool._id),
            pointPrice: { $exists: true, $gt: 0 },
        }),
        ERC721Perk.find({
            poolId: String(pool._id),
            $or: [{ pointPrice: { $exists: true, $gt: 0 } }, { price: { $exists: true, $gt: 0 } }],
        }),
        CustomReward.find({
            poolId: String(pool._id),
            $or: [{ pointPrice: { $exists: true, $gt: 0 } }, { price: { $exists: true, $gt: 0 } }],
        }),
        CouponReward.find({
            poolId: String(pool._id),
            $or: [{ pointPrice: { $exists: true, $gt: 0 } }, { price: { $exists: true, $gt: 0 } }],
        }),
        DiscordRoleReward.find({
            poolId: String(pool._id),
            $or: [{ pointPrice: { $exists: true, $gt: 0 } }, { price: { $exists: true, $gt: 0 } }],
        }),
    ]);

    let wallet: WalletDocument, account: TAccount, sub: string;

    // This endpoint is public so we do not get req.auth populated and decode the token ourselves
    // when the request is made with an authorization header to obtain the sub.
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token: { sub: string } = jwt_decode(authHeader.split(' ')[1]);
        sub = token.sub;
        account = await AccountProxy.getById(sub);
        wallet = await SafeService.findPrimary(sub, pool.chainId);
    }

    const getRewardDefaults = async (r, Model) => {
        return {
            _id: r._id,
            uuid: r.uuid,
            title: r.title,
            description: r.description,
            image: r.image,
            pointPrice: r.pointPrice,
            isPromoted: r.isPromoted,
            expiry: await PerkService.getExpiry(r),
            progress: await PerkService.getProgress(r, Model),
            isLocked: await PerkService.getIsLockedForWallet(r, wallet),
            tokenGatingContractAddress: r.tokenGatingContractAddress,
        };
    };

    res.json({
        coin: await Promise.all(
            erc20Perks.map(async (r) => {
                const { isError } = await PerkService.validate({ perk: r, sub, pool });
                const defaults = await getRewardDefaults(r, ERC20PerkPayment);
                return {
                    ...defaults,
                    amount: r.amount,
                    isDisabled: isError,
                    isOwned: false,
                    erc20: await ERC20Service.getById(r.erc20Id),
                };
            }),
        ),
        nft: await Promise.all(
            erc721Perks.map(async (r) => {
                const { isError } = await PerkService.validate({ perk: r, sub, pool });
                const nft = await PerkService.getNFT(r);
                const token = !r.metadataId && r.tokenId ? await PerkService.getToken(r) : null;
                const metadata = await PerkService.getMetadata(r, token);
                const defaults = await getRewardDefaults(r, ERC721PerkPayment);

                return {
                    ...defaults,
                    nft,
                    metadata,
                    erc1155Amount: r.erc1155Amount,
                    price: r.price,
                    priceCurrency: r.priceCurrency,
                    isDisabled: isError,
                    isOwned: false,
                };
            }),
        ),
        custom: await Promise.all(
            customRewards.map(async (r) => {
                const { isError } = await PerkService.validate({ perk: r, sub, pool });
                const defaults = await getRewardDefaults(r, CustomRewardPayment);
                // @dev Having an Identity for this pool is required in order for the external system to target the right user
                const identities = sub ? await Identity.find({ poolId: pool._id, sub }) : [];
                return {
                    ...defaults,
                    isDisabled: isError || !identities.length,
                    isOwned: false,
                };
            }),
        ),
        coupon: await Promise.all(
            couponRewards.map(async (r) => {
                // Set limit here since it is not stored in the reward but obtained
                // from the amount of coupon codes instead
                const codes = await CouponCode.find({ couponRewardId: String(r._id) });
                r.limit = codes.length;

                const { isError, errorMessage } = await PerkService.validate({ perk: r, sub, pool });
                const defaults = await getRewardDefaults(r, CouponRewardPayment);

                return { ...defaults, isDisabled: isError, errorMessage, isOwned: false };
            }),
        ),
        discordRole: await Promise.all(
            discordRoleRewards.map(async (r) => {
                const { isError, errorMessage } = await PerkService.validate({ perk: r, sub, pool });
                const defaults = await getRewardDefaults(r, DiscordRoleRewardPayment);
                const connectedAccount =
                    account && account.connectedAccounts.find(({ kind }) => kind === AccessTokenKind.Discord);

                return { ...defaults, isDisabled: !connectedAccount || isError, errorMessage, isOwned: false };
            }),
        ),
    });
};

export default { controller };
