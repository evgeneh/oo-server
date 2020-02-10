const express = require('express')
const router = express.Router()

const config = require('../config')

const multer = require('multer')
const path = require('path')
const mkdirp = require('mkdirp')

const Jimp = require('jimp');

const Upload = require('../models/upload')
const Profile = require('../models/profile')

const hashCode = require('../utils/hash')

const rs = () => Math.random().toString(36).slice(-3);

const storage = multer.diskStorage({
    destination: function (req, file, cd)  {
        const dir =  "/" + rs() + "/" + rs()
        req.dir = dir


        //дописать когда подкл mkdirp
        mkdirp("uploads" + dir).then( (err) => {
            cd(null, "uploads" + dir)
        })},
    filename: async (req, file, cb) =>  {

        const fileName = Date.now().toString(36) + hashCode(file.originalname) + path.extname(file.originalname)
        //create address for picture preview
        const miniatureName = path.parse(fileName).name + "_small.jpg";

        const upload = await Upload.create({
            owner: req.session.userId,
            path: "uploads" + req.dir + "/" + fileName,
            preview: "uploads" + req.dir + "/" + miniatureName
        });
        req.filename = upload.path;
        req.preview = upload.preview;

        cb(null, fileName)
    }
})


const upload = multer({
    storage: storage,
    limits: {fileSize: 1 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.jpg' && ext !== '.png' && ext !== '.jpeg') {
            const err = new Error('Extension')
            return cb(err)
        }
        else {return cb(null, true)}
    }
}).single('image')

const UploadUpdateResize = (req, res, cb) => {
    if (!req.session.userId)
        return cb("UNREGISTERED_USER")
    else
        upload(req, res, (err) => {
            console.log("UPLOAD ERR: " + err)
            if (err) {
                return cb(err.code)
                //res.send({resultCode: 1, messages: [err.code]} )
            } else if (!req.file || !req.session.userId) {
                return cb("UPLOAD ERROR")
            } else {
                Jimp.read(req.filename).then((img) => {
                    img.autocrop().resize(150, 150).write(req.preview)
                }).then(() => {
                    return cb(null, req, res)
                })
            }
        })
}


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
    UploadUpdateResize(req, res, (err, req, res) => {
        if (err)
            res.send({resultCode: 1, messages: [err]})
        else {
            Profile.findOneAndUpdate({id: req.session.userId}, {
                photos: {
                    large: config.FILE_STORAGE + req.filename,
                    small: config.FILE_STORAGE + req.preview
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
    UploadUpdateResize(req, res, (err, req) => {
        if (err || !req.filename || !req.preview)
            res.send({resultCode: 1, messages: [err]})
        else {
            res.json({resultCode: 0})
        }
    })
})

//put photo id to set it like profile image
router.put("/photo/profile", (req, res) => {
    if (!req.session.userId)
        res.send({resultCode: 1, messages: ["UNREGISTERED_USER"]})
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
                        const address = config.FILE_STORAGE + upload.path;
                        const previewAddress = config.FILE_STORAGE + upload.preview;
                        return {
                            id: upload._id.toString(),
                            path: address,
                            preview: previewAddress,
                            date: upload.createdAt
                        }
                    })
                    res.send({items: items, totalCount: uploads.length})
                })
        }).catch( (err) => console.log("PHOTOS SEND ERROR: " + err)
        )
    }
})

const fs = require('fs')

router.delete('/photo', (req, res) => {
    if (!req.session.userId)
        res.send({resultCode: 1, messages: ["UNREGISTERED_USER"]})
    else if (! req.query.id)
        res.send({resultCode: 1, messages: ["NO USER ID"]})
    else {
        let messages = []
        Upload.findById({_id: req.query.id}).then( (upload) => {

            fs.unlink(upload.path, err => {
                if (err) messages.push("FILE DELETE ERROR")

                fs.unlink(upload.preview, err_small => {
                    if (err_small) messages.push("FILE DELETE ERROR MINIATURE")
                    Upload.deleteOne({_id: req.query.id}, (err) => {
                        if (err) {
                             messages.push("UPLOAD RECORD REMOVE ERROR");
                             res.send({resultCode: 1, messages});
                        }
                        else {
                            res.send({resultCode: 0})
                        }
                    })
                })
            })
        })
    }
})

module.exports = router
