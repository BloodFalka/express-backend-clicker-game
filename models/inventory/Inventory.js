const { Schema, model } = require('mongoose')

const schema = new Schema({
    count: {type:Number, require:true, default: 0},
    items:[
        {
            name: {type:String, require:true},
            lvl: {type:Number, require:true},
            imgUrl: {type:String, require:true},
            category: {type:String, require:true},
            rarity: {type:String, require:true},
            id: {type:String, require:true},
            numInWorld: {type:Number, require:true},
            numInInv: {type:Number, require: true, default: 1},
            updateTime: {type:Date, require: true},
            tradable: {type: Boolean, required: true, default: true},
            isEquipped: {type: Boolean, required: true, default: false},
        }
    ]
})

module.exports = model('Inventory', schema)
