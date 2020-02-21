const mongoose = require('mongoose')
const Schema = mongoose.Schema


const WallPostSchema = Schema({
     _id: Schema.Types.ObjectId,
    owner:  {type: Schema.Types.ObjectId, ref: 'profile'},
    text: { type: String }
    },
    {
        timestamps: true
    });

const WallPost = mongoose.model('wallPost', WallPostSchema)

module.exports = WallPost
