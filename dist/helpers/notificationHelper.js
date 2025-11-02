"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const notifications_model_1 = require("../app/modules/notifications/notifications.model");
const logger_1 = require("../shared/logger");
const socket_1 = require("../utils/socket");
const pushnotificationHelper_1 = require("./pushnotificationHelper");
const sendNotification = async (from, to, title, body, deviceToken) => {
    try {
        console.log({ from, to });
        const result = await notifications_model_1.Notification.create({
            from,
            to,
            title,
            body,
            isRead: false,
        });
        console.log({ result });
        if (!result)
            logger_1.logger.warn('Notification not sent');
        const populatedResult = (await result.populate('from', { profile: 1, name: 1 })).populate('to', { profile: 1, name: 1 });
        socket_1.socket.emit('notification', populatedResult);
        if (deviceToken) {
            await (0, pushnotificationHelper_1.sendPushNotification)(deviceToken, title, body, { from, to });
        }
    }
    catch (err) {
        //@ts-ignore
        logger_1.logger.error(err, 'FROM NOTIFICATION HELPER');
    }
};
exports.sendNotification = sendNotification;
