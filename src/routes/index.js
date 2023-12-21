import { relayPointRoute } from './relayPoint.route.js'

export const initializeRoutes = (app) => {
  const apiPath = '/api'
  app.use(apiPath, relayPointRoute())
}