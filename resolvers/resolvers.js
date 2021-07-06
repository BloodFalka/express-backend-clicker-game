const Message = require('../models/chat/Message')
const User = require('../models/User')
const Inventory = require('../models/inventory/Inventory')
const bcrypt = require('bcryptjs')
const { items, chances, itemsImgPath, randomChanceFromArray, randomInPercentSucces } = require('../data/items/itemsAPI')
const {locations, catsImgPath} = require('../data/cats/catsAPI')
const Item = require('../models/Item')
const config = require('config')
const jwt = require('jsonwebtoken')

const {defAvatars, avasImgPath} = require('../data/defaultAvatars/defAvatarsAPI')

const mongoose = require('mongoose')
const colors = require('colors')
const { nanoid } = require('nanoid')
const { options } = require('mongoose')

const itemChance = 10

const between = (min, max) => {
	return Math.floor(Math.random() * (max - min) + min)
}

const equalRandomFromArray = (a) => {
	return a[between(0, a.length)]
}

const resolvers = {
	Mutation: {
		async addUser(parent, args, context, info) {
			const { username, password, avatar } = args

			//Перевірка чи вже є користувач
			const candidate = await User.findOne({ username })

			if (candidate) {
				return {
					success: false,
					message: 'Користувач з таким іменем вже існує',
					user: candidate,
				}
			}

			//Шифрування паролю
			const hashedPassword = await bcrypt.hash(password, 12)
			//Генерація id
			// const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

			const defAvatarsWithImg = defAvatars.epic.map((av, i)=>{
				return(
					{
						...av,
						imgUrl: avasImgPath+av.imgUrl,
						rarity:"epic",
						category:"avatar",
						tradable: false,
						updateTime: new Date(),
						numInWorld:0,
						isEquipped: avatar === i? true: false
					}
				)
			})

			const selectedAvatar = defAvatarsWithImg[avatar]

			//Береться рандомний кіт
			const randomCat = equalRandomFromArray(locations['grassland']['common'])
			const currentCat = {
				...randomCat,
				imgUrl: `${catsImgPath}${randomCat.imgUrl}`,
				hp: Math.ceil(randomCat.power*10)
			}

			//Створення нового користувача
			const userObj = new User({
				username,
				password: hashedPassword,
				avatar: selectedAvatar,
				stats:{
					stage:{
						currentCat
					}
				}
				// userId: nanoid()
			})

			const inventoryObj = new Inventory({
				_id: userObj._id,
				items: defAvatarsWithImg,
				count: defAvatars.epic.length
			})

			const token = jwt.sign(
				{
					username,
					userId: userObj._id,
				},
				config.get('jwtSecret'),
				{ expiresIn: '1m' }
			)

			console.log(jwt.decode(token))

			return userObj
				.save()
				.then((result) => {
					inventoryObj
						.save()
						.then(() => {})
						.catch((err) => {
							console.error(err)
						})
					return {
						success: true,
						message: 'Користувач успішно створений',
						user: { ...result._doc },
						token,
					}
				})
				.catch((err) => {
					console.error(err)
				})
		},

		async addItemToInventory(parent, args, context, info) {
			if(!randomInPercentSucces(itemChance)){
				console.log('No item'.red)
				return {
					success: true,
					message: `Ви не отримали предмет`,
				}
			}

			console.log('👘👘👘👘👘👘👘👘👘👘👘👘👘👘')
			const { token } = args,
				userId = jwt.decode(token).userId

			let numInWorld

			const category = randomChanceFromArray(chances.typeChances),
				rarity = randomChanceFromArray(chances.rarityChances, category)

			console.log(category.brightMagenta, rarity.rainbow)

			const newItem = {
				...equalRandomFromArray(items[category][rarity]),
				rarity,
				category,
				updateTime: new Date(),
			}

			console.log(newItem.name.rainbow)

			return Item.findOneAndUpdate(
				{ id: newItem.id },
				{ ...newItem, imgUrl: `${itemsImgPath}${newItem.imgUrl}`, $inc: { numInWorld: 1 } },
				{ useFindAndModify: false, new: true, upsert: true }
			)
				.then((res) => {
					numInWorld = res.numInWorld
				})
				.then(async () => {
					const isItemAlredyInInv = await Inventory.findOne({
						$and: [{ _id: userId }, { 'items.id': newItem.id }],
					})

					if (isItemAlredyInInv) {
						return Inventory.findOneAndUpdate(
							{ _id: userId },
							{
								$inc: { 'items.$[e].numInInv': 1, count: 1 },
								'items.$[e].numInWorld': numInWorld,
								'items.$[e].updateTime': newItem.updateTime,
							},
							{
								arrayFilters: [{ 'e.id': newItem.id }],
								useFindAndModify: false,
								// upsert: true,
								new: true,
							}
						)
							.then((res) => {
								const numInInv = res.items.filter((i) => {
									return i.id === newItem.id
								})[0].numInInv
								console.log('update'.bgCyan, numInInv)
								return {
									success: true,
									message: `Ви отримали ${newItem.name}`,
									item: {
										...newItem,
										imgUrl: `${itemsImgPath}${newItem.imgUrl}`,
										category,
										rarity,
										numInWorld,
										numInInv,
									},
								}
							})
							.catch((e) => {
								console.error(e)
							})
					}
					return Inventory.findOneAndUpdate(
						{ _id: userId },
						{
							$inc: { count: 1 },
							$push: {
								items: {
									$each: [
										{
											...newItem,
											imgUrl: `${itemsImgPath}${newItem.imgUrl}`,
											numInWorld,
											numInInv: 1,
										},
									],
									$position: 0,
								},
							},
						},
						{ useFindAndModify: false, new: true }
					)
						.then((res) => {
							console.log('create'.bgGreen)
							return {
								success: true,
								message: `Ви отримали ${newItem.name}`,
								item: {
									...newItem,
									imgUrl: `${itemsImgPath}${newItem.imgUrl}`,
									category,
									rarity,
									numInWorld,
									numInInv: res.items[0].numInInv,
								},
							}
						})
						.catch((e) => {
							console.error(e)
						})
				})
				.catch((e) => {
					console.error(e)
				})
		},

		changeGoldAmount(parent, args, context, info) {
			const { token, amount } = args,
				userId = jwt.decode(token).userId

			let newAmount, succesMessage

			return User.findOne({ _id: userId })
				.then((res) => {
					if (amount||amount===0) {
						console.log(amount)
						newAmount = amount
					} else {
						const {currentCatOnStage, catsOnStage, currentStage} = res.stats.stage
						const {currentLvl} = res.stats.lvl
	
						const isNextStage = currentCatOnStage >= catsOnStage? true: false
						const isBoss = currentStage % 5 === 0?true: false
						console.log('currentStage: ', currentStage, 'isNext: ', isNextStage, 'isBoss: ', isBoss)

						newAmount = currentLvl * between(1, 5) * (isBoss?10:1) 
					}
					succesMessage = `${newAmount >= 0 ? 'Успішно додано' : 'Витрачено'} ${Math.abs(newAmount)} шерсті`

					if (newAmount < 0 && res.gold - Math.abs(newAmount) < 0) {
						return {
							success: false,
							message: `У вас не вистачає ${Math.abs(res.gold - Math.abs(newAmount))} шерсті для покупки`,
							user: res,
						}
					}
					return User.findOneAndUpdate(
						{ _id: userId },
						{ $inc: { gold: newAmount } },
						{ useFindAndModify: false, new: true }
					)
						.then((res) => {
							if (res) {
								return {
									success: true,
									message: succesMessage,
									user: res,
								}
							}
							return {
								success: false,
								message: 'Користувач не знайдений',
								user: res,
							}
						})
						.catch((err) => {
							console.error(err)
							return {
								success: false,
								message: 'Помилка сервера',
							}
						})
				})
				.catch((err) => {
					console.error(err)
					return {
						success: false,
						message: 'Помилка сервера',
					}
				})
		},

		addXp(parent, args, context, info) {
			const { token } = args,
				userId = jwt.decode(token).userId

			return User.findOne({ _id: userId })
				.then((res) => {
					const userLvl = res.stats.lvl.currentLvl

					const {currentCatOnStage, catsOnStage, currentStage} = res.stats.stage
					const {currentLvl} = res.stats.lvl
					
					const isNextStage = currentCatOnStage >= catsOnStage? true: false
					
					const isBoss = currentStage % 5 === 0?true: false
					console.log('currentStage: ', currentStage, 'isNext: ', isNextStage, 'isBoss: ', isBoss)

					let currentLvlXp = res.stats.lvl.currentLvlXp

					let isNewLvl = false

					const xpToNewLvl = userLvl * 50
					const incomeXp = currentLvl * between(1,5) * (isBoss?10:1) 

					currentLvlXp += incomeXp

					if (currentLvlXp >= xpToNewLvl) {
						currentLvlXp -= xpToNewLvl
						isNewLvl = true
					}
	
					console.log('New Lvl'.america, isNewLvl)
					console.log(
						'To new lvl'.red,
						xpToNewLvl - currentLvlXp,
						'Gain Xp'.red,
						incomeXp,
						'Current lvl'.red,
						userLvl
					)

					return User.findOneAndUpdate(
						{ _id: userId },
						{
							$inc: {
								'stats.lvl.currentLvl': isNewLvl ? 1 : 0,
								'stats.damage.dpc' :isNewLvl? 1: 0
							},
							'stats.lvl.currentLvlXp': currentLvlXp,
						},
						{ useFindAndModify: false, new: true }
					)
						.then((res) => {
							if (res) {
								return {
									success: true,
									message: `Ви здобули досвіду: ${incomeXp}`,
									user: res,
									isNewLvl
								}
							}
							return {
								success: false,
								message: 'Користувач не знайдений',
								user: res,
							}
						})
						.catch((err) => {
							console.error(err)
							return {
								success: false,
								message: 'Помилка сервера',
							}
						})
				})
				.catch((err) => {
					console.error(err)
					return {
						success: false,
						message: 'Помилка сервера',
					}
				})
		},

		changeAvatar(parent, args){
			const {token, avatarId} = args,
			userId = jwt.decode(token).userId

			return Inventory.findOneAndUpdate(
				{ _id: userId },
				{
					'items.$[e].isEquipped': true
				},
				{
					arrayFilters: [{ 'e.id': avatarId }],
					useFindAndModify: false,
					new: true,
				}
			).then((inventory)=>{
				const selectedItem = inventory.items.filter(i=>i.id === avatarId)[0]

				if(!selectedItem){
					return {
						success: false,
						message: 'Такого предмета немає в вашому інвентарі',
					}
				}

				return User.findOneAndUpdate(
					{_id: userId},
					{
						'avatar': selectedItem
					},
					{
						useFindAndModify: false,
						new: false,
					}
				).then(user=>{
					const oldid = user.avatar.id

					if(oldid === avatarId){
						return {
							success: false,
							message: 'Цей аватар вже встановлено',
						}
					}

					return Inventory.findOneAndUpdate(
						{ _id: userId },
						{
							'items.$[e].isEquipped': false
						},
						{
							arrayFilters: [{ 'e.id': oldid }],
							useFindAndModify: false,
							new: true,
						}
					).then(()=>{
						return {
							success: true,
							message: `Успішно встановлено аватар `,
							item: selectedItem,
							user:{
								...user,
								_id: user._id,
								avatar: selectedItem
							}
						}
					}).catch(e=>{
						console.error(e)
						return {
							success: false,
							message: 'Помилка сервера',
						}
					})
				}).catch(e=>{
					console.error(e)
					return {
						success: false,
						message: 'Помилка сервера',
					}
				})
			}).catch(e=>{
				console.error(e)
				return {
					success: false,
					message: 'Помилка сервера',
				}
			})
		},

		changeLvl(parent, args, context, info){
			const { token, operator } = args,
			userId = jwt.decode(token).userId

			const selectLvl = operator === 'inc'? 1: operator === 'dec'? -1: 0

			return User.findOneAndUpdate(
				{_id: userId},
				{$inc:{'stats.stage.currentStage': selectLvl}},
				{ useFindAndModify: false, new: true }
				).then((user)=>{
					return {
						success: true,
						message: `Ти успішно ${operator==='inc'?'збільшив':'зменшив'} рівень на 1`,
						user
					}
			}).catch(e=>{
				console.error(e)
				return {
					success: false,
					message: 'Помилка сервера',
				}
			})
		}
		,

		catBrushed(parent, args, context, info){
			const { token } = args,
			userId = jwt.decode(token).userId

			console.log(token)
			return User.findOne({_id: userId}).then((user)=>{
				
				let {currentCatOnStage, currentStage, currentLocation} = user.stats.stage
				let {currentLvl} = user.stats.lvl

				let catsOnStage = Math.floor(currentLvl/100)+10
				let isNextStage = currentCatOnStage >= catsOnStage? true: false
				
				const IsNextBoss = (currentStage%5===4)&&isNextStage? true: false
				const IsBoss = currentStage%5===0? true: false
				if(IsNextBoss){
					catsOnStage = 1
				}
				if(IsBoss){
					isNextStage = true
				}

				console.log('stage:',currentStage, 'catsOnStage:', catsOnStage)

				if(isNextStage){
					currentStage += 1
					currentCatOnStage = 1
				}else{
					currentCatOnStage +=1
				}

				console.log('NextStage', isNextStage, 'cat:'.red,currentCatOnStage, 'stage:'.red, currentStage)

				const catType = IsNextBoss? 'bosses': 'common'
				const randomCat = equalRandomFromArray(locations[currentLocation][catType])
				const currentCat = {
					...randomCat,
					imgUrl: `${catsImgPath}${randomCat.imgUrl}`,
					hp: Math.ceil(randomCat.power*10*currentStage)
				}
				console.log(currentCat)

				return User.findOneAndUpdate(
					{ _id: userId },
					{
						'stats.stage.currentCatOnStage': currentCatOnStage,
						'stats.stage.currentStage': currentStage,	
						'stats.stage.catsOnStage': catsOnStage,
						'stats.stage.currentCat': currentCat	
					},
					{ useFindAndModify: false, new: true }
					)
					.then((user) => {
						if (!user) {
							console.log('No user')
							return {
								success: false,
								message: 'Користувач не знайдений',
							}
						}
	
						return {
							success: true,
							message: 'Кіт Успішно вичісаний',
							user
						}
					})
					.catch((err) => {
						console.error(err)
						return {
							success: false,
							message: 'Помилка сервера',
						}
					})
			}).catch((err)=>{
				console.error(err)
				return {
					success: false,
					message: 'Помилка сервера',
				}
			})
		},

		toggleLike(parent, args, context, info){
			const { token, messageId } = args,
				userId = jwt.decode(token).userId
			
			Message.findOneAndUpdate({id: messageId},
				{ $push: {
					likes: userId
				}},
				{ useFindAndModify: false, new: true, upsert: true }
			)
			.then((res) => {
				console.log(res)
				return{
					success: false,
					message: `Помилка Сервера`,
					userMessage: res
				}
			}).catch((err)=>{
				console.error(err)
				return {
					success: false,
					message: `Помилка Сервера`,
				}
			})
		},

		sendMessage(parent, args, context, info){
			const { token, body } = args,
				userId = jwt.decode(token).userId

			return User.findOne({_id: userId})
				.then((user)=>{
					const avatarUrl = user.avatar.imgUrl,
						// backgroundUrl = user.background.imgUrl,
						username = user.username

					const newMessage = new Message({
						id: nanoid(),
						body,
						createTime: new Date(),
						likes: [],
						user: {
							id: userId,
							username,
							avatarUrl,
							backgroundUrl: 'http://192.168.0.100:5000/images/items/backgrounds/bgCanyon.png',//need real ava
						}
					})

					return newMessage.save().then(()=>{
						return {
							success: true,
							message: `Успішно відправлено повідомлення`,
							userMessage: {...newMessage._doc, animation: true}
						}
					}).catch((err)=>{
						console.error(err)
						return {
							success: false,
							message: `Помилка Сервера`,
						}
					})
		
				}).catch((err)=>{
					console.error(err)
					return {
						success: false,
						message: `Помилка Сервера`,
					}
				})
		}
	},

	Query: {
		users(parent, args, context, info) {
			return User.find()
				.then((users) => {
					return users.map((r) => ({ ...r._doc }))
				})
				.catch((err) => {
					console.error(err)
				})
		},

		user(parent, args, context, info) {
			const {token, username} = args,
			name = token?jwt.decode(token).username: username

			return User.findOne({ username:name })
				.then((user) => {
					if (!user) {
						console.log('No user')
					}
					return { ...user._doc }
				})
				.catch((err) => {
					console.error(err)
				})
		},

		messages(parent, args, context, info) {
			const {offset, limit } = args
			console.log('offset', offset, 'limit ', limit)

			return Message.find().sort({_id:-1}).skip(offset||0).limit(limit||15)
				.then((messages) => {

					if (!messages.length) {
						console.log('none')
						return {
							success: true,
							message: `Це все, ви досягли кінця`,
							userMessages: [],
						}
					}

					return {
						success: true,
						message: `Успішно отримано всі повідомлення`,
						userMessages: messages.map((r) => ({ ...r._doc, animation: false })),
					}
				})
				.catch((err) => {
					console.error(err)
					return {
						success: false,
						message: `Помилка Сервера`,
						userMessages: [],
					}
				})
		},

		// messages(parent, args, context, info) {
		// 	const { token, offset, limit } = args,
		// 		userId = jwt.decode(token).userId
		// 	console.log('offset', offset, 'limit ', limit)
			
		// 	return Inventory.aggregate([
		// 		{ $match: { _id: mongoose.Types.ObjectId(userId) } },
		// 		// { $project : { 'items' : 1 } },
		// 		{ $unwind: '$items' },

		// 		{ $skip: offset || 0 },
		// 		{ $limit: limit || 15 },

		// 		{
		// 			$group: {
		// 				_id: '$_id',
		// 				items: {
		// 					$push: {
		// 						name: '$items.name',
		// 						lvl: '$items.lvl',
		// 						imgUrl: '$items.imgUrl',
		// 						category: '$items.category',
		// 						rarity: '$items.rarity',
		// 						id: '$items.id',
		// 						numInWorld: '$items.numInWorld',
		// 						numInInv: '$items.numInInv',
		// 						tradable: '$items.tradable',
		// 						isEquipped: '$items.isEquipped',
		// 						updateTime: '$items.updateTime',
		// 					},
		// 				},
		// 				count: { $first: '$count' },
		// 			},
		// 		},

		// 		// {"$sort":{"item.updateTime":-1}},
		// 	])
		// 		.then((res) => {
		// 			if (!res) {
		// 				return {
		// 					success: false,
		// 					message: `За вашим запитом нічого не знайдено`,
		// 				}
		// 			}
		// 			if (!res[0]?.items?.length) {
		// 				console.log('none')
		// 				return {
		// 					success: true,
		// 					message: `Це все, ви досягли кінця`,
		// 					items: [],
		// 				}
		// 			}
		// 			// console.log(res[0].items)
		// 			return {
		// 				success: true,
		// 				message: `Ви отримали свій інвентар`,
		// 				items: res[0].items,
		// 				count: res[0].count,
		// 			}
		// 		})
		// 		.catch((err) => {
		// 			console.error(err)
		// 			return {
		// 				success: false,
		// 				message: `Невідома помилка`,
		// 			}
		// 		})
		// },

		inventory(parent, args, context, info) {
			const { token, offset, limit } = args,
				userId = jwt.decode(token).userId
			console.log('offset', offset, 'limit ', limit)
			return Inventory.aggregate([
				{ $match: { _id: mongoose.Types.ObjectId(userId) } },
				// { $project : { 'items' : 1 } },
				{ $unwind: '$items' },

				{ $skip: offset || 0 },
				{ $limit: limit || 5 },

				{
					$group: {
						_id: '$_id',
						items: {
							$push: {
								name: '$items.name',
								lvl: '$items.lvl',
								imgUrl: '$items.imgUrl',
								category: '$items.category',
								rarity: '$items.rarity',
								id: '$items.id',
								numInWorld: '$items.numInWorld',
								numInInv: '$items.numInInv',
								tradable: '$items.tradable',
								isEquipped: '$items.isEquipped',
								updateTime: '$items.updateTime',
							},
						},
						count: { $first: '$count' },
					},
				},

				// {"$sort":{"item.updateTime":-1}},
			])
				.then((res) => {
					if (!res) {
						return {
							success: false,
							message: `За вашим запитом нічого не знайдено`,
						}
					}
					if (!res[0]?.items?.length) {
						console.log('none')
						return {
							success: true,
							message: `Це все, ви досягли кінця`,
							items: [],
						}
					}
					// console.log(res[0].items)
					return {
						success: true,
						message: `Ви отримали свій інвентар`,
						items: res[0].items,
						count: res[0].count,
					}
				})
				.catch((err) => {
					console.error(err)
					return {
						success: false,
						message: `Невідома помилка`,
					}
				})
		},
		
		defaultAvas(){
			if(defAvatars.epic){ 
				return {
					success: true,
					message: 'Ви отримали стандартні аватари',
					avatars: defAvatars.epic.map(i=>avasImgPath+i.imgUrl)
				}
			}else{
				return {
					success: false,
					message: 'Стандартних аватарів не знайдено',
				}
			}
		},

		cat(parent, args, context, info){
			const { token } = args,
			userId = jwt.decode(token).userId
			console.log(token)
			return User.findOne(
				{ _id: userId }
				)
				.then((user) => {
					if (!user) {
						console.log('No user')
						return {
							success: false,
							message: 'Користувач не знайдений',
						}
					}
					const {currentStage, currentLocation} = user.stats.stage

					const catType = currentStage % 5 === 0? 'bosses': 'common'

					const randomCat = equalRandomFromArray(locations[currentLocation][catType])
					const cat = {
						...randomCat,
						imgUrl: `${catsImgPath}${randomCat.imgUrl}`,
						hp: Math.ceil(randomCat.power*10*currentStage)
					}
					console.log(cat)

					return {
						success: true,
						message: 'Отриманий новий Кіт',
						cat
					}
				})
				.catch((err) => {
					console.error(err)
					return {
						success: false,
						message: 'Помилка на сервері'
					}
				})
		},

		async me(parent, args, context, info) {
			const { username, password } = args
			console.log(username, password)

			const user = await User.findOne({ username })
			console.log(user._id)
			//Користувач з таким ім'ям не знайдений
			if (!user) {
				return {
					success: false,
					message: 'Користувач не знайдений',
				}
			}

			//Перевірка зашифрованого пароолю
			const passwordIsMatch = await bcrypt.compare(password, user.password)

			//Пароль не співпав
			if (!passwordIsMatch) {
				return {
					success: false,
					message: 'Невірний пароль',
				}
			}

			//Генерація JWT якщо паролі співпали
			const token = jwt.sign(
				{
					username,
					userId: user._id,
				},
				config.get('jwtSecret'),
				{ expiresIn: '1m' }
			)

			//Відповідь успішного входу
			return {
				success: true,
				message: 'Успішна авторизація',
				token,
				user,
			}
		},
	},
}

module.exports = resolvers
