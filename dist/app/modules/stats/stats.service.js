"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = exports.updateFacebookContentStats = void 0;
const content_model_1 = require("../content/content.model");
const content_constants_1 = require("../content/content.constants");
const mongoose_1 = require("mongoose");
const stats_model_1 = require("./stats.model");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enum/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const socialintegration_model_1 = require("../socialintegration/socialintegration.model");
const graphAPIHelper_1 = require("../../../helpers/graphAPIHelper");
const createStats = async (content, payload) => {
    // 🧠 Step 1: Verify admin user
    const newStats = await stats_model_1.Stats.create(payload);
    return newStats;
};
const getAllPlatformStats = async (user) => {
    const isAdminExist = await user_model_1.User.findOne({
        _id: user.authId,
        role: user_1.USER_ROLES.ADMIN,
    });
    if (!isAdminExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No admin user found for the provided ID. Please check and try again');
    }
    const allStats = await stats_model_1.Stats.find({});
    return allStats;
};
const getUserContentStats = async (user) => {
    const userId = new mongoose_1.Types.ObjectId(user.authId);
    // 🟦 Step 1: Basic published counts
    const stats = await content_model_1.Content.aggregate([
        {
            $match: {
                user: userId,
                status: content_constants_1.CONTENT_STATUS.PUBLISHED,
            },
        },
        {
            $group: {
                _id: '$contentType',
                total: { $sum: 1 },
            },
        },
    ]);
    // 🟨 Step 2: Weekly views & engagement for published content
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const engagementStats = await content_model_1.Content.aggregate([
        {
            $match: {
                user: userId,
                status: content_constants_1.CONTENT_STATUS.PUBLISHED,
                createdAt: { $gte: oneWeekAgo },
            },
        },
        {
            // 🧠 Calculate engagement and make sure stats fields are always numbers
            $addFields: {
                stats: {
                    likes: { $ifNull: ['$stats.likes', 0] },
                    comments: { $ifNull: ['$stats.comments', 0] },
                    shares: { $ifNull: ['$stats.shares', 0] },
                    views: { $ifNull: ['$stats.views', 0] },
                },
                engagement: {
                    $add: [
                        { $ifNull: ['$stats.likes', 0] },
                        { $ifNull: ['$stats.comments', 0] },
                        { $ifNull: ['$stats.shares', 0] },
                    ],
                },
            },
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$stats.views' },
                totalEngagement: { $sum: '$engagement' },
                totalContents: { $sum: 1 },
            },
        },
    ]);
    // 🟩 Step 3: Build result object
    const result = {
        postsPublished: 0,
        reelsPublished: 0,
        storiesCreated: 0,
        weeklyViews: 0,
        averageEngagementRate: 0,
    };
    // Fill counts
    for (const item of stats) {
        if (item._id === 'post')
            result.postsPublished = item.total;
        if (item._id === 'reel')
            result.reelsPublished = item.total;
        if (item._id === 'story')
            result.storiesCreated = item.total;
    }
    // Fill engagement data
    if (engagementStats.length > 0) {
        const { totalViews, totalEngagement } = engagementStats[0];
        result.weeklyViews = totalViews || 0;
        if (totalViews > 0) {
            result.averageEngagementRate = Number((totalEngagement / totalViews).toFixed(2));
        }
        else {
            result.averageEngagementRate = 0;
        }
    }
    // 📝 Return clean single-layer response
    return result;
};
const updateFacebookContentStats = async () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    let isRunning = false;
    if (isRunning)
        return console.log('⏳ Previous job still running...');
    isRunning = true;
    console.log('🕐 Running Facebook content stats update...');
    try {
        // Fetch all published Facebook contents
        const contents = await content_model_1.Content.find({
            status: content_constants_1.CONTENT_STATUS.PUBLISHED,
            platform: { $in: ['facebook'] },
        });
        for (const item of contents) {
            const containerId = item.facebookContainerId;
            const fbAccount = await socialintegration_model_1.Socialintegration.findOne({
                user: item.user,
                platform: 'facebook',
            });
            if (!((_a = fbAccount === null || fbAccount === void 0 ? void 0 : fbAccount.accounts) === null || _a === void 0 ? void 0 : _a.length))
                continue;
            const { pageAccessToken } = fbAccount.accounts[0];
            if (!pageAccessToken)
                continue;
            try {
                let payload;
                if (item.contentType === 'reel') {
                    // Reels-specific payload
                    const fbData = await (0, graphAPIHelper_1.getFacebookVideoFullDetails)(containerId, pageAccessToken);
                    payload = {
                        user: item.user,
                        contentId: item._id,
                        platform: 'facebook',
                        likes: (_b = fbData.likesCount) !== null && _b !== void 0 ? _b : 0,
                        comments: (_c = fbData.commentsCount) !== null && _c !== void 0 ? _c : 0,
                        shares: (_e = (_d = fbData.insights) === null || _d === void 0 ? void 0 : _d.total_video_shares) !== null && _e !== void 0 ? _e : 0,
                        views: (_g = (_f = fbData.insights) === null || _f === void 0 ? void 0 : _f.total_video_views) !== null && _g !== void 0 ? _g : 0,
                        // You can add reel-specific stats if needed, e.g. completionRate
                    };
                }
                else if (item.contentType === 'post') {
                    // Post-specific payload
                    const fbData = await (0, graphAPIHelper_1.getFacebookPhotoDetails)(containerId, pageAccessToken);
                    payload = {
                        user: item.user,
                        contentId: item._id,
                        platform: 'facebook',
                        likes: (_h = fbData.likesCount) !== null && _h !== void 0 ? _h : 0,
                        comments: (_j = fbData.commentsCount) !== null && _j !== void 0 ? _j : 0,
                        shares: (_k = fbData.sharesCount) !== null && _k !== void 0 ? _k : 0,
                        views: (_l = fbData.impressions) !== null && _l !== void 0 ? _l : 0,
                        // You can add post-specific stats if needed, e.g. saves
                    };
                }
                else {
                    continue; // skip other content types
                }
                // Upsert stats
                await stats_model_1.Stats.findOneAndUpdate({ contentId: item._id, platform: 'facebook', user: item.user }, payload, { upsert: true, new: true });
                console.log(`✅ Updated stats for content: ${item._id}`);
            }
            catch (err) {
                console.error(`❌ Error fetching FB data for ${item._id}:`, err);
            }
        }
        console.log('✨ Facebook stats update completed.');
    }
    catch (err) {
        console.error('❌ Error updating Facebook stats:', err);
    }
    finally {
        isRunning = false;
    }
};
exports.updateFacebookContentStats = updateFacebookContentStats;
exports.StatsService = {
    createStats,
    getUserContentStats,
    getAllPlatformStats,
};
