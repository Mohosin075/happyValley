"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const fileUploadHandler = () => {
    // Configure storage
    const storage = multer_1.default.memoryStorage();
    // File filter
    const filterFilter = async (req, file, cb) => {
        try {
            const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            const allowedMediaTypes = ['video/mp4', 'audio/mpeg'];
            const allowedDocTypes = ['application/pdf'];
            if (['image', 'license', 'signature', 'businessProfile'].includes(file.fieldname)) {
                if (allowedImageTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .jpeg, .png, .jpg file supported'));
                }
            }
            else if (file.fieldname === 'media') {
                if (allowedMediaTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .mp4, .mp3 file supported'));
                }
            }
            else if (file.fieldname === 'clips') {
                if (allowedMediaTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .mp4, .mp3 file supported'));
                }
            }
            else if (file.fieldname === 'doc') {
                if (allowedDocTypes.includes(file.mimetype)) {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only pdf supported'));
                }
            }
            else {
                cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This file is not supported'));
            }
        }
        catch (error) {
            cb(new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'File validation failed'));
        }
    };
    // Configure multer
    const upload = (0, multer_1.default)({
        storage: storage,
        fileFilter: filterFilter,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10 MB (adjust as needed)
            files: 10, // Maximum number of files allowed
        },
    }).fields([
        { name: 'image', maxCount: 5 },
        { name: 'media', maxCount: 3 },
        { name: 'doc', maxCount: 3 },
        { name: 'clips', maxCount: 3 },
    ]);
    // Process uploaded images with Sharp
    const processImages = async (req, res, next) => {
        if (!req.files)
            return next();
        try {
            const imageFields = ['image', 'license', 'signature', 'businessProfile'];
            // Process each image field
            for (const field of imageFields) {
                const files = req.files[field];
                if (!files)
                    continue;
                // Process each file in the field
                for (const file of files) {
                    if (!file.mimetype.startsWith('image'))
                        continue;
                    // Resize and optimize the image
                    const optimizedBuffer = await (0, sharp_1.default)(file.buffer)
                        .resize({ width: 1080, height: 1350 })
                        .jpeg({ quality: 80 }) // Compress with 80% quality
                        .png({ quality: 80 }) // Compress with 80% quality
                        .jpeg({ quality: 80 }) // Compress with 80% quality
                        .toBuffer();
                    // Replace the original buffer with the optimized one
                    file.buffer = optimizedBuffer;
                }
            }
            next();
        }
        catch (error) {
            next(new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Image processing failed'));
        }
    };
    // Return middleware chain
    return (req, res, next) => {
        upload(req, res, err => {
            if (err)
                return next(err);
            processImages(req, res, next);
        });
    };
};
exports.default = fileUploadHandler;
