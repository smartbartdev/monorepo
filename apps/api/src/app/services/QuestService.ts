import { JobType, QuestVariant } from '@thxnetwork/types/enums';
import { TAccount, TBrand, TQuest, TQuestEntry, TWallet, TWidget } from '@thxnetwork/types/interfaces';
import { DailyReward } from './DailyRewardService';
import { ReferralReward } from '../models/ReferralReward';
import { PointReward } from './PointRewardService';
import { Web3Quest } from '../models/Web3Quest';
import { MilestoneReward } from '../models/MilestoneReward';
import { v4 } from 'uuid';
import { Widget } from '../models/Widget';
import DiscordDataProxy from '../proxies/DiscordDataProxy';
import PoolService from './PoolService';
import BrandService from './BrandService';
import NotificationService from './NotificationService';
import { DailyRewardClaim } from '../models/DailyRewardClaims';
import { ReferralRewardClaim } from '../models/ReferralRewardClaim';
import { PointRewardClaim } from '../models/PointRewardClaim';
import { MilestoneRewardClaim } from '../models/MilestoneRewardClaims';
import { Web3QuestClaim } from '../models/Web3QuestClaim';
import PointBalanceService from './PointBalanceService';
import { AssetPoolDocument } from '../models/AssetPool';
import { celebratoryWords } from '../util/dictionaries';
import { agenda } from '../util/agenda';
import { ButtonStyle } from 'discord.js';
import { WIDGET_URL } from '../config/secrets';
import { DiscordButtonVariant } from '../events/InteractionCreated';
import DailyRewardClaimService from './DailyRewardClaimService';
import { WalletDocument } from '../models/Wallet';
import { PointRewardDocument } from '../models/PointReward';

function formatAddress(address: string) {
    return `${address.slice(0, 5)}...${address.slice(-3)}`;
}

const entryModelMap: any = {
    [QuestVariant.Daily]: DailyRewardClaim,
    [QuestVariant.Invite]: ReferralRewardClaim,
    [QuestVariant.Twitter]: PointRewardClaim,
    [QuestVariant.Discord]: PointRewardClaim,
    [QuestVariant.YouTube]: PointRewardClaim,
    [QuestVariant.Custom]: MilestoneRewardClaim,
    [QuestVariant.Web3]: Web3QuestClaim,
};

const modelMap: any = {
    [QuestVariant.Daily]: DailyReward,
    [QuestVariant.Invite]: ReferralReward,
    [QuestVariant.Twitter]: PointReward,
    [QuestVariant.Discord]: PointReward,
    [QuestVariant.YouTube]: PointReward,
    [QuestVariant.Custom]: MilestoneReward,
    [QuestVariant.Web3]: Web3Quest,
};

const callbackQuestDaily = (quest) => ({
    dailyRewardId: String(quest._id),
});
const callbackQuestSocial = (quest: PointRewardDocument, platformUserId: string) => ({
    pointRewardId: String(quest._id),
    platformUserId,
});
const callbackQuestCustom = (quest: PointRewardDocument) => ({
    milestoneRewardId: String(quest._id),
});

const questEntryDataMap = {
    [QuestVariant.Daily]: callbackQuestDaily,
    // [QuestVariant.Invite]: ..,
    [QuestVariant.Discord]: callbackQuestSocial,
    [QuestVariant.Twitter]: callbackQuestSocial,
    [QuestVariant.YouTube]: callbackQuestSocial,
    [QuestVariant.Custom]: callbackQuestCustom,
    // [QuestVariant.Web3]: ..,
};

async function notify(variant: QuestVariant, quest: TQuest) {
    const pool = await PoolService.getById(quest.poolId);
    const brand = await BrandService.get(quest.poolId);
    const widget = await Widget.findOne({ poolId: pool._id });

    notifyEmail(pool, variant, quest as TQuest, widget);
    notifyDiscord(pool, variant, quest as TQuest, widget, brand);
}

async function notifyEmail(pool: AssetPoolDocument, variant: QuestVariant, quest: TQuest, widget: TWidget) {
    const { amount, amounts } = quest as any;
    const subject = `🎁 New ${QuestVariant[variant]} Quest: Earn ${amount || amounts[0]} pts!"`;
    const message = `<p style="font-size: 18px">Earn ${amount || amounts[0]} points!🔔</p>
    <p>Hi! <strong>${pool.settings.title}</strong> just published a new ${QuestVariant[variant]} Quest.
    <p><strong>${quest.title}</strong><br />${quest.description}.</p>`;

    NotificationService.send(pool, {
        subjectId: quest.uuid,
        subject,
        message,
        link: { text: `Complete ${QuestVariant[variant]} Quest`, src: widget.domain },
    });
}

