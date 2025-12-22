import colors from 'colors'
import { Server } from 'socket.io'
import { logger } from '../shared/logger'

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'))

    // join room
    socket.on('join', (userId: string) => {
      socket.join(`user_${userId}`)
      logger.info(colors.green(`User ${userId} joined their private room user_${userId}`))
    })

    //disconnect
    socket.on('disconnect', () => {
      logger.info(colors.red('A user disconnect'))
    })
  })
}

export const socketHelper = { socket }
