"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reuseFromPastOrder = exports.getPastOrders = exports.confirmGroceryOrder = exports.sendMessageToGroceryBot = void 0;
const openai_1 = __importDefault(require("openai"));
const booking_model_1 = require("./booking.model");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const booking_constants_1 = require("./booking.constants");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const client = new openai_1.default({ apiKey: config_1.default.openAi_api_key });
// =============================================
// Kitchen Restock AI Chatbot - Message Handler
// =============================================
exports.sendMessageToGroceryBot = (0, catchAsync_1.default)(async (req, res) => {
    var _a;
    const { sessionId, message } = req.body;
    const user = req.user;
    // Find or create session
    let session = await booking_model_1.GroceryChat.findById(sessionId);
    if (!session) {
        session = await booking_model_1.GroceryChat.create({
            user: user.authId,
            items: [],
            conversationHistory: [],
            status: 'draft',
        });
    }
    // Add user message to conversation history
    session.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
    });
    // Build conversation context for AI
    const conversationMessages = session.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
    }));
    // Check if user wants to reuse past orders
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('past order') ||
        lowerMessage.includes('previous order') ||
        lowerMessage.includes('last order') ||
        lowerMessage.includes('reuse')) {
        const pastOrders = await booking_model_1.GroceryChat.find({
            user: user.authId,
            status: 'completed',
        })
            .sort({ createdAt: -1 })
            .limit(5);
        if (pastOrders.length > 0) {
            const pastOrderSummary = pastOrders
                .map((order, idx) => {
                const itemList = order.items
                    .map(item => `${item.name} (${item.quantity}${item.brand ? `, ${item.brand}` : ''})`)
                    .join(', ');
                return `Order ${idx + 1}: ${itemList}`;
            })
                .join('\n');
            const aiResponse = `I found your recent orders:\n\n${pastOrderSummary}\n\nWould you like me to add any of these items to your current list? Just let me know which order or specific items you'd like to reuse.`;
            session.conversationHistory.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
            });
            await session.save();
            return (0, sendResponse_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.OK,
                success: true,
                message: 'Past orders retrieved',
                data: {
                    sessionId: session._id,
                    response: aiResponse,
                    items: session.items,
                    pastOrders: pastOrders.map(order => ({
                        id: order._id,
                        items: order.items,
                    })),
                },
            });
        }
    }
    // -----------------------------------------
    // AI: Extract Kitchen Grocery Item Details
    // -----------------------------------------
    const aiExtract = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are a kitchen restock assistant for a professional kitchen. Your role is to:
1. Help collect grocery lists for kitchen restocking
2. Confirm item details including type, brand, and quantity
3. Provide kitchen-specific suggestions (storage tips, alternatives, freshness advice)
4. NOT provide general grocery shopping advice - focus on kitchen operations

