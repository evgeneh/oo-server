const express = require('express')
const router = express.Router()

const Counters = require('../models/counters')
const Profile = require('../models/profile')

//установить модуль шифрования
const bcrypt = require('bcrypt-nodejs')
const initContacts = {github: null, website: null, linkedin: null, twitter: null}
const initProfile = {uniqueUrlName: null, status: null, lookingForAJob: false, aboutMe: '', contacts: {initContacts}, following: [], photos: {small: null, large: null}}

router.get("/counters/", (req, res) => {
    Counters.find({}).then(profiles => {
        res.send({items: profiles})
    })
})


router.post('/auth/register', (req, res) => {
    const {email, password, login, fullName} = req.body;
    let messages = []

    let resultCode = 0

    if (!email || !password) {
        resultCode = 1
        messages.push('Password of email is empty')
    }
    else if (password.length < 4)
    {
        resultCode = 1
        messages.push('Password must be 4 or more symbols')
    }
    else if (! /^[a-zA-Z0-9]+$/.test(password) )
    {
        messages.push('The password must consist of latin letters and digits')
    }
    //если пришли валидные данные
    else {
        bcrypt.hash(password, null, null, (err, hash) => {
            //get id from counter
            Profile.findOne({email: email}).then( emailFindResult => {


                //вместо password пишем hash
                if (emailFindResult != null) {
                    messages.push("Incorrect password or email")
                    res.send({resultCode: 1, messages})
                }
                else {
                    Counters.findOneAndUpdate( { id: 'user_id'}, { $inc: {seq: 1} },{upsert: true, "new": true, setDefaultsOnInsert: true},  (err, newId) => {
                     //if (err) res.send({resultCode: 1})}   ).then ( (newId) => {
                        let  id = Number(newId.seq)
                        Profile.create({
                            id,
                            email,
                            password: hash,
                            login,
                            fullName: fullName, ...initProfile
                        })
                            .then((user) => {

                                req.session.userId = user.id
                                req.session.userLogin = user.email

                                res.send({resultCode: 0})
                             })
                            /*
                            .catch(err => {
                                messages.push(err._message + ' :create err')
                                resultCode = 1
                                res.send({resultCode, messages})
                             })*/
                    })

                }
                if (err)
                    res.send({resultCode: 1})
            })
            .catch( err => {
                messages.push('Registration error')
                resultCode = 1
                res.send({resultCode, messages})
            })
        })
    }
})


router.post('/auth/login', (req, res) => {

    const {email, password, rememberMe} = req.body;

    let resultCode = 0;
    let messages = []

    Profile.findOne({email: email})
        .then(user => {
            if (!user) {
                messages.push('Wrong e-mail or password')
                res.send({resultCode: 1, messages})
            }
            else {
                bcrypt.compare(password, user.password, (err, result) => {
                    if (!result)
                    {
                      messages.push('Wrong e-mail or password')
                      res.send({resultCode: 1, messages})
                    }
                    //логин и пароль совпадают
                    else {

                       req.session.userId = user.id
                       req.session.userLogin = user.email

                        if (rememberMe)
                            req.session.cookie.maxAge = 60 * 24 * 60 * 60 * 1000
                        else
                            req.session.cookie.expires = false;

                       res.send({resultCode: 0})
                    }
                })

            }
        })
        .catch( err => {
            messages.push(err)
            resultCode = 1
            res.send({resultCode, messages})
        })
})

//LOGOUT
router.delete('/auth/login', (req, res) => {
    if (!! req.session)
        if (!! req.session.userId) {

        req.session.destroy()
        res.send({resultCode: 0})

    }
        //req.session.destroy(() => res.redirect('auth/me'))
})


router.get("/auth/me", (req, res) => {
    console.log("auth try")
    if (!!req.session && !!req.session.userId)
    {
        let {userLogin, userId} = req.session //sessionLocal
        Profile.findOne({id: userId}).then( (profile) => {
            if (profile) {
                let data = {id: userId, email: req.userLogin, login: profile.login}
                res.send({resultCode: 0, data})
            }
            else res.send({resultCode: 1})
        })
    }
    else res.send({resultCode: 1})

})

router.get("/test", (req, res) => {
    res.send(req.session)
   // res.send({lol: 'sdfsdf'})
})

module.exports = router