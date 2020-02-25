const mongoose = require('mongoose')
const Schema = mongoose.Schema

const profileSchema = new Schema({
    id:  {type: Number, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    login: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    fullName: String,
    uniqueUrlName: String,
    status: String,
    lookingForAJob: Boolean,
    lookingForAJobDescription: String,
    aboutMe: String,
    contacts: {github: String, website: String, linkedin: String, twitter: String},
    photos: {small: String, large: String},
    following: [Number],
    dialogs: [{type: Schema.Types.ObjectId, ref: 'profile'}]
},  {timestamps: true})

const Profile = mongoose.model("profile", profileSchema)

module.exports = Profile;

/*
//ДЛЯ ЗАПРОСА ПРОФИЛЯ
 userId: Number,
    fullName: String,
    lookingForAJob: Boolean,
    lookingForAJobDescription: String,
    aboutMe: String,
    contacts: {github: String, website: String, linkedIn: String, twitter: String},
    photos: {small: String, large: String}
 */

/*
//ДЛЯ ЗАПРОСА МАССИВА ЮЗЕРС
    id: Number,
    name: String,
    status: String,
    followed: Boolean,
    uniqueUrlName: String,
    photos: {small: String, large: String}
 */