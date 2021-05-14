const { Schema, model } = require('mongoose')

const schema = new Schema({
	id: { type: String, required: true, unique: true },
	numInWorld: {type: Number, required: true, default: 0},
	name: {type: String, required: true},
	lvl: {type: Number, required: true},
	imgUrl: {type: String, required: true},
	category: {type: String, required: true},
	rarity: {type: String, required: true},
	tradable: {type: Boolean, required: true, default: true},
})

module.exports = model('Item', schema)
