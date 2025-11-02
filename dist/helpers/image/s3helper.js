"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Helper = exports.deleteFromS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = __importDefault(require("../../config"));
const logger_1 = require("../../shared/logger");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const sharp_1 = __importDefault(require("sharp"));
const s3Client = new client_s3_1.S3Client({
    region: config_1.default.aws.region,
    credentials: {
        accessKeyId: config_1.default.aws.access_key_id,
        secretAccessKey: config_1.default.aws.secret_access_key,
    },
});
const getPublicUri = (fileKey) => {
    return `https://${config_1.default.aws.bucket_name}.s3.${config_1.default.aws.region}.amazonaws.com/${fileKey}`;
};
const uploadToS3 = async (file, folder) => {
    const fileKey = `${folder}/${Date.now().toString()}-${file.originalname}`;
    const params = {
        Bucket: config_1.default.aws.bucket_name,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    try {
        const command = new client_s3_1.PutObjectCommand(params);
        await s3Client.send(command);
        return getPublicUri(fileKey);
    }
    catch (error) {
        logger_1.logger.error('Error uploading to S3:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to upload file to S3');
    }
};
const deleteFromS3 = async (fileKey) => {
    const params = {
        Bucket: config_1.default.aws.bucket_name,
        Key: fileKey,
    };
    try {
        const command = new client_s3_1.DeleteObjectCommand(params);
        await s3Client.send(command);
        console.log('deleted');
    }
    catch (error) {
        logger_1.logger.error('Error deleting from S3:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete file to S3');
    }
};
exports.deleteFromS3 = deleteFromS3;
const uploadMultipleFilesToS3 = async (files, folder) => {
    if (!files || files.length === 0) {
        throw new Error('No files provided for upload');
    }
    const uploadPromises = files.map(async (file) => {
        // Validate file type
        if (file.mimetype.startsWith('image/')) {
            // process with sharp (resize/compress)
        }
        else if (file.mimetype.startsWith('video/')) {
            // upload as-is, no sharp
        }
        else {
            throw new Error('Unsupported file type');
        }
        // Generate unique file name
        const fileExtension = file.originalname.split('.').pop();
        const fileKey = `${folder}/${Date.now()}.${fileExtension}`;
        try {
            // Optimize image using sharp (resize, compress)
            const optimizedImage = await (0, sharp_1.default)(file.buffer)
                .resize(1024) // Resize to a max width of 1024px (optional)
                .jpeg({ quality: 80 }) // Compress to 80% quality (change for PNG/WebP)
                .toBuffer();
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileKey,
                Body: optimizedImage, // Upload optimized image
                ContentType: file.mimetype,
            };
            const command = new client_s3_1.PutObjectCommand(params);
            await s3Client.send(command);
            return getPublicUri(fileKey);
        }
        catch (error) {
            console.error('Error uploading file to S3:', error);
            return null; // Instead of throwing, return null to continue with other uploads
        }
    });
    // Use `Promise.allSettled` to avoid one failure blocking all uploads
    const results = await Promise.allSettled(uploadPromises);
    return results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
};
const uploadMultipleVideosToS3 = async (files, folder) => {
    if (!files || files.length === 0) {
        throw new Error("No video files provided for upload");
    }
    const uploadPromises = files.map(async (file) => {
        const fileExtension = file.originalname.split(".").pop();
        const fileKey = `${folder}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExtension}`;
        try {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileKey,
                Body: file.buffer, // Upload raw video
                ContentType: file.mimetype,
            };
            const command = new client_s3_1.PutObjectCommand(params);
            await s3Client.send(command);
            return getPublicUri(fileKey);
        }
        catch (error) {
            console.error("Error uploading video to S3:", error);
            return null;
        }
    });
    const results = await Promise.allSettled(uploadPromises);
    return results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => r.value);
};
exports.S3Helper = {
    uploadToS3,
    uploadMultipleFilesToS3,
    uploadMultipleVideosToS3,
    deleteFromS3: exports.deleteFromS3,
};
