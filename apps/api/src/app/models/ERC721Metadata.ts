import mongoose from 'mongoose';
import type { TERC721Metadata } from '@thxnetwork/api/types/TERC721';

export type ERC721MetadataDocument = mongoose.Document & TERC721Metadata;

const schema = new mongoose.Schema(
    {
        erc721Id: String,
        imageUrl: String,
        name: String,
        image: String,
        description: String,
        externalUrl: String,
    },
    { timestamps: true },
);
export const ERC721Metadata = mongoose.model<ERC721MetadataDocument>('ERC721Metadata', schema, 'erc721metadata');
