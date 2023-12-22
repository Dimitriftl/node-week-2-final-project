import mongoose from 'mongoose'

const TagSchema = new mongoose.Schema({
  link: { type: String, required: true }
})

export const Tag = mongoose.model('Tag', TagSchema)
