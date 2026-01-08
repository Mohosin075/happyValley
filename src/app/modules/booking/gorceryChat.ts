import { Request, Response } from 'express'
import OpenAI from 'openai'
import { GroceryChat, Booking } from './booking.model'
import { Service } from '../service/service.model'
import { JwtPayload } from 'jsonwebtoken'
import catchAsync from '../../../shared/catchAsync'
import { itemExtractionSchema } from './booking.constants'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import config from '../../../config'

const client = new OpenAI({ apiKey: config.openAi_api_key })

// =============================================
// Kitchen Restock AI Chatbot - Message Handler
// =============================================
export const sendMessageToGroceryBot = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId, message } = req.body
    const user = req.user as JwtPayload & { authId: string }

    // Find or create session
    let session
    if (sessionId) {
      session = await GroceryChat.findById(sessionId)
    } else {
      // Best UX: Automatically find the latest 'draft' session for this user
      session = await GroceryChat.findOne({
        user: user.authId,
        status: 'draft',
      }).sort({ createdAt: -1 })
    }

    if (!session) {
      session = await GroceryChat.create({
        user: user.authId,
        items: [],
        conversationHistory: [],
        status: 'draft',
      })
    }

    // Add user message to conversation history
    session.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    })

    // Build conversation context for AI
    const conversationMessages = session.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    // Check if user wants to reuse past orders
    const lowerMessage = message.toLowerCase()
    if (
      lowerMessage.includes('past order') ||
      lowerMessage.includes('previous order') ||
      lowerMessage.includes('last order') ||
      lowerMessage.includes('reuse')
    ) {
      const pastOrders = await GroceryChat.find({
        user: user.authId,
        status: 'completed',
      })
        .sort({ createdAt: -1 })
        .limit(5)

      if (pastOrders.length > 0) {
        const pastOrderSummary = pastOrders
          .map((order, idx) => {
            const itemList = order.items
              .map(
                item =>
                  `${item.name} (${item.quantity}${item.brand ? `, ${item.brand}` : ''})`,
              )
              .join(', ')
            return `Order ${idx + 1}: ${itemList}`
          })
          .join('\n')

        const aiResponse = `I found your recent orders:\n\n${pastOrderSummary}\n\nWould you like me to add any of these items to your current list? Just let me know which order or specific items you'd like to reuse.`

        session.conversationHistory.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
        })
        await session.save()

        return sendResponse(res, {
          statusCode: StatusCodes.OK,
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
        })
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

Extract items using function calls when users mention one or more grocery items. If they mention multiple items, call the tool for each one.`,
          },
          ...conversationMessages,
        ],
        tools: [{ type: 'function', function: itemExtractionSchema }],
        tool_choice: 'auto',
      })

      const choice = aiExtract.choices[0]
      const toolCalls = choice.message.tool_calls

      // ========================================
      // If AI extracted items via function calls
      // ========================================
      if (choice.finish_reason === 'tool_calls' && toolCalls?.length) {
        const addedItems: any[] = []

        for (const toolCall of toolCalls) {
          const extracted = JSON.parse((toolCall as any).function.arguments)
          // Save extracted item with all details
          const newItem = {
            name: extracted.name,
            quantity: extracted.quantity,
            type: extracted.type || undefined,
            brand: extracted.brand || undefined,
          }
          session.items.push(newItem)
          addedItems.push(newItem)
        }

        // Generate kitchen-specific suggestion for the first item (to keep response concise)
        const firstItem = addedItems[0]
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
        })

        const suggestion =
          suggestionAI.choices[0].message.content ??
          'Items added to your kitchen restock list.'

        // Confirmation message
        const itemsListStr = addedItems
          .map(
            item =>
              `✓ Added: ${item.name} (${item.quantity})${item.brand ? ` - ${item.brand}` : ''}${item.type ? ` [${item.type}]` : ''}`,
          )
          .join('\n')

        const confirmationMessage = `${itemsListStr}\n\n${suggestion}\n\nAnything else you need for your kitchen?`

        session.conversationHistory.push({
          role: 'assistant',
          content: confirmationMessage,
          timestamp: new Date(),
        })
        await session.save()

        return sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: `${addedItems.length} item(s) added successfully`,
          data: {
            sessionId: session._id,
            addedItems,
            response: confirmationMessage,
            items: session.items,
          },
        })
      }

      // ========================================
      // If AI gave a conversational response
      // ========================================
      const aiResponse =
        choice.message.content ||
        "I'm here to help with your kitchen restock. What items do you need?"

      session.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      })
      await session.save()

      return sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Response generated',
        data: {
          sessionId: session._id,
          response: aiResponse,
          items: session.items,
        },
      })
    } catch (error: any) {
      if (
        error?.status === 429 ||
        error?.message?.includes('insufficient_quota') ||
        error?.message?.includes('exceeded your current quota')
      ) {
        return sendResponse(res, {
          statusCode: StatusCodes.TOO_MANY_REQUESTS,
          success: false,
          message:
            'The AI kitchen assistant is currently offline due to technical limits (quota exceeded). Please try again later.',
          data: null,
        })
      }
      throw error
    }
  },
)

// ====================================
// Confirm Kitchen Restock Order
// ====================================
export const confirmGroceryOrder = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.body

    const session = await GroceryChat.findById(sessionId)
    if (!session) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: 'Session not found',
        data: null,
      })
    }

    if (session.items.length === 0) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Cannot confirm order with no items',
        data: null,
      })
    }

    session.status = 'confirmed'
    await session.save()

    // ---------------------------------------------------------
    // INTEGRATION: Create a formal Booking record
    // ---------------------------------------------------------
    try {
      // 1. Find the "Grocery Restock" service (or create it if it doesn't exist)
      let groceryService = await Service.findOne({ name: 'Grocery Restock' })

      if (!groceryService) {
        // Fallback: search for any service related to kitchen/grocery
        groceryService = await Service.findOne({
          name: { $regex: /grocery|restock|kitchen/i },
        })
      }

      if (groceryService) {
        // 2. Prep service details from grocery items
        const serviceDetails = session.items.map(item => ({
          name: item.name,
          value: `${item.quantity}${item.brand ? ` (${item.brand})` : ''}${item.type ? ` [${item.type}]` : ''}`,
        }))

        // 3. Create the booking
        await Booking.create({
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
        })
      }
    } catch (bookingError) {
      console.error('Failed to create formal booking for grocery order:', bookingError)
      // We don't throw here to avoid failing the whole request since session is already marked confirmed
    }

    // Generate final summary
    const itemSummary = session.items
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.name} - ${item.quantity}${item.brand ? ` (${item.brand})` : ''}${item.type ? ` [${item.type}]` : ''}`,
      )
      .join('\n')

    const confirmationMessage = `✅ Your kitchen restock order has been confirmed and a booking record has been created!\n\nItems:\n${itemSummary}\n\nTotal items: ${session.items.length}\n\nYour order will be fulfilled using our chosen store. No budget or receipt requirements needed.`

    session.conversationHistory.push({
      role: 'assistant',
      content: confirmationMessage,
      timestamp: new Date(),
    })
    await session.save()

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Order confirmed successfully',
      data: {
        sessionId: session._id,
        items: session.items,
        response: confirmationMessage,
        status: session.status,
      },
    })
  },
)

