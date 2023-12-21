import express from 'express'
import { findRelay } from '../controllers/index.js'

export function relayPointRoute () {
  const router = express.Router()
  router.route('/relay-point').post(findRelay)
  return router
}