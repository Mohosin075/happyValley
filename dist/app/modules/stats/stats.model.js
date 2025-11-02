"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stats = void 0;
const mongoose_1 = require("mongoose");
const StatsSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    contentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Content' },
    platform: {
        type: String,
        enum: ['facebook', 'instagram', 'youtube', 'tiktok'],
        required: true,
    },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
});
exports.Stats = (0, mongoose_1.model)('Stats', StatsSchema);
