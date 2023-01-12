import express from 'express';
import healthRouter from './health/health.router';
import docsRouter from './docs/docs.router';
import accountRouter from './account/account.router';
import poolsRouter from './pools/pools.router';
import erc721PerksRouter from './erc721-perks/erc721-perks.router';
import referralRewardsRouter from './referral-rewards/referral-rewards.router';
import erc20PerksRouter from './erc20-perks/erc20-perks.router';
import tokenRouter from './token/token.router';
import pointRewardsRouter from './point-rewards/point-rewards.router';
import pointBalancesRouter from './point-balances/point-balances.router';
import erc721Router from './erc721/erc721.router';
import erc721MetadataRouter from './erc721/metadata/metadata.router';
import uploadRouter from './upload/upload.router';
import erc20Router from './erc20/erc20.router';
import erc20SwapRuleRouter from './swaprules/swaprules.router';
import clientRouter from './client/client.router';
import erc20SwapRouter from './swaps/swaps.router';
import claimsRouter from './claims/claims.router';
import brandsRouter from './brands/brands.router';
import walletsRouter from './wallets/wallets.router';
import widgetRouter from './widget/widget.router';
import rewardsRouter from './rewards/rewards.router';
import perksRouter from './perks/perks.router';
import milestonesRewardRouter from './milestone-reward/milestone-rewards.router'
import webhooksRouter from './webhooks/webhooks.router';
import widgetsRouter from './widgets/widgets.router';
import { checkJwt, corsHandler } from '@thxnetwork/api/middlewares';

const router = express.Router();

router.use('/ping', (_req, res) => res.send('pong'));
router.use('/health', healthRouter);
router.use('/token', tokenRouter);
router.use('/docs', docsRouter);
router.use('/metadata', erc721MetadataRouter);
router.use('/widget', widgetRouter);
router.use('/rewards', rewardsRouter);
router.use('/perks', perksRouter);
router.use('/webhook', webhooksRouter);

router.use(checkJwt);
router.use(corsHandler);
router.use('/point-rewards', pointRewardsRouter);
router.use('/milestone-rewards', milestonesRewardRouter)
router.use('/point-balances', pointBalancesRouter);
router.use('/account', accountRouter);
router.use('/widgets', widgetsRouter);
router.use('/pools', poolsRouter);
router.use('/erc20', erc20Router);
router.use('/erc721', erc721Router);
router.use('/erc20-perks', erc20PerksRouter);
router.use('/erc721-perks', erc721PerksRouter);
router.use('/referral-rewards', referralRewardsRouter);
router.use('/swaprules', erc20SwapRuleRouter);
router.use('/upload', uploadRouter);
router.use('/swaps', erc20SwapRouter);
router.use('/brands', brandsRouter);
router.use('/clients', clientRouter);
router.use('/claims', claimsRouter);
router.use('/wallets', walletsRouter);

export default router;
