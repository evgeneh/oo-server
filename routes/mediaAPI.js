const express = require('express')
const router = express.Router()

const config = require('../config')

const Upload = require('../models/upload')
const Profile = require('../models/profile')

const UploadUpdateResize = require('../utils/upload-image')

const updateProfileImage =  (id, large, small, cb) => {
    const profile = Profile.findOneAndUpdate({id: id}, {
        photos: { large: config.FILE_STORAGE + large, small: config.FILE_STORAGE + small }
    }, {new: true}, (err, profile) => {
        if (err) {
            return cb("UPDATE PROFILE ERROR") }
        else return cb(null, profile.photos);
    })

}

router.put("/profile/photo", (req, res) => { //для множества файлов писать upload.array возвр. req.files
    UploadUpdateResize(req, res).then( (upload) => {
        if (upload.err)
            res.send({resultCode: 1, messages: [upload.err]})
        else {
            Profile.findOneAndUpdate({id: req.session.userId}, {
                photos: {
                    large: upload.path,
                    small: upload.preview
                }
            }, {new: true}, (err, profile) => {

                if (err) {
                    res.send({resultCode: 1, messages: ["UPDATE PROFILE ERROR"]})
                } else {
                    res.send({resultCode: 0, photos: profile.photos})
                }
            })
        }
    })
})


router.put("/photo", (req, res) => {
    UploadUpdateResize(req, res).then( (upload) => {
        if (upload.error || !upload.path || !upload.preview)
            res.send({resultCode: 1, messages: [upload.error]})
        else {
            res.json({resultCode: 0})
        }
    })
})

//put photo id to set it like profile image
router.put("/photo/profile", (req, res) => {
    if (!req.session.userId)
        res.send({resultCode: 1, messages: ["Not authorized"]})
    else if (! req.query.id)
        res.send({resultCode: 1, messages: ["NO USER ID"]})
    else {
        Upload.findById({_id: req.query.id}).then( (upload) => {

            if (upload.owner !== req.session.userId)
                res.send({resultCode: 1, messages: ["ACCESS ERROR"]})
            else {
                updateProfileImage(req.session.userId, upload.path,  upload.preview,(err, prof) => {
                    if (err) res.send({resultCode: 1, messages: ["UPDATE PROFILE ERROR"]})
                    else {
                        setTimeout(() => res.send({resultCode: 0, photos: prof.photos}), 2000)

                    }
                })
            }
        })
    }
})


//будем возвращать превью картинок 
router.get("/photos", (req, res) => {
    const currentId = req.query.id ? req.query.id : req.session.userId;
    if (typeof(currentId) === "undefined" || currentId === null) {
        res.send({items: null, messages: ["User is not registered"]})
    }
    else {
        Profile.findOne({id: currentId}).then((profile) => {
            if (!profile)
                res.send({items: null, messages: ['This page is not exists']})
            else
                Upload.find({owner: currentId}, (err, uploads) => {

                    let items = uploads.map((upload) => {
                        const description = (upload.description === undefined ) ? "" : upload.description
                        return {
                            id: upload._id.toString(),
                            path: upload.path,
                            preview: upload.preview,
                            date: upload.createdAt,
                            description
                        }
                    })
                    res.send({items: items, totalCount: uploads.length})
                })
        }).catch( (err) => console.log("PHOTOS SEND ERROR: " + err)
        )
    }
})

const fs = require('fs')

router.delete('/photo', async (req, res) => {
    if (req.session.userId === undefined || !req.session.userId)
        res.send({resultCode: 1, messages: ["UNREGISTERED_USER"]})
    else if (! req.query.id)
        res.send({resultCode: 1, messages: ["NO USER ID"]})
    else {
        let messages = []
        const upload = await Upload.findById(req.query.id).exec()

        try {
            fs.unlinkSync(upload.path)
            fs.unlinkSync(upload.preview)
        } catch (e) {
            console.log("unlink error :" + e)
        }
        try {
            await Upload.deleteOne({_id: req.query.id}).exec()
            console.log("upload was deleted")
            res.send({resultCode: 0})
        } catch (e) {
            messages.push("UPLOAD RECORD REMOVE ERROR");
            res.send({resultCode: 1, messages});
        }
    }
})

router.post('/photo/update', async (req, res) => {

    if (req.session.userId === undefined || !req.session.userId)
        res.send({resultCode: 1, messages: ["UNREGISTERED_USER"]})
    let {id, description} = req.body;
    try {
        let upload = await Upload.findOne({_id: id}).exec()
        //changes allowed fow upload owners only
        if (upload.owner === req.session.userId) {
            await Upload.findOneAndUpdate({_id: upload._id}, {description: description})
            res.send({resultCode: 0})
        } else
            res.send({resultCode: 1, messages: ["ACCESS_ERROR"]})

    } catch (e) {
        console.log('Update description error: ' + e)
        res.send({resultCode: 1, messages: ["UPDATE_UPLOADS_ERROR"]})
    }
})


module.exports = router
