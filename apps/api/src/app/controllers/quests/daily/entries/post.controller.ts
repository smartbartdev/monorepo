import { Request, Response } from 'express';
import { param } from 'express-validator';
import { NotFoundError } from '@thxnetwork/api/util/errors';
import { JobType, QuestVariant } from '@thxnetwork/common/enums';
import { agenda } from '@thxnetwork/api/util/agenda';
import { QuestDaily } from '@thxnetwork/api/models';
import QuestService from '@thxnetwork/api/services/QuestService';
import { getIP } from '@thxnetwork/api/util/ip';

const validation = [param('id').isMongoId()];

const controller = async (req: Request, res: Response) => {
    const { params, account } = req;
    const quest = await QuestDaily.findById(params.id);
    if (!quest) throw new NotFoundError('Could not find the Daily Reward');

    // Only do this is no event requirement is set
    const data = {};
    const ip = getIP(req);
    if (!quest.eventName && ip) {
        data['ip'] = ip;
    }

    const { result, reason } = await QuestService.getValidationResult(quest.variant, { quest, account, data });
    if (!result) return res.json({ error: reason });

    const job = await agenda.now(JobType.CreateQuestEntry, {
        variant: QuestVariant.Daily,
        questId: String(quest._id),
        sub: account.sub,
        data,
    });

    res.json({ jobId: job.attrs._id });
};

export default { controller, validation };