async function notifyDiscord(
    pool: AssetPoolDocument,
    variant: QuestVariant,
    quest: TQuest,
    widget: TWidget,
    brand?: TBrand,
) {
    const theme = JSON.parse(widget.theme);
    const { amount, amounts } = quest as any;

    const embed = {
        title: quest.title,
        description: quest.description,
        author: {
            name: pool.settings.title,
            icon_url: brand ? brand.logoImgUrl : '',
            url: widget.domain,
        },
        thumbnail: { url: quest.image },
        color: parseInt(theme.elements.btnBg.color.replace(/^#/, ''), 16),
        fields: [
            {
                name: 'Points',
                value: `${amount || amounts[0]}`,
                inline: true,
            },
            {
                name: 'Type',
                value: `${QuestVariant[quest.variant]}`,
                inline: true,
            },
        ],
    };

    await DiscordDataProxy.sendChannelMessage(
        pool,
        `Hi @everyone! **${pool.settings.title}** just published a **${QuestVariant[variant]} Quest**.`,
        [embed],
        [
            {
                customId: `${DiscordButtonVariant.QuestComplete}:${quest.variant}:${quest._id}`,
                label: 'Complete Quest!',
                style: ButtonStyle.Success,
            },
            { label: 'More Info', style: ButtonStyle.Link, url: WIDGET_URL + `/c/${pool._id}/quests` },
        ],
    );
}

async function update(variant: QuestVariant, questId: string, data: Partial<TQuest>) {
    const model = modelMap[variant];
    const quest = await model.findById(questId);

    // We only want to notify when the quest is set to published (and not updated while published already)
    if (data.isPublished && Boolean(data.isPublished) !== quest.isPublished) {
        await notify(variant, { ...quest.toJSON(), ...data, image: data.image || quest.image });
    }

    return await model.findByIdAndUpdate(questId, data, { new: true });
}

async function create(variant: QuestVariant, poolId: string, data: Partial<TQuest>) {
    const model = modelMap[variant];
    const quest = await model.create({ ...data, poolId, variant, uuid: v4() });

    if (data.isPublished) {
        await notify(variant, quest);
    }

    return quest;
}

async function getAmount(variant: QuestVariant, quest: TQuest, wallet: WalletDocument) {
    const getAmountMap = {
        [QuestVariant.Daily]: async (quest, wallet) => {
            const claims = await DailyRewardClaimService.findByWallet(quest, wallet);
            const amountIndex =
                claims.length >= quest.amounts.length ? claims.length % quest.amounts.length : claims.length;
            return quest.amounts[amountIndex];
        },
        // [QuestVariant.Invite]: ..,
        // TODO
    };
    return await getAmountMap[variant](quest, wallet);
}

async function validate(variant: QuestVariant, quest: TQuest, wallet: WalletDocument) {
    const validateQuestMap = {
        [QuestVariant.Daily]: (quest, wallet) => DailyRewardClaimService.isClaimable(quest, wallet),
        // [QuestVariant.Invite]: ..,
        // TODO
    };

    return await validateQuestMap[variant](quest, wallet);
}

async function complete(
    variant: QuestVariant,
    amount: number,
    pool: AssetPoolDocument,
    quest: TQuest,
    account: TAccount,
    wallet: TWallet,
    data: Partial<TQuestEntry>,
) {
    const model = entryModelMap[variant];
    const index = Math.floor(Math.random() * celebratoryWords.length);
    const discord = account.connectedAccounts && account.connectedAccounts.find((a) => a.kind === 'discord');
    const user =
        discord && discord.userId
            ? `<@${discord.userId}>`
            : `**${account.username ? account.username : formatAddress(wallet.address)}**`;
    const button = {
        customId: `${DiscordButtonVariant.QuestComplete}:${quest.variant}:${quest._id}`,
        label: 'Complete Quest',
        style: ButtonStyle.Primary,
    };
    const content = `${celebratoryWords[index]} ${user} completed the **${quest.title}** quest and earned **${amount} points.**`;
    const entry = await model.create({
        sub: account.sub,
        walletId: wallet._id,
        amount,
        ...data,
        poolId: pool._id,
        uuid: v4(),
    });

    await PointBalanceService.add(pool, wallet._id, amount);
    await DiscordDataProxy.sendChannelMessage(pool, content, [], [button]);
    await agenda.now(JobType.UpdateParticipantRanks, { poolId: pool._id });

    return entry;
}

function findById(variant: QuestVariant, questId: string) {
    const model = modelMap[variant];
    return model.findById(questId);
}

export { questEntryDataMap, modelMap };
export default { getAmount, create, update, complete, validate, findById };
