const dotenv = require('dotenv')
require('dotenv').config()

//'mongodb://localhost/ontach-db', //MONGO_URL=

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGO_URL: process.env.MONGO_URL,
    SESSION_SECRET : process.env.SESSION_SECRET,

    FILE_STORAGE: process.env.FILE_STORAGE,
    CORS_ORIGIN: process.env.CORS_ORIGIN,

    UPLOADS_DIR: 'uploads',

    //s3 bucket keys
    UPLOAD_ENDPOINT: process.env.UPLOAD_ENDPOINT,
    SPACES_ACCESS_KEY_ID: process.env.SPACES_ACCESS_KEY_ID,
    SPACES_SECRET_ACCESS_KEY: process.env.SPACES_SECRET_ACCESS_KEY

}
