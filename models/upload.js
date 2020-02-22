const mongoose = require('mongoose')
const Schema = mongoose.Schema

const uploadSchema = new Schema({
  owner: {
      type: Number,
      ref: 'profile'
  }  ,
  path: {
      type: String,
      required: true
  },
  preview: {type: String},

  description: {type: String}
},
{
    timestamps: true
})

const Upload = mongoose.model("upload", uploadSchema)

module.exports = Upload;