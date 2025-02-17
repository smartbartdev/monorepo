export enum AccountPlanType {
    Starter = 0,
    Basic = 1,
    Premium = 2,
}

export interface IYoutube {
    channels: unknown;
    videos: unknown;
}

export interface ITwitter {
    tweets: unknown;
    users: unknown;
}

export interface IDiscord {
    guilds: unknown[];
}

export interface IMember {
    poolAddress: string;
    memberId: number;
    address: string;
}

export type IMemberByPage = { [page: number]: IMember[] };
