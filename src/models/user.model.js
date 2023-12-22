import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import config from 'config'
import jwt from 'jsonwebtoken'

const userSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  locale: { type: String, default: 'en' },
  isVerified: { type: Boolean, default: false },
  role: { type: Number, default: 0 },
  verifyShortToken: String,
  verifyToken: String,
  verifyExpires: Date
}, { versionKey: false })

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password)
}

userSchema.methods.generateJWT = function () {
  // Get jwt options
  const jwtOptions = config.authentication.jwtOptions
  // Create a signed jwt token
  return jwt.sign({ id: this._id }, jwtOptions.tokenSecret, { expiresIn: jwtOptions.expiresIn, algorithm: jwtOptions.algorithm })
}

// Generating verify token for password
userSchema.methods.generateVerifyToken = function () {
  // Set long token
  const verifyToken = crypto.randomBytes(20).toString('hex')
  this.verifyToken = crypto.createHash('sha256').update(verifyToken).digest('hex')
  // Set short token
  const verifyShortToken = Array.from({ length: config.authentication.shortTokenLength }, () => Math.floor(Math.random() * 10)).join('')
  this.verifyShortToken = verifyShortToken
  // Set expiry date
  this.verifyExpires = Date.now() + 15 * 60 * 1000

  return { verifyToken, verifyShortToken }
}

export const User = mongoose.model('User', userSchema)
