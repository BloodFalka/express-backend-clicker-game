var express = require('express')
const User = require('../models/User')
var router = express.Router()

router.get('/:userId', async (req, res) => {
	try {
		const userId = req.params.userId

		const user = await User.findOne({ userId })

		if (!user) {
			return res.status(400).json({ data: {}, errors: [], message: `Пользователь не найден` })
		}

		return res.status(200).json({ data: user.stats, errors: [], message: `Данные успешно получены` })
	} catch (e) {
		console.log(req.body, e)
		res.status(500).json({ data: {}, errors: [], message: 'Что-то пошло не так, попробуйте снова' })
	}
})

module.exports = router
