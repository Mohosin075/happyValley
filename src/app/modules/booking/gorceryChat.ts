import { Request, Response } from 'express'
import OpenAI from 'openai'
import { GroceryChat } from './booking.model'
import { JwtPayload } from 'jsonwebtoken'
import catchAsync from '../../../shared/catchAsync'
import { itemExtractionSchema } from './booking.constants'
import config from '../../../config'

const client = new OpenAI({ apiKey: config.openAi_api_key })

// --- Grocery Bot Messaging ---
export const sendMessageToGroceryBot = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId, message } = req.body
    const user = req.user as JwtPayload & { authId: string }

    console.log('user', user)

    console.log({ message})

    // Fetch or create chat session
    let session = await GroceryChat.findById(sessionId)
    if (!session) {
      session = await GroceryChat.create({
        user: user.authId,
        items: [],
      })
    }

    const aiResponse = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful grocery assistant. Extract grocery items when mentioned.',
        },
        { role: 'user', content: message },
      ],
      tools: [{ type: 'function', function: itemExtractionSchema }],
      tool_choice: 'auto',
    })

    const choice = aiResponse.choices[0]

    const toolCalls = choice.message.tool_calls
    if (
      choice.finish_reason === 'tool_calls' &&
      toolCalls &&
      toolCalls.length
    ) {
      const firstToolCall = toolCalls[0] as any
      if (
        firstToolCall.type === 'function' &&
        firstToolCall.function?.arguments
      ) {
        const extracted = JSON.parse(firstToolCall.function.arguments)

        session.items.push({
          name: extracted.name,
          quantity: extracted.quantity,
        })

        await session.save()

        res.status(200).json({
          success: true,
          message: `Added to your list: ${extracted.name} (${extracted.quantity})`,
          session,
        })
        return
      }
    }

    const text = choice.message.content || ''
    res.status(200).json({
      success: true,
      message: text,
      session,
    })
    return
  },
)

// --- Confirm Grocery Order ---
export const confirmGroceryOrder = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.body

    const session = await GroceryChat.findById(sessionId)
    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found',
      })
      return
    }

    // Mark session as confirmed
    session.status = 'confirmed'
    await session.save()

    res.status(200).json({
      success: true,
      message:
        'Your order is confirmed. Please provide delivery address & time.',
      data: session,
    })
    return
  },
)
