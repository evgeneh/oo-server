const dotenv = require('dotenv')
require('dotenv').config()

//'mongodb://localhost/ontach-db', //MONGO_URL=

module.exports = {
    PORT: process.env.port || 4000,
    MONGO_URL: process.env.MONGO_URL,
    SESSION_SECRET : process.env.SESSION_SECRET,
    FILE_STORAGE: 'http://localhost:4000/',
    CORS_ORIGIN: process.env.CORS_ORIGIN
    //
}
