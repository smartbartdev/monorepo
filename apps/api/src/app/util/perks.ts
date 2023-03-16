import mongoose from 'mongoose';
import { ERC20PerkDocument } from '../models/ERC20Perk';
import { ERC20PerkPayment } from '../models/ERC20PerkPayment';
import { ERC721PerkDocument } from '../models/ERC721Perk';
import { ERC721PerkPayment } from '../models/ERC721PerkPayment';
import { ClaimDocument } from '../types/TClaim';
import { BadRequestError } from './errors';
import { isTERC20Perk, isTERC721Perk } from './rewards';

type PerkDocument = ERC20PerkDocument | ERC721PerkDocument;

function getPaymentModel(perk: PerkDocument): mongoose.Model<any> {
    if (isTERC20Perk(perk)) {
        return ERC20PerkPayment;
    }
    if (isTERC721Perk(perk)) {
        return ERC721PerkPayment;
    }
}

export const redeemValidation = async ({
    perk,
    sub,
    claim,
}: {
    perk: ERC20PerkDocument | ERC721PerkDocument;
    sub?: string;
    claim?: ClaimDocument;
}): Promise<{ isError: boolean; errorMessage?: string }> => {
    const model = getPaymentModel(perk);
    if (!model) throw new BadRequestError('Could not determine payment model for this claim.');

    // Can be claimed only before the expiry date
    if (perk.expiryDate && new Date(perk.expiryDate).getTime() < Date.now()) {
        return { isError: true, errorMessage: 'This perk claim has expired.' };
    }

    // Can only be claimed for the amount of times per perk specified in the rewardLimit
    if (perk.rewardLimit > 0) {
        const amountOfPayments = await model.countDocuments({ perkId: perk._id });
        if (amountOfPayments >= perk.rewardLimit) {
            return { isError: true, errorMessage: "This perk has reached it's limit." };
        }
    }

    // Can only be claimed for the amount of times per sub specified in the claimLimit
    if (sub) {
        const amountOfPaymentsPerSub = await model.countDocuments({ perkId: perk._id, sub });
        if (perk.claimLimit > 0 && amountOfPaymentsPerSub >= perk.claimLimit) {
            return { isError: true, errorMessage: 'You have claimed this perk for the maximum amount of times.' };
        }
    }

    // Can not be claimed when sub is set for this claim URL and claim amount is greater than 1
    if (claim && claim.sub && perk.claimAmount > 1) {
        return { isError: true, errorMessage: 'This perk has been claimed by someone else.' };
    }

    return { isError: false };
};
