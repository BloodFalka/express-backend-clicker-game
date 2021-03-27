const equipments = require('./equipments.json'),
    collectibles = require('./collectibles.json'),
    pets = require('./pets.json'),
    backgrounds = require('./backgrounds.json'),
    avatars = require('./avatars.json')

    const colors = require('colors');

const rarityChances = require('./chances/rarityChances.json'),
    typeChances = require('./chances/typeChances.json')

const itemsImgPath = 'http://192.168.0.104:5000/images/items/';

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