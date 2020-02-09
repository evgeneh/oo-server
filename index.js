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
/*
app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin','*')
    res.header('X-Requested-Width','XMLHttpRequest')
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE,OPTIONS,HEAD,PATCH')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Access-Control-AllowHeaders, Authorization, X-Requested-Width')
    next()
})
 */

app.use('/uploads', express.static(__dirname + '/uploads'))

//app.use(express.cookieDecoder())

app.use('/api', require('./routes/profileAPI'))
app.use('/api', require('./routes/userAPI'))
app.use('/api', require('./routes/authAPI'))
app.use('/api', require('./routes/mediaAPI'))


app.listen(config.PORT, ()=>{
    console.log('start server')})

