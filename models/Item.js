const { Schema, model } = require('mongoose')

const schema = new Schema({
	itemId: { type: String, required: true, unique: true },
	numInWorld: {type: Number, required: true, default: 0},
	name: {type: String, required: true},
	lvl: {type: Number, required: true},
	imgUrl: {type: String, required: true},
	category: {type: String, required: true},
	rarity: {type: String, required: true},
})

module.exports = model('Item', schema)
