//convert full profile to some props needed for post data
const profileToItemOwner = ({id, photos, fullName}) => {
    return {userId: id, photo: photos.small, fullName}
}

module.exports.profileToItemOwner = profileToItemOwner