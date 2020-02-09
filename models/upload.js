const mongoose = require('mongoose')
const Schema = mongoose.Schema

const uploadSchema = new Schema({
  owner: {
      type: Number,
      ref: 'Profile'
  }  ,
  path: {
      type: String,
      requied: true
  },
  preview: {type: String}
},
{
    timestamps: true
})

const Upload = mongoose.model("upload", uploadSchema)

module.exports = Upload;