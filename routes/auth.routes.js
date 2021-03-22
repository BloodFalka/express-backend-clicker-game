var express = require('express')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')
const config = require('config')
const jwt = require('jsonwebtoken')
const { customAlphabet } = require('nanoid')
const User = require('../models/User')
var router = express.Router()

router.post(
	'/signup',
	[
		check('username', 'Минимальная длинна 3 символов').isLength({ min: 3 }),
		check('username', 'Максимальная длинна 30 символов').isLength({ max: 30 }),
		check('password', 'Минимальная длинна 6 символов').isLength({ min: 6 }),
		check('password', 'Максимальная длинна 15 символов').isLength({ max: 15 }),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req)

			if (!errors.isEmpty()) {
				return res
					.status(400)
					.json({ errors: errors.array(), message: `Некорректные данные, ${req.body}`, data: {} })
			}

			const { username, password } = req.body
			
			const candidate = await User.findOne({ username })

			if (candidate) {
				return res.status(401).json({ errors: [], message: `Имя уже используеться`, data: {} })
			}

			const hashedPassword = await bcrypt.hash(password, 12)
			const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

			const user = new User({ username, password: hashedPassword, userId: nanoid() })

			await user.save()

			res.status(201).json({ errors: [], message: 'Пользователь создан', data: {} })
		} catch (e) {
			console.log(req.body, e)
			res.status(500).json({ errors: [], message: 'Что-то пошло не так, попробуйте снова', data: {} })
		}
	}
)

router.post(
	'/signin',
	[check(['username', 'password'], 'Отсутствует пароль и/или имя пользователя').exists()],
	async (req, res) => {
		try {
			const errors = validationResult(req)

			if (!errors.isEmpty()) {
				return res.status(400).json({
					errors: errors.array(),
					message: 'Некорректные данные',
					data: { token: null, userId: null, username: null },
				})
			}

			const { username, password } = req.body

			const user = await User.findOne({ username })

			if (!user) {
				return res.status(401).json({
					errors: [],
					message: 'Пользователь не найден',
					data: { token: null, userId: null, username: null },
				})
			}

			const passwordIsMatch = await bcrypt.compare(password, user.password)

			if (!passwordIsMatch) {
				return res.status(401).json({
					errors: [],
					message: 'Неверный пароль',
					data: { token: null, userId: null, username: null },
				})
			}

			const token = jwt.sign({ userId: user.userId }, config.get('jwtSecret'), { expiresIn: '1m' })

			res.json({
				errors: [],
				message: 'Успешная авторизация',
				data: { token, userId: user.userId, username: user.username },
			})
		} catch (e) {
			res.status(500).json({
				errors: [],
				message: 'Что-то пошло не так, попробуйте снова',
				data: { token: null, userId: null, username: null },
			})
		}
	}
)

module.exports = router
