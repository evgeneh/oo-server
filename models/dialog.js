const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DialogSchema = Schema({
    _id: Schema.Types.ObjectId,

    owners:[ {type: Number}],
    messages: [{
        ownerId: Number,
        text: String,
        date: Date,
        isRead: Boolean
    }]
});

const Dialog = mongoose.model('dialog', DialogSchema)

module.exports = Dialog;
