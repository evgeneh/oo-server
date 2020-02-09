const express = require('express')
const router = express.Router()

const Profile = require('../models/profile')

const getProfile = ({_id, password, login, uniqueUrlName, status, createdAt, updatedAt, __v, ...profile}) => {
    return profile;
}


const initContacts = {github: null, website: null, linkedin: null, twitter: null}

//анализ пришедшего списка контактов на валидность url адреса
const learnRegExp = (expr) => {
    return /^((https?):\/\/)?([w|W]{3}\.)+[a-zA-Z0-9\-\.]{3,}\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/)?([a-zA-Z0-9\-\.\_]{1,})?(\/)?$/.test(expr)
}

const contactsValidate = (contacts) => {
    let messages = []
    Object.keys(contacts).map( (key) => {
       if ( contacts[key] && !learnRegExp(contacts[key]) )
           messages.push(`Invalid url format (Contacts->${key})`)
    })

    return messages

}


router.get("/profile/:id", (req, res) => {
    Profile.findOne({id: req.params.id})
        .then((profile) => {
            let {_id, password, email, login, uniqueUrlName, status, createdAt, updatedAt, __v, following, photos, id, ...newProfile} = profile._doc
            Object.keys(initContacts).map((contact) => {
                if (! newProfile.contacts[contact])
                    newProfile.contacts[contact] = null;
            })
            res.send( { ...newProfile, userId: id, photos: {large: photos.large, small: photos.small}})
    })
})

router.post("/profile", (req, res) =>{

})



router.put("/profile/", (req, res) => {
    let {id, photos, ...profile} = req.body

    //login test
    if (req.session.userId && req.session.userLogin && (req.session.userId === id)) {

        let messages = contactsValidate(profile.contacts)

        if (messages.length > 0)
            res.send({resultCode: 1, messages})
        else {
            Profile.findOneAndUpdate({id: req.session.userId}, {...profile}, {new: true}, (err, newStatus) => {
                res.send({resultCode: 0})
            })
                .catch(err => {
                    console.log(err._message)
                    res.send({resultCode: 1})
                })
        }
    } else res.send({resultCode: 1})
})

//STATUS BLOCK
//УСТАНОВКА НОВОГО СТАТУСА
router.put("/profile/status/", (req, res) => {
    Profile.findOneAndUpdate( {id: req.session.userId}, {status: req.body.status}, {new: true}, (err, newStatus) => {
        res.send({resultCode: 0})
    })
        .catch(err => {
            console.log(err._message)
            res.send({resultCode: 1})
        })
})

//ПОЛУЧИТЬ СТАТУС
router.get("/profile/status/:id", (req, res) => {

    Profile.findOne({id: req.params.id})
        .then(profile => {
            res.send(profile.status)
        })
})

/////////////////////////////////////
/////////////////////////////////////


module.exports = router