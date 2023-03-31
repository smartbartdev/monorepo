import WalletProxy from '@thxnetwork/auth/proxies/WalletProxy';
import { ChainId } from '@thxnetwork/auth/types/enums/chainId';
import { AccountDocument } from '../models/Account';
import { AccountVariant } from '../types/enums/AccountVariant';
import { NODE_ENV } from '../config/secrets';

export async function createWallet(account: AccountDocument) {
    console.log('SONO QUIIIIII--------------------------------------------');
    let deploy: boolean, address: string;
    if (account.variant === AccountVariant.Metamask) {
        if (!account.address) return;
        deploy = true;
        address = account.address;
    }

    const sub = String(account._id);
    const chains = [];

    if (NODE_ENV === 'production') {
        chains.push(ChainId.Polygon);
    } else {
        chains.push(ChainId.Hardhat);
    }

    for (const chainId of chains) {
        const walletsCount = (await WalletProxy.get(sub, chainId)).length;
        if (!walletsCount) WalletProxy.create({ sub, chainId, forceSync: false, deploy, address });
    }
}
