const { Schema, model } = require('mongoose')
const {Item} = require('./Item')

const schema = new Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	gold: { type: Number, required: true, default: 0 },
	stats: {
		lvl: {
			//xp
			currentLvlXp: {type: Number, required: true, default: 0},
			currentLvl: { type: Number, required: true, default: 1 },
		},
		stage:{
			//location
			currentLocation: {type: String, required: true, default: 'grassland'},
			//stage
			currentStage: { type: Number, required: true, default: 1 },
			currentCatOnStage: { type: Number, required: true, default: 1 },
			catsOnStage: { type: Number, required: true, default: 10 },
			currentCat: {
				name: {type: String, required: true},
				power: {type: Number, required: true},
				imgUrl: {type: String, required: true},
				hp: {type: Number, required: true},
				animation: {
					keyframes:  {
						walk: {type: Array, required: false},
						appear: {type: Array, required: false},
						die: {type: Array, required: false},
					},
					rows: {type: Number, required: false},
					columns: {type: Number, required: false},
					fps: {type: Number, required: false},
				}
			}
		},
		damage: {
			dpc: { type: Number, required: true, default: 1 },
			dps: { type: Number, required: true, default: 0 },
			critical: {
				chance: { type: Number, required: true, default: 1 },
				multipler: { type: Number, required: true, default: 2 },
			},
		}
	},
	equipment: {
		glove: Item|null,
		brush: Item|null,
		scissors: Item|null, 
		pet: Item|null,
	},
	avatar: Item|null,
	background: Item|null,
})

module.exports = model('User', schema)

