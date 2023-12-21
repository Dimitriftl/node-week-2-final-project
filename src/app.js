import express from 'express'
import cors from 'cors'
import { connectMongodb } from './mongodb.js'
import { initializeRoutes } from './routes/index.js'

export default function application () {
  const app = express()

  // Enable CORS, security, and body parsing
  app.use(cors())
  const bodyParserConfig = { limit: 10 * 1024 * 1024 }// 10MB
  app.use(express.json(bodyParserConfig))
  app.use(express.urlencoded({ extended: true }))
  // Connect to DB
  connectMongodb()
  // Initialize routes
  initializeRoutes(app)
  // Configure a middleware for 404s
  app.use((req, res, next) => {
    res.status(404).send('<h1>Page not found on the server</h1>')
  })

  return app
}
