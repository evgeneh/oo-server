const express = require('express')
const mongoose = require("mongoose")

const bodyParser = require('body-parser')
const cors = require('cors')

const session = require("express-session")
const MongoStore = require('connect-mongo')(session)

const config = require('./config')

mongoose.connect(config.MONGO_URL, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false})

const app = express()

app.use(
    cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
        methods: "GET,POST,DELETE,PUT,OPTIONS",
        allowedHeaders:
            "Origin, X-Requested-With, Content-Type, Accept, authorization"
    })
);

app.use(
    session({
        secret: config.SESSION_SECRET, resave: false, saveUninitialized: false,
        store: new MongoStore({ mongooseConnection: mongoose.connection})
    })
)

app.use(bodyParser.json())


app.use('/uploads', express.static(__dirname + '/uploads'))

//app.use(express.cookieDecoder())

app.use('/api', require('./routes/profileAPI'))
app.use('/api', require('./routes/userAPI'))
app.use('/api', require('./routes/authAPI'))
app.use('/api', require('./routes/mediaAPI'))


app.listen(config.PORT, ()=>{
    console.log('start server')})

