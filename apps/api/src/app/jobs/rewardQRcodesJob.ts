import { Job } from 'agenda';
import axios from 'axios';
import stream from 'stream';
import path from 'path';
import { API_URL, AWS_S3_PRIVATE_BUCKET_NAME, DASHBOARD_URL, WALLET_URL } from '@thxnetwork/api/config/secrets';
import AccountProxy from '@thxnetwork/api/proxies/AccountProxy';
import AssetPoolService from '@thxnetwork/api/services/AssetPoolService';
import BrandService from '@thxnetwork/api/services/BrandService';
import ClaimService from '@thxnetwork/api/services/ClaimService';
import ImageService from '@thxnetwork/api/services/ImageService';
import MailService from '@thxnetwork/api/services/MailService';
import { ClaimDocument } from '@thxnetwork/api/types/TClaim';
import { logger } from '@thxnetwork/api/util/logger';
import { s3PrivateClient } from '@thxnetwork/api/util/s3';
import { createArchiver } from '@thxnetwork/api/util/zip';
import { Upload } from '@aws-sdk/lib-storage';
import ejs from 'ejs';
import { assetsPath } from '../util/path';
import { findRewardById } from '../controllers/rewards-utils';

const mailTemplatePath = path.join(assetsPath, 'views', 'email');

export const generateRewardQRCodesJob = async ({ attrs }: Job) => {
    if (!attrs.data) return;

    try {
        const { poolId, rewardId, sub, fileName } = attrs.data;

        const pool = await AssetPoolService.getById(poolId);
        if (!pool) throw new Error('Reward not found');

        const reward = await findRewardById(rewardId);
        if (!reward) throw new Error('Reward not found');

        const account = await AccountProxy.getById(sub);
        if (!account) throw new Error('Account not found');
        if (!account.email) throw new Error('E-mail address for account not set');

        const claims = await ClaimService.findByReward(reward);
        if (!claims.length) throw new Error('Claims not found');

        let logoPath: string, logoBuffer: Buffer;

        const brand = await BrandService.get(poolId);
        if (brand && brand.logoImgUrl) {
            try {
                const response = await axios.get(brand.logoImgUrl, { responseType: 'arraybuffer' });
                logoBuffer = Buffer.from(response.data, 'utf-8');
            } catch {
                // Fail silently and fallback to default logo img
            }
        } else {
            logoPath = path.resolve(assetsPath, 'qr-logo.jpg');
        }
        const logo = logoPath || logoBuffer;

        // Create an instance of jsZip and build an archive
        const { jsZip, archive } = createArchiver();

        // Create QR code for every claim
        await Promise.all(
            claims.map(async ({ id }: ClaimDocument) => {
                const base64Data: string = await ImageService.createQRCode(`${WALLET_URL}/claim/${id}`, logo);
                // Adds file to the qrcode archive
                return archive.file(`${id}.png`, base64Data, { base64: true });
            }),
        );

        const uploadStream = new stream.PassThrough();
        jsZip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(uploadStream);

        const multipartUpload = new Upload({
            client: s3PrivateClient,
            params: {
                Key: fileName,
                Bucket: AWS_S3_PRIVATE_BUCKET_NAME,
                Body: uploadStream,
            },
        });

        await multipartUpload.done();

        const dashboardUrl = `${DASHBOARD_URL}/pool/${reward.poolId}/rewards`;
        const html = await ejs.renderFile(
            path.resolve(mailTemplatePath, 'qrcodesReady.ejs'),
            {
                dashboardUrl,
                baseUrl: API_URL,
            },
            { async: true },
        );

        await MailService.send(account.email, 'Your QR codes are ready!', html);
    } catch (error) {
        logger.error(error);
    }
};
