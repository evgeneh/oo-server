const aws = require('aws-sdk');
const fs = require('fs');

const config = require('../config');

const PROJECT_FOLDER = 'socialnet';

//-------------set space parameters ------------------
aws.config.update({
    accessKeyId: config.SPACES_ACCESS_KEY_ID,
    secretAccessKey: config.SPACES_SECRET_ACCESS_KEY
});

const spacesEndpoint = new aws.Endpoint(config.UPLOAD_ENDPOINT);
const s3 = new aws.S3({
    endpoint: spacesEndpoint
});



function uploadFiles(localPath, uploadFileName) {
    return new Promise((resolve, reject) => {

        fs.readFile(localPath, function (err, file) {
            if (err) {
                console.log("cannot read local " + err)
                reject(err);
            }

            let params = {
                ACL: 'public-read',
                ContentType: "image/jpeg",
                Bucket: 'oosocial',
                Key: PROJECT_FOLDER + uploadFileName,
                Body: file
            };

            s3.upload(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data)
                }
            });
        });

    });
}



const uploadFilesToS3 = async (imagePath, thumbnailPath, root) => {
    const [image, thumbnail] = await Promise.all(
        [uploadFiles(root + imagePath, imagePath), uploadFiles(root + thumbnailPath, thumbnailPath)]
    )
    console.log("S3 downloaded: " + image.Location + "  " + thumbnail.Location)
    return {image: image.Location, thumbnail: thumbnail.Location}
}

module.exports = uploadFilesToS3;