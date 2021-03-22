const { Schema, model } = require('mongoose')

const schema = new Schema({
	userId: { type: String, required: true, unique: true },
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	gold: { type: Number, required: true, default: 0 },
	stats: {
		lvl: {
			xp: {type: Number, required: true, default: 0},
			currentLvl: { type: Number, required: true, default: 1 },
			currentStage: { type: Number, required: true, default: 1 },
			enemiesOnLvl: { type: Number, required: true, default: 10 },
		},
		damage: {
			dpc: { type: Number, required: true, default: 1 },
			dps: { type: Number, required: true, default: 0 },
			critical: {
				chance: { type: Number, required: true, default: 0.2 },
				multipler: { type: Number, required: true, default: 2 },
			},
		},
	},
	inventory: [
		{
			name: String,
			lvl: Number,
			imgUrl: String,
			category: String,
			rarity: String,
			itemId: String,
			numInWorld: Number,
			numInInv: Number
		}
	],
})

module.exports = model('User', schema)
