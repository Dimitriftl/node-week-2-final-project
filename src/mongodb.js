import mongoose from 'mongoose'
import { logger } from './logger.js'

export const connectMongodb = async () => {
  const connection = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWD}@cluster0.mzvon6w.mongodb.net/mondial-relay`
  await mongoose.connect(connection)
  mongoose.connection.on('error', () => logger.info('Mongodb connection error'))
  mongoose.connection.once('open', () => logger.info('Mongodb successful connection'))
}
