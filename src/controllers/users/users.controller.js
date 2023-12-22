import _ from 'lodash'
import makeDebug from 'debug'
import { User } from '../../models/index.js'
import { validateUniqueEmail, enforcePasswordPolicy, hashPassword, notifier, setUserAuthenticationCookie } from './users.utils.js'

const debug = makeDebug('controller:users')

// ---------
// | USERS |
// ---------

export const findUser = async (req, res) => {
  if (_.isEmpty(req.body)) {
    // Return all users
    try {
      const users = await User.find()
      res.status(200).json({ status: 200, data: users })
    } catch (error) {
      res.status(400).json({ status: 400, error })
    }
  } else {
    // Return filtered users
    try {
      const searchParams = req.body
      const filteredUsers = await User.find(searchParams)
      res.status(200).json({ status: 200, data: filteredUsers })
    } catch (error) {
      res.status(400).json({ status: 400, error })
    }
  }
}

export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body

  // Check presence of essential parameters
  if (!firstName) return res.status(400).json({ status: 400, message: 'Bad Request: Missing firstName parameter' })
  if (!lastName) return res.status(400).json({ status: 400, message: 'Bad Request: Missing lastName parameter' })
  if (!email) return res.status(400).json({ status: 400, message: 'Bad Request: Missing email parameter' })
  if (!password) return res.status(400).json({ status: 400, message: 'Bad Request: Missing password parameter' })

  // Validate prerequisites
  await validateUniqueEmail(email, res)
  enforcePasswordPolicy(password, res)
  if (res.statusCode === 400) return res

  try {
    // Create user
    debug('Creating user')
    const hashedPassword = await hashPassword(password)
    const user = await User.create({ firstName, lastName, email, password: hashedPassword })
    // Generate verify tokens
    await user.generateVerifyToken()
    await user.save()
    // Send welcome email
    debug('Send welcome email')
    await notifier('welcome', user)
    res.status(200).json({ status: 200, data: user })
    // Send user token cookie - Login
    setUserAuthenticationCookie(user, 201, res)
  } catch (error) {
    debug('User creation failed', error)
    res.status(400).json({ status: 400, error })
  }
}

export const updateUser = async (req, res) => {
  const { id, email, password } = req.body

  // Check presence of ID parameter
  if (!id) return res.status(400).json({ status: 400, message: 'Bad Request: Missing ID parameter' })
  if (!email && !password) return res.status(400).json({ status: 400, message: 'Bad Request: Missing email or password parameter' })

  // Check ID parameter validity
  try {
    await User.findById(id)
  } catch (error) {
    return res.status(400).json({ status: 400, message: 'Bad Request: Missing or invalid user ID parameter', error })
  }

  // Validate prerequisites
  if (email) await validateUniqueEmail(email, res)
  if (password) enforcePasswordPolicy(password, res)
  if (res.statusCode === 400) return res

  try {
    debug('Updating user')
    let updatedUser =  null
    if (password) {
      // Update user
      const hashedPassword = await hashPassword(password)
      updatedUser = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
      // Send email
      debug('Send an email to confirm the password change')
      await notifier('passwordChange', updatedUser)
    }
    if (email) {
      // Update user
      updatedUser = await User.findByIdAndUpdate(id, { email, isVerified: false }, { new: true })
      // Generate verify tokens
      await updatedUser.generateVerifyToken()
      await updatedUser.save()
      // Send email
      debug('Send an email to confirm the email change')
      await notifier('emailChange', updatedUser)
    }
    res.status(200).json({ status: 200, data: updatedUser })
  } catch (error) {
    console.log(error)
    debug('User update failed', error)
    res.status(400).json({ status: 400, error })
  }
}

export const deleteUser = async (req, res) => {
  const { id } = req.body

  // Check ID parameter validity
  const user = await User.findById(id)
  if (!user) return res.status(400).json({ status: 400, message: 'Bad Request: Missing or invalid user ID parameter', error })

  try {
    debug('Deleting user')
    await User.findByIdAndDelete(id)
    res.status(200).json({ status: 200, data: user })
  } catch (error) {
    debug('User deletion failed', error)
    res.status(400).json({ status: 400, error })
  }
}

// ------------------
// | AUTHENTICATION |
// ------------------

export const login = async (req, res) => {
  const { email, password } = req.body

  // Check presence of essential parameters
  if (!email) return res.status(400).json({ status: 400, message: 'Bad Request: Missing email parameter' })
  if (!password) return res.status(400).json({ status: 400, message: 'Bad Request: Missing password parameter' })

  // Check email parameter validity
  const user = await User.findOne({ email }).select('+password')
  if (!user) return res.status(400).json({ status: 400, message: 'Bad Request: Invalid email parameter' })

  // Check pasword parameter validity
  const isPasswordMatched = await user.comparePassword(password)
  if (!isPasswordMatched) return res.status(400).json({ status: 400, message: 'Bad Request: Invalid password parameter' })

  // Send user token cookie
  setUserAuthenticationCookie(user, 200, res)
}