// ====================================
// Get Past Orders for Reuse
// ====================================
export const getPastOrders = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload & { authId: string }

    const pastOrders = await GroceryChat.find({
      user: user.authId,
      status: { $in: ['confirmed', 'completed'] },
    })
      .sort({ createdAt: -1 })
      .limit(10)

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Past orders retrieved',
      data: pastOrders,
    })
  },
)

// ====================================
// Reuse Items from Past Order
// ====================================
export const reuseFromPastOrder = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId, pastOrderId } = req.body
    const user = req.user as JwtPayload & { authId: string }

    const session = await GroceryChat.findById(sessionId)
    const pastOrder = await GroceryChat.findById(pastOrderId)

    if (!session || !pastOrder) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: 'Session or past order not found',
        data: null,
      })
    }

    // Add items from past order
    session.items.push(...pastOrder.items)
    session.pastOrderReference = pastOrder._id

    const confirmationMessage = `✓ Added ${pastOrder.items.length} items from your past order.\n\nCurrent list now has ${session.items.length} items total.`

    session.conversationHistory.push({
      role: 'assistant',
      content: confirmationMessage,
      timestamp: new Date(),
    })
    await session.save()

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Items added from past order',
      data: {
        sessionId: session._id,
        items: session.items,
        response: confirmationMessage,
      },
    })
  },
)

// ====================================
// Get Single Grocery Session details
// ====================================
export const getSingleGrocerySession = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.params

    const session = await GroceryChat.findById(sessionId)
    if (!session) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: 'Session not found',
        data: null,
      })
    }

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Session retrieved successfully',
      data: session,
    })
  },
)

// ====================================
// Add Manual Items (No AI extraction)
// ====================================
export const addManualItems = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId, items } = req.body // items: array of { name, quantity, type?, brand? }

    const session = await GroceryChat.findById(sessionId)
    if (!session) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: 'Session not found',
        data: null,
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'Please provide an array of items',
        data: null,
      })
    }

    // Add items to session
    session.items.push(...items)

    const confirmationMessage = `✓ Manually added ${items.length} items to your list.`

    session.conversationHistory.push({
      role: 'assistant',
      content: confirmationMessage,
      timestamp: new Date(),
    })
    await session.save()

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Items added successfully',
      data: {
        sessionId: session._id,
        items: session.items,
        response: confirmationMessage,
      },
    })
  },
)

// ====================================
// Get Active Draft Session
// ====================================
export const getActiveSession = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload & { authId: string }

    const session = await GroceryChat.findOne({
      user: user.authId,
      status: 'draft',
    }).sort({ createdAt: -1 })

    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: session
        ? 'Active session retrieved'
        : 'No active session found',
      data: session || null,
    })
  },
)
