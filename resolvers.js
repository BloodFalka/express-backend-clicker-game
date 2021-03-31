const User = require("./models/User")
const Inventory = require("./models/Inventory")
const bcrypt = require('bcryptjs')
const { customAlphabet } = require('nanoid')
const {items, chances, itemsImgPath, randomChanceFromArray} = require('./data/items/itemsAPI')
const Item = require("./models/Item")
const config = require('config')
const jwt = require('jsonwebtoken')

const mongoose = require('mongoose')
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
			// const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

            //Створення нового користувача
            const userObj = new User({
                username,
                password: hashedPassword,
                // userId: nanoid()
            })

            const inventoryObj = new Inventory({
                _id: userObj._id,
            })

            const token = jwt.sign(
                {
                    username,
                    userId: userObj._id
                }, 
                config.get('jwtSecret'), 
                { expiresIn: '1m' }
                )

                console.log(jwt.decode(token))

            return userObj.save()
                .then(result => {
                    inventoryObj.save().then(()=>{}).catch(err=>{console.error(err)})
                    return {
                        success: true,
                        message: 'Користувач успішно створений',
                        user: {...result._doc},
                        token
                    }
                    
                })
                .catch(err => {
                    console.error(err)
                })
        },

        async addItemToInventory (parent, args, context, info){
            console.log("👘👘👘👘👘👘👘👘👘👘👘👘👘👘")
            const {token} = args,
            userId = jwt.decode(token).userId;

            let numInWorld;

            const category = randomChanceFromArray(chances.typeChances),
                rarity = randomChanceFromArray(chances.rarityChances, category);

            console.log(category.brightMagenta, rarity.rainbow)

            const newItem = {
                    ...equalRandomFromArray(items[category][rarity]),
                    rarity,
                    category,
                    updateTime: new Date()
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
                            $inc:{'items.$[e].numInInv': 1, count: 1},
                            'items.$[e].updateTime': newItem.updateTime
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
                    { $inc:{count: 1},
                        $push: { items: 
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
            const {token, amount} = args,
                userId = jwt.decode(token).userId;

            let userLvl, newAmount, succesMessage

            return User.findOne({_id: userId}).
                then(res => {
                    userLvl = res.stats.lvl.currentLvl
                    if(amount){
                        console.log(amount)
                        newAmount = amount
                    } else{
                        newAmount = userLvl*between(1,5)
                    }
                    succesMessage = `${newAmount >= 0? 'Успішно додано':'Витрачено'} ${Math.abs(newAmount)} шерсті`;

                    if(newAmount < 0 && (res.gold - Math.abs(newAmount)) < 0){
                        return {
                            success: false,
                            message: `У вас не вистачає ${Math.abs(res.gold - Math.abs(newAmount))} шерсті для покупки`,
                            user: res
                        }
                    }
                    return User.findOneAndUpdate(
                    {_id: userId}, 
                    {$inc: {gold: newAmount}}, 
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
            },

            addXp (parent, args, context, info) {
                const {token} = args,
                    userId = jwt.decode(token).userId;
    
                return User.findOne({_id: userId}).
                    then(res => {
                       
                        const userLvl = res.stats.lvl.currentLvl
                        const randomXp = userLvl*between(1,3)
                        console.log(randomXp)
                        return User.findOneAndUpdate(
                        {_id: userId}, 
                        {$inc: {'stats.lvl.xp': randomXp}}, 
                        {useFindAndModify: false, new: true}
                        ).
                        then(res => {
                            
                            if(res){
                                return {
                                    success: true,
                                    message: `Ви здобули досвіду: ${randomXp} `,
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
            const {token, offset, limit} = args,
            userId = jwt.decode(token).userId;
            console.log(userId, 'offset',offset, 'limit ',limit)

            return Inventory.aggregate([
                {$match:{'_id': mongoose.Types.ObjectId(userId)}},
                // { $project : { 'items' : 1 } },
                {$unwind: "$items"},

                {"$skip":offset||0},
                {"$limit":limit||5},
                
                
                {"$group":{
                    "_id":'$_id',
                    "items":{"$push":{
                        "name":"$items.name",
                        "lvl":"$items.lvl",
                        "imgUrl":"$items.imgUrl",
                        "category": "$items.category",
                        "rarity": "$items.rarity",
                        "itemId": "$items.itemId",
                        "numInWorld": "$items.numInWorld",
                        "numInInv": "$items.numInInv",
                        "updateTime": "$items.updateTime",
                    }, },
                    "count":{"$first":"$count"}
                }},
                
                // {"$sort":{"item.updateTime":-1}},
            ])
                .then (res => {
                    if (!res) {
                        return{
                            success: false,
                            message: `За вашим запитом нічого не знайдено`,
                        }
                    }
                    if(!res[0]?.items?.length){
                        console.log('none')
                        return{
                            success: true,
                            message: `Це все, ви досягли кінця`,
                            items: []
                        }
                    }
                    // console.log(res[0].items)
                    return{
                        success: true,
                        message: `Ви отримали свій інвентар`,
                        items: res[0].items,
                        count: res[0].count
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
                    userId: user._id
                }, 
                config.get('jwtSecret'), 
                { expiresIn: '1m' }
                )

            //Відповідь успішного входу
            return {
                success: true,
                message: 'Успішна авторизація',
                token,
                user
            }
        }
    }
}

module.exports = resolvers;