export const logout = async (req, res, next) => {
  // Reset authentication cookie
  res.cookie('token', null, { expires: new Date(Date.now()), httpOnly: true })
  res.status(200).json({ status: 200, message: 'Logged out' })
}

// -----------
// | PASWORD |
// -----------

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body

  // Check presence of essential parameters
  if (!email) return res.status(400).json({ status: 400, message: 'Bad Request: Missing email parameter' })

  // Check email parameter validity
  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ status: 400, message: 'Bad Request: Invalid email parameter' })

  // Get verify tokens
  await user.generateVerifyToken()
  await user.save()

  // Send email
  try {
    debug('Send an email to reset password')
    await notifier('sendResetPwd', user)
    res.status(200).json({ status: 200, message: `Email sent to ${user.email} successfully` })
  } catch (error) {
    debug('Send an email failed', error)
    res.status(500).json({ status: 500, error })
  }
}

export const resetPassword = async (req, res, next) => {
  const { shortToken, email, password } = req.body

  // Check presence of required parameters
  if (!shortToken) return res.status(400).json({ status: 400, message: 'Bad Request: Missing shortToken parameter' })
  if (!email && !password) return res.status(400).json({ status: 400, message: 'Bad Request: Missing email or password parameter' })
 
  // Validate prerequisites
  enforcePasswordPolicy(password, res)
  if (res.statusCode === 400) return res

  // Check email parameter validity
  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ status: 400, message: 'Bad Request: Invalid email parameter' })

  // Check short token parameter validity
  if (shortToken !== user.verifyShortToken) return res.status(400).json({ status: 400, message: 'Bad Request: Invalid token parameter' })

  // Check short token parameter validity
  if (new Date(Date.now()) > user.verifyExpires) return res.status(400).json({ status: 400, message: 'Bad Request: Token is expired' })

  // Update user
  user.password = await hashPassword(password)
  user.verifyExpires = undefined
  user.verifyShortToken = undefined
  user.verifyToken = undefined
  await user.save()

  // Send user token cookie - Login
  setUserAuthenticationCookie(user, 200, res)

  // Send email
  try {
    debug('Send an email to confirm the password change')
    await notifier('passwordChange', user)
  } catch (error) {
    debug('Send an email failed', error)
    res.status(500).json({ status: 500, error })
  }
}

// -----------
// | ACCOUNT |
// -----------

export const resendVerifySignup = async (req, res, next) => {
  const { email } = req.body

  // Check presence of essential parameters
  if (!email) return res.status(400).json({ status: 400, message: 'Bad Request: Missing email parameter' })

  // Check email parameter validity
  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ status: 400, message: 'Bad Request: Invalid email parameter' })

  // Get verify tokens
  await user.generateVerifyToken()
  await user.save()

  // Send email
  try {
    debug('Send an email to resend short token')
    await notifier('resendVerifySignup', user)
    res.status(200).json({ status: 200, message: `Email sent to ${user.email} successfully` })
  } catch (error) {
    debug('Send an email failed', error)
    res.status(500).json({ status: 500, error })
  }
}

export const verifySignup = async (req, res, next) => {
  const { email, shortToken } = req.body

  // Check presence of essential parameters
  if (!email) return res.status(400).json({ status: 400, message: 'Bad Request: Missing email parameter' })
  if (!shortToken) return res.status(400).json({ status: 400, message: 'Bad Request: Missing shortToken parameter' })

  // Check email parameter validity
  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ status: 400, message: 'Bad Request: Invalid email parameter' })

  // Check short token parameter validity
  if (shortToken !== user.verifyShortToken) return res.status(400).json({ status: 400, message: 'Bad Request: Invalid token parameter' })

  // Check short token parameter validity
  if (new Date(Date.now()) > user.verifyExpires) return res.status(400).json({ status: 400, message: 'Bad Request: Token is expired' })

  // Update user
  user.isVerified = true
  user.verifyExpires = undefined
  user.verifyShortToken = undefined
  user.verifyToken = undefined
  await user.save()

  // Send email
  try {
    debug('Send an email to confirm email verification ')
    await notifier('verifySignup', user)
    res.status(200).json({ status: 200, message: `Email sent to ${user.email} successfully` })
  } catch (error) {
    debug('Send an email failed', error)
    res.status(500).json({ status: 500, error })
  }
}