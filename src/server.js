import { logger } from './logger.js'

export default async function runServer (app) {
  process.on('unhandledRejection', (reason, p) =>
    logger.error('Unhandled Rejection at: Promise ', reason)
  )
  logger.info(`Configuring HTTP server with at port ${3000}`)
  await app.listen(3000)
  logger.info('Server started listening')
}