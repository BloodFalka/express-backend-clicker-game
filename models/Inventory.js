const { Schema, model } = require('mongoose')

const schema = new Schema({
    items:[
        {
            name: {type:String, require:true},
            lvl: {type:Number, require:true},
            imgUrl: {type:String, require:true},
            category: {type:String, require:true},
            rarity: {type:String, require:true},
            itemId: {type:String, require:true},
            numInWorld: {type:Number, require:true},
            numInInv: {type:Number, require:true, default: 1},
        }
    ]
})

module.exports = model('Inventory', schema)
