import { relayPointRoute } from './relayPoint.route.js'
import { packageRoute } from './package.route.js'

export const initializeRoutes = (app) => {
  const apiPath = '/api'
  app.use(apiPath, relayPointRoute())
  app.use(apiPath, packageRoute())
}