const mongoose = require('mongoose')
const Schema = mongoose.Schema

const authSchema = new Schema({
    id:  {type: Number, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
},
    {timestamps: true})

const Auth = mongoose.model("auth", authSchema)

module.exports = Auth