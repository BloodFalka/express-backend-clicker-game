const equipments = require('./equipments.json'),
    collectibles = require('./collectibles.json'),
    pets = require('./pets.json'),
    backgrounds = require('./backgrounds.json'),
    avatars = require('./avatars.json')

const rarityChances = require('./chances/rarityChances.json'),
    typeChances = require('./chances/typeChances.json')

const itemsImgPath = 'http://localhost:5000/images/items/';

const items = {
    equipments,
    collectibles,
    pets,
    backgrounds,
    avatars
}

const chances = {
    rarityChances,
    typeChances
}

module.exports.items = items
module.exports.itemsImgPath = itemsImgPath
module.exports.chances = chances