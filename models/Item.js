const { Schema, model } = require('mongoose')

const Item = {
	id: { type: String, required: true, unique: true },
	numInWorld: {type: Number, required: true},
	name: {type: String, required: true},
	lvl: {type: Number, required: true},
	imgUrl: {type: String, required: true},
	category: {type: String, required: true},
	rarity: {type: String, required: true},
	tradable: {type: Boolean, required: true, default: true}
}

const schema = new Schema({
	...Item
})

module.exports = model('Item', schema)
module.exports.Item = Item