const express = require('express')
const router = express.Router()

const mongoose = require('mongoose')

const Dialog = require('../models/dialog')
const Profile = require('../models/profile')

const utils = require('../utils/item-methods')

const CreateNewDialog = async (myId, userId)=> {
    const userProfile = await Profile.findOne({id: userId}).exec();
    const myProfile = await Profile.findOne({id: myId}).exec();
    if (! userProfile || ! myProfile ) return null

    let dialog = new Dialog({
        _id: new mongoose.Types.ObjectId(),
        owners: [myId, userId],
        messages: []
    })

    dialog = await dialog.save()

    //add new dialog _id in begin of both users array
    await  Profile.findOneAndUpdate({_id: userProfile._id}, {$push: {dialogs: { $each: [dialog._id], $position: 0 }}} )
    await  Profile.findOneAndUpdate({_id: myProfile._id}, {$push: {dialogs: { $each: [dialog._id], $position: 0 }}} )

    return dialog._id
}
//-------------

const setAllMessagesAsRead = async (_id, myId) => {
    //const newMessages = messages.map((mes)=>{
    //    if (mes.ownerId === myId)
    //})
    await Dialog.updateOne({_id: _id}, {'messages.$ownerId': {$ne: myId}}, {$set: {'messages.$[].isRead': true}})
}


router.post("/dialog/message", async (req, res) => {
     if (req.session.userId === undefined)
        return res.json({message: 'Not authorized'});
    let myId = req.session.userId
    let {userId, text, date, dialogId} = req.body //id message receiver

    try {
        if (!dialogId) //for first message to thisUser
        {
            dialogId = await CreateNewDialog(myId, userId)
            if (!dialogId) return res.json({message: 'createDialogError'});
        }

        let message = {ownerId: myId, text, date, isRead: false}

        await Dialog.findOneAndUpdate({_id: dialogId}, {$push: {messages: {$each: [message], $position: 0}}})

        res.send({resultCode: 0, dialogId})
    }
    catch (e) {
        console.log("Add post error: " + e)
        return res.json({message: 'createDialogError'});
    }
})

router.put("/dialog", async (req, res) => { //load dialog with user
    if (req.session.userId === undefined)
       return res.json({message: 'Not authorized'});
    let myId = 1//req.session.userId
    let userProfile = await Profile.findOne({id: req.query.id}).populate([{path: 'dialogs', model: 'dialog'}]).exec();
    let findDialog = null;

    let data = {currentDialogId: null, totalMessagesCount: 0, messages: [],
                owner: utils.profileToItemOwner(userProfile)}
                //watch all user dialogs to find dialog with my ID
    userProfile.dialogs.forEach((dialog) => {
        if (dialog.owners.includes(myId))
            findDialog = dialog
    } )

    //in case of dialog with this user is exists
    if (findDialog ) {
        //set not mine messages in this dialog as read!
        await setAllMessagesAsRead(findDialog._id, myId)

        res.send({resultCode: 0, data: {
                currentDialogId: findDialog._id,
                owner: utils.profileToItemOwner(userProfile),
                messages: findDialog.messages,
                totalMessagesCount: findDialog.messages.length
            }})
        //data
    }
    else {
        res.send({resultCode: 0, data})
    }
})

module.exports = router