const collectible = require('./collectibles.json'),
    brush = require('./brushes.json'),
    scissors = require('./scissors.json'),
    potion = require('./potions.json'),
    pet = require('./pets.json'),
    avatar = require('./avatars.json'),
    background = require('./backgrounds.json')

const colors = require('colors');

const rarityChances = require('./chances/rarityChances.json'),
    typeChances = require('./chances/typeChances.json')

const itemsImgPath = 'http://192.168.0.104:5000/images/items/';

const items = {
    collectible,
    brush,
    scissors,
    potion,
    pet,
    avatar,
    background
}

const chances = {
    rarityChances,
    typeChances
}


const randomChanceFromArray = (a, cat) => {
    const randPerc = +(Math.random()*100).toFixed(2);
    
    let accum = 0;

    for(let i = a.length - 1; i >= 0; i--){
        for (const p in a[i]) {
            accum += +a[i][p]
            
            
            if(cat){
                const rares = []
                for(const a in items[cat]){
                    rares.push(a)
                }
                const lastRare = rares[0]
                if(lastRare === p){
                    return p
                }
            }
            

            if(randPerc <= accum){
                console.log(`${cat? 'rar': 'cat'}`.brightCyan, `acum:${accum} random:${randPerc}%`)

                if(items[cat]){
                    return p
                } else if(!cat){
                    console.log(p.red)
                    return p
                }
                continue
            }
        }
        
    }
}

module.exports.items = items
module.exports.itemsImgPath = itemsImgPath
module.exports.chances = chances
module.exports.randomChanceFromArray = randomChanceFromArray