Extract items using function calls when users mention specific grocery items.`,
            },
            ...conversationMessages,
        ],
        tools: [{ type: 'function', function: booking_constants_1.itemExtractionSchema }],
        tool_choice: 'auto',
    });
    const choice = aiExtract.choices[0];
    const toolCalls = choice.message.tool_calls;
    // ========================================
    // If AI extracted an item via function call
    // ========================================
    if (choice.finish_reason === 'tool_calls' && (toolCalls === null || toolCalls === void 0 ? void 0 : toolCalls.length)) {
        const firstToolCall = toolCalls[0];
        const extracted = JSON.parse(firstToolCall.function.arguments);
        // Save extracted item with all details
        session.items.push({
            name: extracted.name,
            quantity: extracted.quantity,
            type: extracted.type || undefined,
            brand: extracted.brand || undefined,
        });
        // Generate kitchen-specific suggestion
        const suggestionAI = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a kitchen management expert. Provide brief, practical advice about the grocery item for kitchen operations. Focus on:
- Storage recommendations
- Freshness indicators
- Kitchen-specific usage tips
- Alternative options if unavailable
Keep responses concise (2-3 sentences max).`,
                },
                {
                    role: 'user',
                    content: `Item: ${extracted.name}, Quantity: ${extracted.quantity}${extracted.type ? `, Type: ${extracted.type}` : ''}${extracted.brand ? `, Brand: ${extracted.brand}` : ''}`,
                },
            ],
        });
        const suggestion = (_a = suggestionAI.choices[0].message.content) !== null && _a !== void 0 ? _a : 'Item added to your kitchen restock list.';
        // Confirmation message
        const confirmationMessage = `✓ Added: ${extracted.name} (${extracted.quantity})${extracted.brand ? ` - ${extracted.brand}` : ''}${extracted.type ? ` [${extracted.type}]` : ''}\n\n${suggestion}\n\nAnything else you need for your kitchen?`;
        session.conversationHistory.push({
            role: 'assistant',
            content: confirmationMessage,
            timestamp: new Date(),
        });
        await session.save();
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.OK,
            success: true,
            message: 'Item added successfully',
            data: {
                sessionId: session._id,
                item: extracted,
                response: confirmationMessage,
                items: session.items,
            },
        });
    }
    // ========================================
    // If AI gave a conversational response
    // ========================================
    const aiResponse = choice.message.content ||
        "I'm here to help with your kitchen restock. What items do you need?";
    session.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
    });
    await session.save();
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Response generated',
        data: {
            sessionId: session._id,
            response: aiResponse,
            items: session.items,
        },
    });
});
// ====================================
// Confirm Kitchen Restock Order
// ====================================
exports.confirmGroceryOrder = (0, catchAsync_1.default)(async (req, res) => {
    const { sessionId } = req.body;
    const session = await booking_model_1.GroceryChat.findById(sessionId);
    if (!session) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: 'Session not found',
            data: null,
        });
    }
    if (session.items.length === 0) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: 'Cannot confirm order with no items',
            data: null,
        });
    }
    session.status = 'confirmed';
    await session.save();
    // Generate final summary
    const itemSummary = session.items
        .map((item, idx) => `${idx + 1}. ${item.name} - ${item.quantity}${item.brand ? ` (${item.brand})` : ''}${item.type ? ` [${item.type}]` : ''}`)
        .join('\n');
    const confirmationMessage = `✅ Your kitchen restock order has been confirmed!\n\nItems:\n${itemSummary}\n\nTotal items: ${session.items.length}\n\nYour order will be fulfilled using our chosen store. No budget or receipt requirements needed.`;
    session.conversationHistory.push({
        role: 'assistant',
        content: confirmationMessage,
        timestamp: new Date(),
    });
    await session.save();
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Order confirmed successfully',
        data: {
            sessionId: session._id,
            items: session.items,
            response: confirmationMessage,
            status: session.status,
        },
    });
});
// ====================================
// Get Past Orders for Reuse
// ====================================
exports.getPastOrders = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const pastOrders = await booking_model_1.GroceryChat.find({
        user: user.authId,
        status: { $in: ['confirmed', 'completed'] },
    })
        .sort({ createdAt: -1 })
        .limit(10);
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Past orders retrieved',
        data: pastOrders,
    });
});
// ====================================
// Reuse Items from Past Order
// ====================================
exports.reuseFromPastOrder = (0, catchAsync_1.default)(async (req, res) => {
    const { sessionId, pastOrderId } = req.body;
    const user = req.user;
    const session = await booking_model_1.GroceryChat.findById(sessionId);
    const pastOrder = await booking_model_1.GroceryChat.findById(pastOrderId);
    if (!session || !pastOrder) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: 'Session or past order not found',
            data: null,
        });
    }
    // Add items from past order
    session.items.push(...pastOrder.items);
    session.pastOrderReference = pastOrder._id;
    const confirmationMessage = `✓ Added ${pastOrder.items.length} items from your past order.\n\nCurrent list now has ${session.items.length} items total.`;
    session.conversationHistory.push({
        role: 'assistant',
        content: confirmationMessage,
        timestamp: new Date(),
    });
    await session.save();
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Items added from past order',
        data: {
            sessionId: session._id,
            items: session.items,
            response: confirmationMessage,
        },
    });
});
