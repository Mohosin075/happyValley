import colors from 'colors'
import { Server } from 'socket.io'
import { logger } from '../shared/logger'

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'))


    // Join a room based on userId
    socket.on('join', (userId: string) => {
      socket.join(userId);
      logger.info(colors.green(`User ${userId} joined their private room`))
    });

    //disconnect
    socket.on('disconnect', () => {
      logger.info(colors.red('A user disconnect'))
    })
  })
}

export const socketHelper = { socket }
