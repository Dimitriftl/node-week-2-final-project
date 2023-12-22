import config from 'config'
import bcrypt from 'bcrypt'
import _ from 'lodash'
import { logger } from '../../logger.js'
import nodemailer from 'nodemailer'
import { htmlTemplate } from '../../../config/email-templates.js'
import makeDebug from 'debug'
import { User } from '../../models/index.js'

const debug = makeDebug('controller:users:utils')

export function enforcePasswordPolicy (password, res) {
  const passwordPolicy = config.passwordPolicy

  debug('Check minimum password length')
  if (password.length < passwordPolicy.minLength) res.status(400).json({status: 400, message: 'The provided password does not comply to the password policy', translationKey: 'WEAK_PASSWORD_MIN' })
  debug('Check maximum password length')
  if (password.length > passwordPolicy.maxLength) res.status(400).json({status: 400, message: 'The provided password does not comply to the password policy', translationKey: 'WEAK_PASSWORD_MAX' })
  debug('CCheck that the password contains a capital letter')
  if (passwordPolicy.uppercase && !/[A-Z]/.test(password)) res.status(400).json({status: 400, message: 'The provided password does not comply to the password policy', translationKey: 'WEAK_PASSWORD_UPPERCASE' })
  debug('Check that the password contains a lowercase letter')
  if (passwordPolicy.lowercase && !/[a-z]/.test(password)) res.status(400).json({status: 400, message: 'The provided password does not comply to the password policy', translationKey: 'WEAK_PASSWORD_LOWERCASE' })
  debug('Check that the password contains a number')
  if (passwordPolicy.digits && !/\d/.test(password)) res.status(400).json({status: 400, message: 'The provided password does not comply to the password policy', translationKey: 'WEAK_PASSWORD_DIGITS' })
  debug('Check that the password contains a symbol')
  if (passwordPolicy.symbols && !/[ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password)) res.status(400).json({status: 400, message: 'The provided password does not comply to the password policy', translationKey: 'WEAK_PASSWORD_SYMBOLS' })
  debug('Check if the password is prohibited')
  _.forEach(passwordPolicy.prohibited, passwordProhibited => {
    if (passwordProhibited === password) res.status(400).json({status: 400, message: 'The provided password does not comply to the password policy', translationKey: 'WEAK_PASSWORD_ONEOF' })
  })
}

export function hashPassword (password) {
  return bcrypt.hash(password, config.bcrypt.saltRounds)
}

export async function validateUniqueEmail (email, res) {
  debug('Validate unique email')
  const users = await User.find({ email })
  if (!_.isEmpty(users)) res.status(400).json({ status: 400, message: 'This email has already been used', translationKey: 'WEAK_EMAIL' }) 
} 

export async function notifier (type, user) {
  
  // Create mailer transporter
  const transporter = await nodemailer.createTransport(config.mailer)

  const email = {
    from: config.mailer.auth.user,
    to: user.email,
    domainPath: config.domain
  }

  // Build the subject to perform the different actions
  switch (type) {
    case 'welcome': // inform that user's email has now changed
      user.locale === 'fr' ? email.subject = 'Bienvenue' : email.subject = 'Welcome'
      break
    case 'passwordChange': // inform that user's password is now changed
      user.locale === 'fr' ? email.subject = 'Votre mot de passe a été modifié' : email.subject = 'Your password was changed'
      break
    case 'emailChange': // inform that user's email has now changed
      user.locale === 'fr' ? email.subject = 'Votre adresse e-mail a été modifiée' : email.subject = 'Your email was changed'
      break
    case 'resendVerifySignup': // send another email with token for verifying user's email addr
      user.locale === 'fr' ? email.subject = 'Confirmez votre inscription' : email.subject = 'Confirm your signup'
      break
    case 'verifySignup': // inform that user's email is now confirmed
      user.locale === 'fr' ? email.subject = 'Merci, votre email a été vérifié' : email.subject = 'Thank you, your email has been verified'
      break
    case 'sendResetPwd': // send email with token to reset password
      user.locale === 'fr' ? email.subject = 'Réinitialiser votre mot de passe' : email.subject = 'Reset your password'
      break

  }

  // Errors does not seem to be correctly catched by the caller
  // so we catch them here to avoid any problem
  try {
    email.html = htmlTemplate(type, user, email)
    debug('Sending email ', email)
    await transporter.sendMail(email)
  } catch (error) {
    debug('Sending email failed', error)
    logger.error(error)
  }  
}

export function setUserAuthenticationCookie (user, statusCode, res) {
  // Generate JWT token
  const token = user.generateJWT()
  // Cookie options
  const options = {
    expires: new Date(Date.now() + config.authentication.cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true
  }
  // Send user token cookie
  debug('Send user authentication cookie ')
  res.status(statusCode).cookie('token', token, options).json({ status: statusCode, data: { user, token }})
}