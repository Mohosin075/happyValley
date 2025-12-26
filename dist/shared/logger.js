"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.logger = void 0;
const path_1 = __importDefault(require("path"));
const winston_1 = require("winston");
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const fs_1 = __importDefault(require("fs"));
// Function to create the necessary directories if they don't exist
const createLogDirs = () => {
    const dirs = ['logs/winston/successes', 'logs/winston/errors'];
    dirs.forEach(dir => {
        if (!fs_1.default.existsSync(path_1.default.join(process.cwd(), dir))) {
            fs_1.default.mkdirSync(path_1.default.join(process.cwd(), dir), { recursive: true });
        }
    });
};
// Custom log format
const { combine, timestamp, label, printf } = winston_1.format;
const myFormat = printf((info) => {
    const { level, message, label, timestamp } = info;
    const date = new Date(timestamp);
    const hour = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `{${date.toDateString()} ${hour}:${minutes}:${seconds}} [${label}] ${level}: ${message}`;
});
createLogDirs(); // Ensure directories exist
// Success logger
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: combine(label({ label: 'happyValley 🚀' }), timestamp(), myFormat),
    transports: [
        new winston_1.transports.Console(),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(process.cwd(), 'logs', 'winston', 'successes', 'sg-%DATE%-success.log'),
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
});
exports.logger = logger;
// Error logger
const errorLogger = (0, winston_1.createLogger)({
    level: 'error', // This ensures that only error-level messages are logged
    format: combine(label({ label: 'happyValley 🐞' }), timestamp(), myFormat),
    transports: [
        new winston_1.transports.Console(),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(process.cwd(), 'logs', 'winston', 'errors', 'sg-%DATE%-error.log'),
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
});
exports.errorLogger = errorLogger;
