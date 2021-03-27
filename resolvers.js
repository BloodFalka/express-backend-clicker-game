const User = require("./models/User")
const Inventory = require("./models/Inventory")
const bcrypt = require('bcryptjs')
const { customAlphabet } = require('nanoid')
const {items, chances, itemsImgPath, randomChanceFromArray} = require('./data/items/itemsAPI')
const Item = require("./models/Item")
const config = require('config')
const jwt = require('jsonwebtoken')

const colors = require('colors');


const between = (min, max) =>{  
    return Math.floor(
      Math.random() * (max - min) + min
    )
}

const equalRandomFromArray = (a) => {
    return a[between(0, a.length)]
}

const resolvers = {
    Mutation: {
        async addUser (parent, args, context, info) {
            const {username, password} = args

            //Перевірка чи вже є користувач
            const candidate = await User.findOne({username})

            if (candidate){
                return {
                    success: false,
                    message: 'Користувач з таким іменем вже існує',
                    user: candidate
                }
            }

            //Шифрування паролю
            const hashedPassword = await bcrypt.hash(password, 12)
            //Генерація id
			const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

            //Створення нового користувача
            const userObj = new User({
                username,
                password: hashedPassword,
                userId: nanoid()
            })

            const inventoryObj = new Inventory({
                _id: userObj._id,
            })

           

            return userObj.save()
                .then(result => {
                    inventoryObj.save().then(()=>{}).catch(err=>{console.error(err)})
                    return {
                        success: true,
                        message: 'Користувач успішно створений',
                        user: {...result._doc}
                    }
                    
                })
                .catch(err => {
                    console.error(err)
                })
        },

        async addItemToInventory (parent, args, context, info){
            console.log("👘👘👘👘👘👘👘👘👘👘👘👘👘👘")
            const {userId} = args

            let numInWorld;

            const category = randomChanceFromArray(chances.typeChances),
                rarity = randomChanceFromArray(chances.rarityChances, category);

            console.log(category.brightMagenta, rarity.rainbow)

            const newItem = {
                    ...equalRandomFromArray(items[category][rarity]),
                    rarity,
                    category
                }

            console.log(newItem.name.rainbow)
            
            return Item.findOneAndUpdate(
                {itemId:newItem.itemId}, 
                {...newItem, 
                    imgUrl:`${itemsImgPath}${newItem.imgUrl}`,
                    $inc:{numInWorld: 1}},
                {useFindAndModify: false, new: true, upsert: true}
            ).
            then(res=>{
                numInWorld = res.numInWorld
            }).
            then(async() => {
                const isItemAlredyInInv = await Inventory.findOne(
                    {$and: [
                    {_id: userId}, 
                    {"items.itemId": newItem.itemId} 
                    ]
                }
                );
                
                if(isItemAlredyInInv){
                    return Inventory.findOneAndUpdate(
                            {_id: userId}, 
                        {
                            $inc:{'items.$[e].numInInv': 1},
                            // $set:{'items.$[e]':{
                            //     ...newItem,
                            //     imgUrl:`${itemsImgPath}${newItem.imgUrl}`,
                            //     numInWorld},
                            // }
                        },
                        {arrayFilters: [{'e.itemId': newItem.itemId}],
                        useFindAndModify: false,
                        // upsert: true,
                        new:true}
                    ).
                    then((res) =>{
                        const numInInv = res.items.filter(i => {
                            return i.itemId === newItem.itemId
                        })[0].numInInv
                        console.log('update'.bgCyan, numInInv)
                        return{
                            success: true,
                            message: `Ви отримали ${newItem.name}`,
                            item: {...newItem, 
                                    imgUrl:`${itemsImgPath}${newItem.imgUrl}`,
                                    category,
                                    rarity,
                                    numInWorld,
                                    numInInv
                            }
                        }
                    }).
                    catch(e=>{
                        console.error(e)
                    })
                }
                return Inventory.findOneAndUpdate(
                    {_id:userId},
                    { $push: { items: 
                        { $each: [{
                            ...newItem, 
                            imgUrl:`${itemsImgPath}${newItem.imgUrl}`, 
                            numInWorld,
                            numInInv: 1,
                            }] 
                        ,$position:0 }} },
                    {useFindAndModify: false, new: true}
                ).
                then((res) =>{
                    console.log('create'.bgGreen)
                    return{
                        success: true,
                        message: `Ви отримали ${newItem.name}`,
                        item: {...newItem, 
                                imgUrl:`${itemsImgPath}${newItem.imgUrl}`,
                                category,
                                rarity,
                                numInWorld,
                                numInInv: res.items[0].numInInv
                        }
                    }
                }).
                catch(e=>{
                    console.error(e)
                })
            }).
            catch(e=>{
                console.error(e)
            })
        },

        changeGoldAmount (parent, args, context, info) {
            const {userId, amount} = args
            const succesMessage = `${amount >= 0? 'Успішно додано':'Витрачено'} ${Math.abs(amount)} дзвіночків`;

            return User.findOne({userId}).
                then(res => {
                    if(amount < 0 && (res.gold - Math.abs(amount)) < 0){
                        return {
                            success: false,
                            message: `У вас не вистачає ${Math.abs(res.gold - Math.abs(amount))} дзвіночків для покупки`,
                            user: res
                        }
                    }
                    return User.findOneAndUpdate(
                    {userId}, 
                    {$inc: {gold: amount}}, 
                    {useFindAndModify: false, new: true}
                    ).
                    then(res => {
                        if(res){
                            return {
                                success: true,
                                message: succesMessage,
                                user: res
                            }
                        }
                        return {
                            success: false,
                            message: 'Користувач не знайдений',
                            user: res
                        }
                    }).catch(err => {
                        console.error(error)
                    })
                }).catch(err => {
                    console.error(error)
                })
            }
        },

    Query: {
        users (parent, args, context, info) {
            return User.find()
                .then (users => {
                    return users.map (r => ({ ...r._doc }))
                })
                .catch (err => {
                    console.error(err)
                })
        },

        user (parent, args, context, info) {
            return User.findOne({ username: args.username })
                .then (user => {
                    if (!user) {
                        console.log('No user')
                    }
                    return { ...user._doc }
                })
                .catch (err => {
                    console.error(err)
                })
        },

        inventory (parent, args, context, info) {
            return Inventory.findOne({ user: args.username })
                .then (res => {
                    console.log(res.items)
                    if (!res) {
                        return{
                            success: false,
                            message: `За вашим запитом нічого не знайдено`,
                        }
                    }
                    return{
                        success: true,
                        message: `Ви отримали свій інвентар`,
                        items: res.items
                    }
                })
                .catch (err => {
                    console.error(err)
                    return{
                        success: false,
                        message: `Невідома помилка`,
                    }
                })
        },

        async me (parent, args, context, info) {
            const { username, password } = args

			const user = await User.findOne({ username })

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
                    userId: user.userId
                }, 
                config.get('jwtSecret'), 
                { expiresIn: '1m' }
                )

                console.log(jwt.decode(token))
            //Відповідь успішного входу
            return {
                success: true,
                message: 'Успішна авторизація',
                token: `Bearer ${token}`,
                user
            }
        }
    }
}

module.exports = resolvers;