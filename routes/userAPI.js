const express = require('express')
const router = express.Router()
const Profile = require('../models/profile')

//ДЛЯ ЗАПРОСА МАССИВА ЮЗЕРС

router.get("/follow/:id", (req, res) => {
    if (!req.session.userId || (req.session.userId) == req.params.id) {
        res.send({isFollow: false })
    }
    else {
            Profile.findOne({id: req.session.userId}).then(profile => {
                const followList = profile.following;
                let isFollow = followList.indexOf(req.params.id) != -1;
                res.send({isFollow })
            })
    }
})
router.post("/follow/:id", (req, res) => followToggle(req, res, true))
router.delete("/follow/:id", (req, res) => followToggle(req, res, false))

//получить общее число пользователей
const getProfilesCount = async () => {
    const users = await Profile.count().exec()
    return users;
}


const followToggle = (req, res, isFollow) => {
    const event = isFollow
    if (!req.session.userId || (req.session.userId) == req.params.id) {
        res.send({resultCode: 1})
    }
    else {
        let id = req.params.id
        Profile.findOneAndUpdate({id: req.session.userId},
            event ? {$push: {following: id}} : {$pull: {following: id}}, {new: true}, (err, newStatus) => {
            if (err) {
                res.send({resultCode: 1})
            } else {
                res.send({resultCode: 0})
            }
        })
    }
}

//получить список пользователей по определенному условию,
// condArray - список айдишников которые следует извлечь, если он null - берём всех
const getUsersByCond =  (req, condArray) => {
    let page = req.query.page || 1
    let pageSize = Number(req.query.count || 10) % 11
    return getProfilesCount().then(profilesCount => {

        const pageCount = Math.ceil(profilesCount / pageSize)

        if (page > pageCount || page < 1)
            return null
        else {

            return Profile.find(condArray ? {'id': {$in: condArray}} : {}).limit(pageSize).skip((page - 1) * pageSize).exec()
        }
    })
}

const convertUserToUsersItem = (user, isFollowed) => {
    let {id, fullName, status, uniqueUrlName, photos} = user;
    return {id, name: fullName, status, uniqueUrlName, photos: {small: photos.small, large: photos.large}, followed: isFollowed}
}


router.get("/users",  (req, res) => {
    //let userId =  || 3;
    //сначала ищем себя чтобы получить список подписок
    getUsersByCond(req, null)
        .then( (users) => {
            //Пройти по всем юзерам для реструкт и проверки на фолловинг
            let items = users.map(user => {
                return convertUserToUsersItem(user, false)
            })

            if (req.session.userId) {
                //для зарегистрированных пользователей сначала получаем подписки
                Profile.findOne({id: req.session.userId}).then(profile => {
                    const followList = profile.following
                    if (followList.length > 0) {
                        items = items.map(user => {
                            let isFollowed = followList.indexOf(user.id) != -1
                            return {...user, followed: isFollowed}
                        })
                    }
                    getProfilesCount().then (count => {
                        res.send({items: items, totalCount: count, resultCode: 0})})
                })

            }
            //для незалогинного пользователя у всех стоит followed: false
            else {
                    getProfilesCount().then (count => {
                        res.send({items: items, totalCount: count, resultCode: 0})})
            }
        })

})

router.get("/friends", (req, res) => {
    if (! req.session.userId)
        res.send({resultCode: 1})
    else
    {
        const currentId = req.query.id ? req.query.id : req.session.userId
        //get list of followed users
        Profile.findOne({id: currentId}).then(profile => {
        const followList = profile.following
        if (followList.length > 0) {
             getUsersByCond(req, followList)
                .then(users => {
                    //загружены только друзья поэтому всем followed: true
                    let items = users.map(user => {
                        return convertUserToUsersItem(user, true)
                    })
                    res.send({items: items, totalCount: followList.length, resultCode: 0})

                })
        } else
            res.send({items: [], totalCount: 0, resultCode: 0})
    })}
})


module.exports = router;