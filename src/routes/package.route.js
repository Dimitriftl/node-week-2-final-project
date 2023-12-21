import express from 'express'
import { createTag } from '../controllers/index.js'

export function packageRoute () {
  const router = express.Router()
  router.route('/package').post(createTag)
  return router
}