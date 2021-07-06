const { Schema, model } = require('mongoose')

const schema = new Schema({
	id: { type: String, required: true, unique: true },
    body: { type: String, required: true },
    createTime: {type:Date, require: true},
    likes: [{type:String, unique: true}],
    user: {
        id: {type: String, require: true},
        username: { type: String, required: true},
        avatarUrl: { type: String, required: true},
        backgroundUrl: { type: String, required: true},
    }
})

module.exports = model('Message', schema)
