const { Schema, model } = require('mongoose')

const schema = new Schema({
	userId: { type: String, required: true, unique: true },
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },

	stats: {
		lvl: {
			currentLvl: { type: Number, required: true, default: 1 },
			currentStage: { type: Number, required: true, default: 1 },
			enemiesOnLvl: { type: Number, required: true, default: 10 },
		},
		gold: {
			currentGold: { type: Number, required: true, default: 0 },
			goldMultipler: { type: Number, required: true, default: 15 },
		},
		damage: {
			dpc: { type: Number, required: true, default: 1 },
			dps: { type: Number, required: true, default: 0 },
			critical: {
				chance: { type: Number, required: true, default: 0.2 },
				multipler: { type: Number, required: true, default: 2 },
			},
		},
		enemy: {
			maxHp: { type: Number, required: true, default: 10 },
		},
	},
})

module.exports = model('User', schema)
