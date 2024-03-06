import express from 'express';
import RouterHealth from './health/health.router';
import RouterAccount from './account/account.router';
import RouterPools from './pools/pools.router';
import RouterToken from './token/token.router';
import RouterParticipants from './participants/participants.router';
import RouterMetadata from './metadata/metadata.router';
import RouterUpload from './upload/upload.router';
import RouterERC20 from './erc20/erc20.router';
import RouterERC721 from './erc721/erc721.router';
import RouterERC1155 from './erc1155/erc1155.router';
import RouterClients from './client/client.router';
import RouterQRCodes from './claims/claims.router';
import RouterBrands from './brands/brands.router';
import RouterWidget from './widget/widget.router';
import RouterQuests from './quests/quests.router';
import RouterRewards from './rewards/rewards.router';
import RouterLeaderboards from './leaderboards/leaderboards.router';
import RouterWebhook from './webhook/webhook.router';
import RouterWebhooks from './webhooks/webhooks.router';
import RouterWidgets from './widgets/widgets.router';
import RouterIdentity from './identity/identity.router';
import RouterEvents from './events/events.router';
import RouterData from './data/data.router';
import RouterLiquidity from './liquidity/liquidity.router';
import RouterVoteEscrow from './ve/ve.router';
import RouterJobs from './jobs/jobs.router';
import RouterCoupons from './coupons/coupons.router';
import { checkJwt, corsHandler } from '@thxnetwork/api/middlewares';

const router = express.Router({ mergeParams: true });

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', RouterHealth);
router.use('/data', RouterData);
router.use('/token', RouterToken);
router.use('/metadata', RouterMetadata);
router.use('/brands', RouterBrands);
router.use('/widget', RouterWidget);
router.use('/leaderboards', RouterLeaderboards);
router.use('/claims', RouterQRCodes); // Should redirect
router.use('/qr-codes', RouterQRCodes);
router.use('/quests', RouterQuests);
router.use('/rewards', RouterRewards);
router.use('/webhook', RouterWebhook);
router.use(checkJwt, corsHandler);
router.use('/jobs', RouterJobs);
router.use('/upload', RouterUpload);
router.use('/identity', RouterIdentity);
router.use('/events', RouterEvents);
router.use('/coupons', RouterCoupons);
router.use('/account', RouterAccount);
router.use('/participants', RouterParticipants);
router.use('/pools', RouterPools);
router.use('/widgets', RouterWidgets);
router.use('/clients', RouterClients);
router.use('/webhooks', RouterWebhooks);
router.use('/ve', RouterVoteEscrow);
router.use('/liquidity', RouterLiquidity);

router.use('/erc20', RouterERC20);
router.use('/erc721', RouterERC721);
router.use('/erc1155', RouterERC1155);

export default router;
