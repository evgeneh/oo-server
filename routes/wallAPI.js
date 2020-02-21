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
    console.log(myId)
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

router.get("/wall/:id", async (req, res) => {
    console.log( req.params.id)
    const wall = await Wall.findOne({userId: req.params.id}).populate('posts').populate('posts.owner').exec();
    if (wall) {

        console.log(wall)
        res.send({resultCode: 0, totalCount: wall.posts.length, })
    }
    else {
        res.send({resultCode: 0, totalCount: 0})
    }
} )

router.post("/wall", async (req, res) => { /*
    if (req.session.userId === undefined)
        return res.json({message: 'Not authorized'});*/

    let myId = 1 //req.session.userId
    let {userId, text} = req.body //id of wall owner

    try {
        let wall = await Wall.findOne({userId: userId}).exec()

        if (!wall) {
            await CreateNewWall(userId)
        }

        let newPost = await addNewWallPost(myId, userId, text)
        res.send({resultCode: 0, post: newPost})
    }
    catch(err) {
        console.log(err)
        res.send({resultCode: 1, message: "Wall update error"})
    }

})

module.exports = router