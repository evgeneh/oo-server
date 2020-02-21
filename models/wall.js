const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WallSchema = Schema({
    _id: Schema.Types.ObjectId,
    userId: {
        type: Number,
        required: true
    }  ,
    owner: {type: Schema.Types.ObjectId, ref: 'profile'},
    posts: [{ type: Schema.Types.ObjectId, ref: 'wallPost' }]
});

const Wall = mongoose.model('wall', WallSchema)

module.exports = Wall;
