import { Vue } from 'vue-property-decorator';
import axios from 'axios';
import { Module, VuexModule, Action, Mutation } from 'vuex-module-decorators';
import { ChainId } from '@thxnetwork/dashboard/types/enums/ChainId';
import { TERC20 } from '@thxnetwork/dashboard/types/erc20';
import { track } from '@thxnetwork/mixpanel';

export interface IPool {
    _id: string;
    variant: string;
    address: string;
    chainId: ChainId;
    rewardPollDuration: number;
    proposeWithdrawPollDuration: number;
    version: string;
    archived: boolean;
    title: string;
}

export interface IPoolAnalytic {
    _id: string;
    erc20Perks: [
        {
            day: string;
            totalAmount: number;
        },
    ];
    erc721Perks: [
        {
            day: string;
            totalAmount: number;
        },
    ];
    referralRewards: [
        {
            day: string;
            totalClaimPoints: number;
        },
    ];
    pointRewards: [
        {
            day: string;
            totalClaimPoints: number;
        },
    ];
    milestoneRewards: [
        {
            day: string;
            totalClaimPoints: number;
        },
    ];
}

export interface IPoolAnalyticLeaderBoard {
    _id: string;
    sub: string;
    score: number;
    name: string;
    email: string;
    address: string;
}

export interface IPoolAnalyticMetrics {
    _id: string;
    pointRewards: { totalClaimPoints: number };
    referralRewards: { totalClaimPoints: number };
    milestoneRewards: { totalClaimPoints: number };
    erc20Perks: { payments: number };
    erc721Perks: { payments: number };
}
export interface IPools {
    [id: string]: IPool;
}

export interface IPoolAnalytics {
    [id: string]: IPoolAnalytic;
}

export interface IPoolAnalyticsLeaderBoard {
    [id: string]: IPoolAnalyticLeaderBoard[];
}

export interface IPoolAnalyticsMetrics {
    [id: string]: IPoolAnalyticMetrics;
}

@Module({ namespaced: true })
class PoolModule extends VuexModule {
    _all: IPools = {};
    _analytics: IPoolAnalytics = {};
    _analyticsLeaderBoard: IPoolAnalyticsLeaderBoard = {};
    _analyticsMetrics: IPoolAnalyticsLeaderBoard = {};

    get all() {
        return this._all;
    }

    get analytics() {
        return this._analytics;
    }

    get analyticsLeaderBoard() {
        return this._analyticsLeaderBoard;
    }

    get analyticsMetrics() {
        return this._analyticsMetrics;
    }

    @Mutation
    set(pool: IPool) {
        Vue.set(this._all, pool._id, pool);
    }

    @Mutation
    setAnalytics(data: IPoolAnalytic) {
        Vue.set(this._analytics, data._id, data);
    }

    @Mutation
    setAnalyticsLeaderBoard(data: IPoolAnalyticLeaderBoard) {
        Vue.set(this._analyticsLeaderBoard, data._id, data);
    }

    @Mutation
    setAnalyticsMetrics(data: IPoolAnalyticMetrics) {
        Vue.set(this._analyticsMetrics, data._id, data);
    }

    @Mutation
    unset(pool: IPool) {
        Vue.delete(this._all, pool._id);
    }

    @Mutation
    clear() {
        Vue.set(this, '_all', {});
    }

    @Action({ rawError: true })
    async list(params: { archived?: boolean } = { archived: false }) {
        this.context.commit('clear');

        const r = await axios({
            method: 'GET',
            url: '/pools',
            params,
        });

        r.data.forEach((pool: IPool) => {
            this.context.commit('set', pool);
        });
    }

    @Action({ rawError: true })
    async read(_id: string) {
        const r = await axios({
            method: 'get',
            url: '/pools/' + _id,
        });

        this.context.commit('set', r.data);

        return r.data;
    }

    @Action({ rawError: true })
    async readAnalytics(payload: { poolId: string; startDate: Date; endDate: Date }) {
        const r = await axios({
            method: 'get',
            url: `/pools/${payload.poolId}/analytics`,
            params: { startDate: payload.startDate, endDate: payload.endDate },
        });

        this.context.commit('setAnalytics', r.data);
        return r.data;
    }

    @Action({ rawError: true })
    async readAnalyticsLeaderBoard(payload: { poolId: string }) {
        const r = await axios({
            method: 'get',
            url: `/pools/${payload.poolId}/analytics/leaderboard`,
        });

        this.context.commit('setAnalyticsLeaderBoard', { _id: payload.poolId, ...r.data });
        return r.data;
    }

    @Action({ rawError: true })
    async readAnalyticsMetrics(payload: { poolId: string }) {
        const r = await axios({
            method: 'get',
            url: `/pools/${payload.poolId}/analytics/metrics`,
        });
        this.context.commit('setAnalyticsMetrics', { _id: payload.poolId, ...r.data });
        return r.data;
    }

    @Action({ rawError: true })
    async create(payload: {
        network: number;
        token: string;
        erc20tokens: string[];
        erc721tokens: string[];
        variant: string;
        title: string;
    }) {
        const { data } = await axios({
            method: 'POST',
            url: '/pools',
            data: payload,
        });

        const r = await axios({
            method: 'GET',
            url: '/pools/' + data._id,
            headers: { 'X-PoolId': data._id },
        });

        const profile = this.context.rootGetters['account/profile'];
        track('UserCreates', [profile.sub, 'pool']);

        this.context.commit('set', r.data);
    }

    @Action({ rawError: true })
    async update({ pool, data }: { pool: IPool; data: { archived: boolean; title: string } }) {
        await axios({
            method: 'PATCH',
            url: '/pools/' + pool._id,
            data,
            headers: { 'X-PoolId': pool._id },
        });
        this.context.commit('set', { ...pool, ...data });

        if (data.archived) {
            this.context.commit('unset', pool);
        }
    }

    @Action({ rawError: true })
    async remove(pool: IPool) {
        await axios({
            method: 'DELETE',
            url: '/pools/' + pool._id,
            headers: { 'X-PoolId': pool._id },
        });

        this.context.commit('unset', pool);
    }

    @Action({ rawError: true })
    async topup({ erc20, amount, poolId }: { erc20: TERC20; amount: number; poolId: string }) {
        await axios({
            method: 'POST',
            url: '/pools/' + poolId + '/topup',
            data: { erc20Id: erc20._id, amount },
            headers: { 'X-PoolId': poolId },
        });
    }
}

export default PoolModule;
