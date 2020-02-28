const express = require('express')
const router = express.Router()

const mongoose = require('mongoose')

const Dialog = require('../models/dialog')
const Profile = require('../models/profile')

const utils = require('../utils/item-methods')

const CreateNewDialog = async (myId, userId)=> {
    let userProfile

    let isSelfMessaging = (myId === parseInt(userId))
    if (! isSelfMessaging) {    //skip this block in case of self messaging
        userProfile = await Profile.findOne({id: userId}).exec();
        if (! userProfile ) return null
    }
    const myProfile = await Profile.findOne({id: myId}).exec();
    if (! myProfile ) return null

    let dialog = new Dialog({
        _id: new mongoose.Types.ObjectId(),
        owners: [myId, (isSelfMessaging) ? 0 : userId],
        messages: []
    })

    dialog = await dialog.save()

    //add new dialog _id in begin of both users array
    if (! isSelfMessaging)
        await  Profile.findOneAndUpdate({_id: userProfile._id}, {$push: {dialogs: { $each: [dialog._id], $position: 0 }}} )
    await  Profile.findOneAndUpdate({_id: myProfile._id}, {$push: {dialogs: { $each: [dialog._id], $position: 0 }}} )

    return dialog._id
}
//-------------

const setAllMessagesAsRead = async (_id, notMyId) => {

    await Dialog.updateOne({'messages.ownerId':  notMyId, '_id': _id }, {$set: {'messages.$[].isRead': true}}).exec()

}

const getUserProfileWithDialogs = async (userId) => {
    return  await Profile.findOne({id: userId}).populate([{
        path: 'dialogs',
        model: 'dialog'
    }]).exec();
}


router.post("/dialog/message", async (req, res) => {
     if (req.session.userId === undefined)
        return res.json({message: 'Not authorized'});
    let myId = req.session.userId
    let {userId, text, date} = req.body //id message receiver
    try {
        let secondId = (userId === myId) ? 0 : userId //for self messaging!

        const myDialogWithId = await Dialog.findOne({owners: {$all : [secondId, myId]}}).exec()



        let dialogId =  (myDialogWithId) ? myDialogWithId._id : null;
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
    let myId = req.session.userId

    let userProfile = await getUserProfileWithDialogs(req.query.id)
    if (!userProfile) {
        return res.json({message: 'Wrong request id'})
    }

    let findDialog = null;

    let data = {currentDialogId: null, totalMessagesCount: 0, messages: [],
                owner: utils.profileToItemOwner(userProfile)}

    //is for self-messaging case
    let interlocutorId = (myId === parseInt(req.query.id) ) ? 0 :  parseInt(req.query.id)



    //watch all user dialogs to find dialog with my ID
    userProfile.dialogs.forEach((dialog) => {
        if (dialog.owners.includes(myId) && dialog.owners.includes(interlocutorId))
        {
                findDialog = dialog
        }
    } )

    //in case of dialog with this user is exists
    if (findDialog ) {
        //set not mine messages in this dialog as read!
        await setAllMessagesAsRead(findDialog._id, req.query.id)

        res.send({resultCode: 0, data: {
                currentDialogId: findDialog._id,
                owner: data.owner,
                messages: findDialog.messages,
                totalMessagesCount: findDialog.messages.length
            }})
        //data
    }
    else {
        //send this if dialog is not started
        res.send({resultCode: 0, data})
    }
})


router.get("/dialogs", async (req, res) => { //load dialog with user
    if (req.session.userId === undefined)
        return res.json({message: 'Not authorized'});
    try {
        let userProfile = await getUserProfileWithDialogs(req.session.userId)

        if (userProfile.dialogs === undefined || !userProfile.dialogs) {
            res.send({resultCode: 0, data: {totalCount: 0, dialogs: []}})
        }
        else {
            let dialogs = await Promise.all(userProfile.dialogs.map(async (dialog) => {

                let index = dialog.owners.findIndex((value) => value !== req.session.userId)

                let interlocutorId = dialog.owners[index]

                if (interlocutorId === 0) interlocutorId = req.session.userId

                let profile = await Profile.findOne({id: interlocutorId}).exec()
                let {date, ...lastMessage} = dialog.messages[0]._doc

                return {date, lastMessage, user: utils.profileToItemOwner(profile)}

            }))

            res.send({resultCode: 0, data: {totalCount: dialogs.length, dialogs}})
        }
    }
    catch (e) {
        console.log('Get dialogs error: ' + e)
        res.send({resultCode: 1})
    }

})


router.get("/dialogs/unread", async (req, res) => { //get unread messages count
    if (req.session.userId === undefined)
        return res.json({message: 'Not authorized'});
    try {
        let userProfile = await getUserProfileWithDialogs(req.session.userId)

        let unreadCount = 0;
        userProfile.dialogs.forEach( (dialog) => {
            dialog.messages.forEach((message) => {

                if ( ! (message.isRead || message.ownerId === req.session.userId))
                    unreadCount++;
            })
        })
        res.send({resultCode: 0, messagesCount: unreadCount})
    }
    catch (e) {
            console.log('Get unread count error: ' + e)
            res.send({resultCode: 1})
        }

})

module.exports = router