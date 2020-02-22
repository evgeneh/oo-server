const express = require('express')
const router = express.Router()

const mongoose = require('mongoose')

const Wall = require('../models/wall')
const WallPostSchema = require('../models/wallpost')

const Profile = require('../models/profile')

const CreateNewWall = async (id) => {
    const profile = await Profile.findOne({id: id}).exec();
    if (! profile) return null
    const wall = new Wall({
        _id: new mongoose.Types.ObjectId(),
        userId: profile.id,
        owner: profile._id,
        posts: []
    })

    await wall.save()
    return
}

//convert full profile to some props needed for post data
const profileToPostOwner = ({id, photos, fullName}) => {
    return {userId: id, photo: photos.small, fullName}
}

const addNewWallPost = async (myId, userId, text) => {
    //get mongo _id for post creator
    let profile = await Profile.findOne({id: myId}).exec();

    let post = new WallPostSchema({
        _id: new mongoose.Types.ObjectId(),
        owner: profile._id,
        text: text
    })

    post = await post.save()
    await  Wall.findOneAndUpdate({userId: userId}, {$push: {posts: { $each: [post._id], $position: 0 }}}, {new: true})

    let postRes = {postId: post._id, text: post.text, date: post.createdAt, owner: profileToPostOwner(profile)}

    return postRes;
}

//read a user's wall with all posts
router.get("/wall", async (req, res) => {
    let wall = null;
    try
    {
     wall = await Wall.findOne({userId: req.query.id})
        .populate([{path: 'posts', model: 'wallPost', populate: {path: 'owner', model: 'profile'}}]).exec();
    }
    catch (e) {
        return res.json({message: 'Get Wall error'});
    }

    if (wall) {

        let posts = wall.posts.map((single) => {
            return {
                postId: single._id,
                date: single.updatedAt,
                text: single.text,
                owner: profileToPostOwner(single.owner)
            }
        })

        const data = {userId: wall.userId, totalCount: wall.posts.length, posts}

        res.send({resultCode: 0, data})
    } else {
        res.send({resultCode: 0, data: {totalCount: 0, userId : req.query.id, posts: []}})
    }
})

//add a new post for wall owner
router.post("/wall", async (req, res) => {
    if (req.session.userId === undefined)
        return res.json({message: 'Not authorized'});

    let myId = req.session.userId
    let {userId, text} = req.body //id of wall owner

    try {
        let wall = await Wall.findOne({userId: userId}).exec()

        if (!wall) {
            await CreateNewWall(userId)
        }

        let newPost = await addNewWallPost(myId, userId, text)
        res.send({resultCode: 0, post: newPost})
    } catch (err) {
        console.log(err)
        res.send({resultCode: 1, message: "Wall update error"})
    }

})

module.exports = router