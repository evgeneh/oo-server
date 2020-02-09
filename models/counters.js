const mongoose = require('mongoose')
const Schema = mongoose.Schema

const countersSchema = new Schema({
    id:  {type: String, required: true, unique: true},
    seq: {type: Number, default: 50}
})

const Counters = mongoose.model("counter", countersSchema) //

module.exports = Counters