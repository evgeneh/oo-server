const config = require('../config');

const util = require("util");

const mkdirp = require('mkdirp');
const multer = require('multer');
const path = require('path');

const hashCode = require('./hash');

const Jimp = require('jimp');

const getFileSystemDir = () => {
    const rs = () => Math.random().toString(36).slice(-3);
    const dir =  "/" + rs() + "/" + rs() + "/";
    return dir;
}


const getUploadedFilename = fileName => Date.now().toString(36) + hashCode(fileName) + path.extname(fileName);

const miniatureName = fileName => path.parse(fileName).name + "_small.jpg";

const extensionFilter =  (fileName) => {
    const allowedExts = ['.jpg', '.png','.jpeg'];
    const ext = path.extname(fileName).toLowerCase();
    return !allowedExts.some(item => ext === item)
}

const resizeJimp = async (fileBig , fileSmall,  width, height) => {
    const image  = await Jimp.read(fileBig)
    await image
        .autocrop()
        .resize(width, height) // resize
        .quality(70) // set JPEG quality
        .write(fileSmall); // save
}

class Uploader {

    constructor() {
        const storage = multer.diskStorage({
            destination: function (req, file, cd) {
                //создать папки с mkdirp и передать созданное расположение
                mkdirp(config.UPLOADS_DIR + req.dir).then((err) => {
                    cd(null, "uploads" + req.dir)
                })
            },
            filename: (req, file, cb) => {
                cb(null, getUploadedFilename(file.originalname))
            }
        })

        this.upload = multer({
            storage: storage,
            limits: {fileSize: 1 * 1024 * 1024},
            fileFilter: (req, file, cb) => {
                console.log("filter " + file.originalname)
                if (extensionFilter(file.originalname))
                    return cb(new Error('Extension'))
                else
                    return cb(null, true)
            }
        })
    }

    async startUpload(req, res) {
        console.log("Start upload")
        const upload = util.promisify(this.upload.single('image'));

        await upload(req, res);

        return req.file.filename;
    }
}

const uploader = new Uploader();

const uploadFileToS3 = require('./upload-s3')
const Upload = require('../models/upload')

const UploadUpdateResize = async (req, res) => {
    req.dir = getFileSystemDir();
    let imageFullPath = null;
    let imagePreviewPath = null;


    try {
        const filename = await uploader.startUpload(req, res);


        imageFullPath =  req.dir + filename;
        imagePreviewPath = req.dir + miniatureName(filename)

        await resizeJimp(config.UPLOADS_DIR + imageFullPath, config.UPLOADS_DIR + imagePreviewPath, 140, 140)

        const uploaded = await uploadFileToS3(imageFullPath, imagePreviewPath, config.UPLOADS_DIR);

        //config.FILE_STORAGE + imageFullPath, для DEV
        const uploadRecord = await Upload.create({
            owner: req.session.userId,
            path: uploaded.image,
            preview: uploaded.thumbnail
        });
        return uploadRecord
    }
    catch (e) {
        return {error: e}
    }
}

module.exports = UploadUpdateResize