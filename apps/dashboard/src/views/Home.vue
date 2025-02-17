<template>
    <section class="section-home" v-if="account">
        <BaseModalRequestAccountEmailUpdate :pool="firstPool" :deploying="!firstPool" />
        <div class="container-xl">
            <b-jumbotron
                class="text-left mt-3 jumbotron-header"
                bg-variant="light"
                :style="{
                    'border-radius': '1rem',
                    'background-size': 'cover',
                    'background-image': `url(${require('../../public/assets/thx_jumbotron.webp')})`,
                }"
            >
                <b-container class="container-md py-5">
                    <b-badge variant="primary" class="p-2">Plan: {{ AccountPlanType[account.plan] }}</b-badge>
                    <p class="brand-text">
                        {{ 'Hi ' + (!account.firstName ? 'Anon' : account.firstName) }}
                    </p>
                    <div class="lead mb-3">Welcome to your campaign dashboard!</div>
                </b-container>
            </b-jumbotron>
        </div>
        <b-container class="container-md">
            <b-row>
                <b-col md="8">
                    <div class="text-muted mb-3">
                        Quests
                        <i
                            class="fas fa-info-circle text-gray ml-1"
                            v-b-tooltip
                            title="Your users earn points with quests."
                        />
                    </div>
                    <b-row>
                        <b-col md="6" :key="key" v-for="(q, key) of contentQuests">
                            <BaseCardHome
                                :loading="!firstPool"
                                :url="`/pool/${firstPool ? firstPool._id : 'unknown'}/quests`"
                                v-b-tooltip
                                :title="q.description"
                            >
                                <b-media>
                                    <template #aside>
                                        <div
                                            class="p-3 rounded d-flex align-items-center justify-content-center"
                                            style="width: 50px"
                                            :style="{ 'background-color': q.color }"
                                        >
                                            <i :class="q.icon" class="text-white" />
                                        </div>
                                    </template>
                                    {{ q.tag }}
                                    <p class="text-muted small mb-0">{{ q.title }}</p>
                                </b-media>
                            </BaseCardHome>
                        </b-col>
                    </b-row>
                </b-col>
                <b-col md="4">
                    <div class="text-muted mb-3">
                        Rewards
                        <i
                            class="fas fa-info-circle text-gray ml-1"
                            v-b-tooltip
                            title="Your users can redeem points for rewards."
                        />
                    </div>
                    <BaseCardHome
                        :key="key"
                        v-for="(q, key) of contentRewards"
                        :loading="!firstPool"
                        :url="`/pool/${firstPool ? firstPool._id : 'unknown'}/rewards`"
                        v-b-tooltip
                        :title="q.description"
                    >
                        <b-media>
                            <template #aside>
                                <div
                                    class="p-3 rounded d-flex align-items-center justify-content-center"
                                    style="width: 50px"
                                    :style="{ 'background-color': q.color }"
                                    v-b-tooltip.hover.bottom
                                    :title="q.description"
                                >
                                    <i :class="q.icon" class="text-white" />
                                </div>
                            </template>
                            {{ q.tag }}
                            <p class="text-muted small mb-0">{{ q.title }}</p>
                        </b-media>
                    </BaseCardHome>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="6">
                    <b-card
                        @click="$router.push('/coins')"
                        class="mt-3 mb-3 cursor-pointer"
                        :img-src="require('../../public/assets/thx_tokens.webp')"
                        img-alt="Image"
                        img-top
                    >
                        <strong>Coins</strong>
                        <p class="text-muted m-0">Users get rewards or import ERC-20 tokens as Coins.</p>
                    </b-card>
                </b-col>
                <b-col md="6">
                    <b-card
                        @click="$router.push('/nft')"
                        class="mt-3 mb-3 cursor-pointer"
                        :img-src="require('../../public/assets/thx_nft.webp')"
                        img-alt="Image"
                        img-top
                    >
                        <strong>NFT</strong>
                        <p class="text-muted m-0">Create or import ERC-721 token variations as NFT's.</p>
                    </b-card>
                </b-col>
            </b-row>
            <b-row>
                <b-col md="4">
                    <b-card
                        @click="$router.push(`/pool/${firstPool ? firstPool._id : 'unknown'}/settings/widget`)"
                        class="mt-3 mb-3 cursor-pointer"
                        :img-src="require('../../public/assets/thx-home-widget.png')"
                        img-alt="Image"
                        img-top
                    >
                        <strong>Widget</strong>
                        <p class="text-muted m-0">Embed and increase customer loyalty!</p>
                    </b-card>
                </b-col>
                <b-col md="4">
                    <b-card
                        @click="window.open(docsUrl, '_blank')"
                        class="mt-3 mb-3 cursor-pointer"
                        :img-src="require('../../public/assets/thx_docs.webp')"
                        img-alt="Image"
                        img-top
                    >
                        <strong>User Guides</strong>
                        <p class="text-muted m-0">Learn how to configure your Loyalty Campaign.</p>
                    </b-card>
                </b-col>
                <b-col md="4">
                    <b-card
                        @click="window.open('https://discord.com/invite/TzbbSmkE7Y', '_blank')"
                        class="mt-3 mb-3 cursor-pointer"
                        :img-src="require('../../public/assets/thx-home-discord.png')"
                        img-alt="Image"
                        img-top
                    >
                        <strong>Discord</strong>
                        <p class="text-muted m-0">If you need some help we are over here!</p>
                    </b-card>
                </b-col>
            </b-row>
        </b-container>
    </section>
</template>

<script lang="ts">
import { AccountPlanType } from '@thxnetwork/dashboard/types/account';
import { Component, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
import BaseModalRequestAccountEmailUpdate from '@thxnetwork/dashboard/components/modals/BaseModalRequestAccountEmailUpdate.vue';
import BaseCardHome from '@thxnetwork/dashboard/components/cards/BaseCardHome.vue';
import BaseCodeExample from '@thxnetwork/dashboard/components/BaseCodeExample.vue';
import { IPools } from '../store/modules/pools';
import { NODE_ENV } from '@thxnetwork/dashboard/config/secrets';
import { ChainId, QuestVariant } from '@thxnetwork/common/enums';
import { contentQuests, contentRewards } from '@thxnetwork/common/constants';

@Component({
    components: {
        BaseModalRequestAccountEmailUpdate,
        BaseCardHome,
        BaseCodeExample,
    },
    computed: mapGetters({
        account: 'account/profile',
        pools: 'pools/all',
    }),
})
export default class HomeView extends Vue {
    window = window;
    pools!: IPools;
    account!: TAccount;
    docsUrl = process.env.VUE_APP_DOCS_URL;
    AccountPlanType = AccountPlanType;
    QuestVariant = QuestVariant;
    contentQuests = contentQuests;
    contentRewards = contentRewards;

    get firstPool() {
        const pools = Object.values(this.pools);
        if (!pools.length) return;
        return pools[0];
    }

    async mounted() {
        await this.$store.dispatch('account/getProfile');
        await this.$store.dispatch('pools/list');

        if (!Object.values(this.pools).length) {
            this.$store.dispatch('pools/create', {
                chainId: NODE_ENV === 'production' ? ChainId.Polygon : ChainId.Hardhat,
            });
        }

        if (!this.account.website || !this.account.email || !this.account.role || !this.account.goal.length) {
            this.$bvModal.show('modalRequestAccountEmailUpdate');
        }
    }
}
</script>
<style scoped lang="scss">
.jumbotron-header > .container {
    background-repeat: no-repeat;
    background-position: 80% 25px;
    background-size: 350px auto;
}
</style>
