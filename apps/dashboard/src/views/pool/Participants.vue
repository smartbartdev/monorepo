<template>
    <div>
        <h2 class="mb-3">Participants: {{ participants.total }}</h2>
        <BCard class="shadow-sm mb-5" no-body v-if="pool">
            <BaseCardTableHeader
                :pool="pool"
                :page="page"
                :limit="limit"
                :total-rows="participants.total"
                :selectedItems="[]"
                :actions="[]"
                @change-page="onChangePage"
                @change-limit="onChangeLimit"
            />
            <BTable
                id="table-participants"
                hover
                :busy="isLoading"
                :items="participantsByPage"
                responsive="lg"
                show-empty
            >
                <!-- Head formatting -->
                <template #head(rank)>
                    <BaseBtnSort @click="onClickSort('rank', $event)">Rank</BaseBtnSort>
                </template>
                <template #head(account)>
                    <BaseBtnSort @click="onClickSort('username', $event)">Username</BaseBtnSort>
                </template>
                <template #head(email)>
                    <BaseBtnSort @click="onClickSort('email', $event)">E-mail</BaseBtnSort>
                </template>
                <template #head(tokens)> Connected </template>
                <template #head(pointBalance)>
                    <BaseBtnSort @click="onClickSort('pointBalance', $event)">Point Balance</BaseBtnSort>
                </template>
                <template #head(subscription)>
                    <BaseBtnSort @click="onClickSort('subscription', $event)">Subscribed</BaseBtnSort>
                </template>
                <template #head(createdAt)>
                    <BaseBtnSort @click="onClickSort('createdAt', $event)">Created</BaseBtnSort>
                </template>
                <template #head(participant)> &nbsp;</template>

                <!-- Cell formatting -->
                <template #cell(rank)="{ item }">
                    <span>{{ item.rank }}</span>
                </template>
                <template #cell(account)="{ item }"> <BaseParticipantAccount :account="item.account" /> </template>
                <template #cell(email)="{ item }"> {{ item.email }} </template>
                <template #cell(tokens)="{ item }">
                    <BaseParticipantConnectedAccount :account="token" :key="key" v-for="(token, key) in item.tokens" />
                </template>
                <template #cell(pointBalance)="{ item }">
                    <strong class="text-primary">{{ item.pointBalance }}</strong>
                </template>
                <template #cell(subscription)="{ item }">
                    <small class="text-muted">
                        {{ item.subscription }}
                    </small>
                </template>
                <template #cell(createdAt)="{ item }">
                    <small class="text-muted">{{ format(new Date(item.createdAt), 'dd-MM-yyyy HH:mm') }}</small>
                </template>
                <template #cell(participant)="{ item }">
                    <b-dropdown variant="link" size="sm" right no-caret>
                        <template #button-content>
                            <i class="fas fa-ellipsis-h ml-0 text-muted"></i>
                        </template>
                        <b-dropdown-item
                            v-b-modal="'BaseModalParticipant' + item.participant._id"
                            link-class="d-flex align-items-center justify-content-between"
                        >
                            Update
                        </b-dropdown-item>
                    </b-dropdown>
                    <BaseModalParticipant
                        :id="'BaseModalParticipant' + item.participant._id"
                        :participant="item.participant"
                    />
                </template>
            </BTable>
        </BCard>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
import BaseBtnSort from '@thxnetwork/dashboard/components/buttons/BaseBtnSort.vue';
import BaseCardTableHeader from '@thxnetwork/dashboard/components/cards/BaseCardTableHeader.vue';
import BaseParticipantAccount, { parseAccount } from '@thxnetwork/dashboard/components/BaseParticipantAccount.vue';
import BaseModalParticipant from '@thxnetwork/dashboard/components/modals/BaseModalParticipant.vue';
import BaseParticipantConnectedAccount, {
    parseConnectedAccounts,
} from '@thxnetwork/dashboard/components/BaseParticipantConnectedAccount.vue';
import { format } from 'date-fns';
import { IPools, TParticipantState } from '@thxnetwork/dashboard/store/modules/pools';

@Component({
    components: {
        BaseBtnSort,
        BaseCardTableHeader,
        BaseParticipantAccount,
        BaseParticipantConnectedAccount,
        BaseModalParticipant,
    },
    computed: mapGetters({
        pools: 'pools/all',
        profile: 'account/profile',
        participantList: 'pools/participants',
    }),
})
export default class ViewParticipants extends Vue {
    pools!: IPools;
    isLoading = false;
    format = format;
    participantList!: TParticipantState;
    page = 1;
    limit = 10;
    sorts = {
        rank: (a, b) => {
            const rankA = a.rank ? a.rank : 0;
            const rankB = b.rank ? b.rank : 0;
            if (rankA < rankB) return 1;
            if (rankA > rankB) return -1;
            return 0;
        },
        username: (a, b) => {
            const usernameA = a.account && a.account.username ? a.account.username.toLowerCase() : '';
            const usernameB = b.account && b.account.username ? b.account.username.toLowerCase() : '';
            if (usernameA < usernameB) return -1;
            if (usernameA > usernameB) return 1;
            return 0;
        },
        email: (a, b) => {
            const emailA = a.account && a.account.email ? a.account.email.toLowerCase() : '';
            const emailB = b.account && b.account.email ? b.account.email.toLowerCase() : '';
            if (emailA < emailB) return -1;
            if (emailA > emailB) return 1;
            return 0;
        },
        pointBalance: (a, b) => b.pointBalance - a.pointBalance,
        subscription: (a, b) => {
            const dateA: any = a.subscription && new Date(a.subscription.createdAt);
            const dateB: any = b.subscription && new Date(b.subscription.createdAt);
            return dateB - dateA;
        },
        createdAt: (a, b) => {
            const dateA: any = new Date(a.createdAt);
            const dateB: any = new Date(b.createdAt);
            return dateB - dateA;
        },
    };

    get pool() {
        return this.pools[this.$route.params.id];
    }

    get participants() {
        if (!this.participantList[this.$route.params.id]) return { total: 0, results: [] };
        return this.participantList[this.$route.params.id];
    }

    get participantsByPage() {
        return Object.values(this.participants.results).map((p: any) => ({
            rank: p.rank,
            account: parseAccount({ id: p._id, account: p.account }),
            email: p.account && p.account.email,
            tokens: p.account && parseConnectedAccounts(p.account),
            pointBalance: p.balance,
            subscription: p.isSubscribed ? 'Yes' : 'No',
            createdAt: p.createdAt,
            participant: p,
        }));
    }

    mounted() {
        this.getParticipants();
    }

    async getParticipants() {
        this.isLoading = true;
        await this.$store.dispatch('pools/listParticipants', {
            pool: this.pool,
            page: this.page,
            limit: this.limit,
        });
        this.isLoading = false;
    }

    onClickSort(variant: string, direction: string) {
        this.participants.results.sort((a, b) => {
            if (direction === 'asc') {
                return this.sorts[variant](a, b);
            } else if (direction === 'desc') {
                return this.sorts[variant](b, a);
            }
        });
    }

    onChangePage(page: number) {
        this.page = page;
        this.getParticipants();
    }

    onChangeLimit(limit: number) {
        this.page = 1;
        this.limit = limit;
        this.getParticipants();
    }
}
</script>
