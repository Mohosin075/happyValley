"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeItemFromGrocerySession = exports.getActiveSession = exports.addManualItems = exports.getSingleGrocerySession = exports.reuseFromPastOrder = exports.getPastOrders = exports.confirmGroceryOrder = exports.sendMessageToGroceryBot = void 0;
const openai_1 = __importDefault(require("openai"));
const booking_model_1 = require("./booking.model");
const service_model_1 = require("../service/service.model");
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
    var _a, _b, _c;
    const { sessionId, message } = req.body;
    const user = req.user;
    // Find or create session
    let session;
    if (sessionId) {
        session = await booking_model_1.GroceryChat.findById(sessionId);
    }
    else {
        // Best UX: Automatically find the latest 'draft' session for this user
        session = await booking_model_1.GroceryChat.findOne({
            user: user.authId,
            status: 'draft',
        }).sort({ createdAt: -1 });
    }
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
    try {
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
5. **Handle multiple items at once** - if a user provides a list, extract all items.
6. **Handle item removals** - if a user wants to remove an item, call the removal tool.

Extract items using function calls when users mention adding or removing grocery items. If they mention multiple additions or removals, call the tool for each one.`,
                },
                ...conversationMessages,
            ],
            tools: [
                { type: 'function', function: booking_constants_1.itemExtractionSchema },
                { type: 'function', function: booking_constants_1.itemRemovalSchema },
            ],
            tool_choice: 'auto',
        });
        const choice = aiExtract.choices[0];
        const toolCalls = choice.message.tool_calls;
        // ========================================
        // If AI extracted items via function calls
        // ========================================
        if (choice.finish_reason === 'tool_calls' && (toolCalls === null || toolCalls === void 0 ? void 0 : toolCalls.length)) {
            const addedItems = [];
            const removedItems = [];
            for (const toolCall of toolCalls) {
                const toolCallAny = toolCall;
                const extracted = JSON.parse(toolCallAny.function.arguments);
                if (toolCallAny.function.name === 'extract_grocery_item') {
                    // Save extracted item with all details
                    const newItem = {
                        name: extracted.name,
                        quantity: extracted.quantity,
                        type: extracted.type || undefined,
                        brand: extracted.brand || undefined,
                    };
                    session.items.push(newItem);
                    addedItems.push(newItem);
                }
                else if (toolCallAny.function.name === 'remove_grocery_item') {
                    const initialCount = session.items.length;
                    session.items = session.items.filter(item => item.name.toLowerCase() !== extracted.name.toLowerCase());
                    if (session.items.length < initialCount) {
                        removedItems.push(extracted.name);
                    }
                }
            }
            let confirmationMessage = '';
            if (addedItems.length > 0) {
                const itemsListStr = addedItems
                    .map(item => `✓ Added: ${item.name} (${item.quantity})${item.brand ? ` - ${item.brand}` : ''}${item.type ? ` [${item.type}]` : ''}`)
                    .join('\n');
                confirmationMessage += itemsListStr + '\n\n';
            }
            if (removedItems.length > 0) {
                confirmationMessage += `󰆴 Removed: ${removedItems.join(', ')}\n\n`;
            }
            // Generate kitchen-specific suggestion for the first added item
            let suggestion = 'Your grocery list has been updated.';
            if (addedItems.length > 0) {
                const firstItem = addedItems[0];
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
                            content: `Item: ${firstItem.name}, Quantity: ${firstItem.quantity}${firstItem.type ? `, Type: ${firstItem.type}` : ''}${firstItem.brand ? `, Brand: ${firstItem.brand}` : ''}`,
                        },
                    ],
                });
                suggestion =
                    (_a = suggestionAI.choices[0].message.content) !== null && _a !== void 0 ? _a : 'Items updated in your kitchen restock list.';
            }
            confirmationMessage += `${suggestion}\n\nAnything else you need for your kitchen?`;
            session.conversationHistory.push({
                role: 'assistant',
                content: confirmationMessage,
                timestamp: new Date(),
            });
            await session.save();
            return (0, sendResponse_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.OK,
                success: true,
                message: 'List updated successfully',
                data: {
                    sessionId: session._id,
                    addedItems,
                    removedItems,
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
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.status) === 429 ||
            ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes('insufficient_quota')) ||
            ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.includes('exceeded your current quota'))) {
            return (0, sendResponse_1.default)(res, {
                statusCode: http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS,
                success: false,
                message: 'The AI kitchen assistant is currently offline due to technical limits (quota exceeded). Please try again later.',
                data: null,
            });
        }
        throw error;
    }
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
    // ---------------------------------------------------------
    // INTEGRATION: Create a formal Booking record
    // ---------------------------------------------------------
    try {
        // 1. Find the "Grocery Restock" service (or create it if it doesn't exist)
        let groceryService = await service_model_1.Service.findOne({ name: 'Grocery Restock' });
        if (!groceryService) {
            // Fallback: search for any service related to kitchen/grocery
            groceryService = await service_model_1.Service.findOne({
                name: { $regex: /grocery|restock|kitchen/i },
            });
        }
        if (groceryService) {
            // 2. Prep service details from grocery items
            const serviceDetails = session.items.map(item => ({
                name: item.name,
                value: `${item.quantity}${item.brand ? ` (${item.brand})` : ''}${item.type ? ` [${item.type}]` : ''}`,
            }));
            // 3. Create the booking
            await booking_model_1.Booking.create({
                user: session.user,
                service: groceryService._id,
                date: new Date(),
                status: 'confirmed',
                price: 0, // AI grocery booking is usually free or handled separately
                serviceType: {
                    title: 'AI Grocery Restock',
                    description: `Automated restock list for ${session.items.length} items.`,
                },
                serviceDetails,
                notes: `Session ID: ${session._id}`,
            });
        }
    }
    catch (bookingError) {
        console.error('Failed to create formal booking for grocery order:', bookingError);
        // We don't throw here to avoid failing the whole request since session is already marked confirmed
    }
    // Generate final summary
    const itemSummary = session.items
        .map((item, idx) => `${idx + 1}. ${item.name} - ${item.quantity}${item.brand ? ` (${item.brand})` : ''}${item.type ? ` [${item.type}]` : ''}`)
        .join('\n');
    const confirmationMessage = `✅ Your kitchen restock order has been confirmed and a booking record has been created!\n\nItems:\n${itemSummary}\n\nTotal items: ${session.items.length}\n\nYour order will be fulfilled using our chosen store. No budget or receipt requirements needed.`;
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
// ====================================
// Get Single Grocery Session details
// ====================================
exports.getSingleGrocerySession = (0, catchAsync_1.default)(async (req, res) => {
    const { sessionId } = req.params;
    const session = await booking_model_1.GroceryChat.findById(sessionId);
    if (!session) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: 'Session not found',
            data: null,
        });
    }
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Session retrieved successfully',
        data: session,
    });
});
// ====================================
// Add Manual Items (No AI extraction)
// ====================================
exports.addManualItems = (0, catchAsync_1.default)(async (req, res) => {
    const { sessionId, items } = req.body; // items: array of { name, quantity, type?, brand? }
    const session = await booking_model_1.GroceryChat.findById(sessionId);
    if (!session) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: 'Session not found',
            data: null,
        });
    }
    if (!Array.isArray(items) || items.length === 0) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: 'Please provide an array of items',
            data: null,
        });
    }
    // Add items to session
    session.items.push(...items);
    const confirmationMessage = `✓ Manually added ${items.length} items to your list.`;
    session.conversationHistory.push({
        role: 'assistant',
        content: confirmationMessage,
        timestamp: new Date(),
    });
    await session.save();
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Items added successfully',
        data: {
            sessionId: session._id,
            items: session.items,
            response: confirmationMessage,
        },
    });
});
// ====================================
// Get Active Draft Session
// ====================================
exports.getActiveSession = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const session = await booking_model_1.GroceryChat.findOne({
        user: user.authId,
        status: 'draft',
    }).sort({ createdAt: -1 });
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: session
            ? 'Active session retrieved'
            : 'No active session found',
        data: session || null,
    });
});
// ====================================
// Remove single item from session
// ====================================
exports.removeItemFromGrocerySession = (0, catchAsync_1.default)(async (req, res) => {
    const { sessionId, itemId } = req.body;
    const user = req.user;
    let session;
    if (sessionId) {
        session = await booking_model_1.GroceryChat.findById(sessionId);
    }
    else {
        session = await booking_model_1.GroceryChat.findOne({
            user: user.authId,
            status: 'draft',
        }).sort({ createdAt: -1 });
    }
    if (!session) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: 'Session not found',
            data: null,
        });
    }
    const initialLength = session.items.length;
    session.items = session.items.filter((item) => item._id.toString() !== itemId);
    if (session.items.length === initialLength) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: 'Item not found in this session',
            data: null,
        });
    }
    await session.save();
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Item removed successfully',
        data: session,
    });
});
