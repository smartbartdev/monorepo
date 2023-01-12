import store from '@thxnetwork/dashboard/store';
import {
    assertAuthorization,
    redirectAccount,
    redirectConfirmationLink,
    redirectPasswordResetLink,
    redirectSignin,
    redirectSigninSilent,
    redirectSignout,
    redirectSignup,
    redirectVerifyEmail,
} from '@thxnetwork/dashboard/utils/guards';
import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
    {
        path: '/',
        component: () => import('../views/Home.vue'),
        beforeEnter: assertAuthorization,
    },
    {
        path: '/pools',
        component: () => import('../views/Pools.vue'),
        beforeEnter: assertAuthorization,
    },
    {
        name: 'pool',
        path: '/pool/:id',
        redirect: '/pool/:id/dashboard',
        component: () => import('../views/Pool.vue'),
        beforeEnter: assertAuthorization,
        children: [
            {
                path: 'dashboard',
                component: () => import('../views/pool/Dashboard.vue'),
            },
            {
                path: 'widget',
                component: () => import('../views/pool/Widget.vue'),
            },
            {
                path: 'points',
                component: () => import('../views/pool/Points.vue'),
            },
            {
                path: 'milestones'
                component: () => import('../views/pool/Milestones.vue')
            }
            {
                path: 'referrals',
                component: () => import('../views/pool/Referrals.vue'),
            },
            {
                path: 'erc20-perks',
                component: () => import('../views/pool/ERC20Perks.vue'),
            },
            {
                path: 'erc721-perks',
                component: () => import('../views/pool/ERC721Perks.vue'),
            },
            {
                path: 'clients',
                component: () => import('../views/pool/Clients.vue'),
            },
            {
                path: 'settings',
                component: () => import('../views/pool/Settings.vue'),
            },
            // {
            //     path: 'promotions',
            //     component: () => import('../views/pool/Promotions.vue'),
            // },
            // {
            //     path: 'members',
            //     component: () => import('../views/pool/Members.vue'),
            // },
            // {
            //     path: 'payments',
            //     component: () => import('../views/pool/Payments.vue'),
            // },
            // {
            //     path: 'erc20swaps',
            //     component: () => import('../views/pool/ERC20Swaps.vue'),
            // },
        ],
    },
    {
        path: '/coins',
        component: () => import('../views/Coins.vue'),
        beforeEnter: assertAuthorization,
    },
    {
        path: '/nft',
        component: () => import('../views/NFT.vue'),
        beforeEnter: assertAuthorization,
    },
    {
        name: 'metadata',
        path: '/nft/:erc721Id',
        redirect: '/nft/:erc721Id/metadata',
        component: () => import('../views/nft/NFT.vue'),
        beforeEnter: assertAuthorization,
        children: [
            {
                path: 'metadata',
                component: () => import('../views/nft/Metadata.vue'),
            },
        ],
    },
    {
        path: '/signin-oidc',
        component: () => import('../views/SigninRedirect.vue'),
    },
    {
        path: '/verify_email',
        beforeEnter: redirectVerifyEmail,
    },
    {
        path: '/reset',
        beforeEnter: redirectPasswordResetLink,
    },
    {
        path: '/account',
        beforeEnter: redirectAccount,
    },
    {
        path: '/signup',
        beforeEnter: redirectSignup,
    },

    {
        path: '/signout',
        beforeEnter: redirectSignout,
    },
    {
        path: '/verify',
        beforeEnter: redirectConfirmationLink,
    },
    {
        path: '/signin',
        beforeEnter: redirectSignin,
    },
    {
        path: '/silent-renew',
        beforeEnter: redirectSigninSilent,
    },
];

const router = new VueRouter({
    mode: 'history',
    scrollBehavior: function (to) {
        if (to.hash) {
            return { selector: to.hash };
            //Or for Vue 3:
            //return {el: to.hash}
        } else {
            return { x: 0, y: 0 };
        }
    },
    routes,
});

router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

    if (to.query.passwordResetToken) {
        await store.dispatch('account/signinRedirect', {
            passwordResetToken: to.query.passwordResetToken,
        });
    }

    try {
        const user = await store.dispatch('account/getUser');

        if (requiresAuth && !user) {
            await store.dispatch('account/signinRedirect', {
                signupToken: to.query.signup_token || null,
            });
        } else {
            return next();
        }
    } catch (err) {
        console.error(err);
    }
});

export default router;
