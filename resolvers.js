const User = require("./models/User")
const bcrypt = require('bcryptjs')
const { customAlphabet } = require('nanoid')
const {items, chances, itemsImgPath} = require('./data/items/itemsAPI')
const Item = require("./models/Item")



const between = (min, max) =>{  
    return Math.floor(
      Math.random() * (max - min) + min
    )
}

const equalRandomFromArray = (a) => {
    return a[between(0, a.length)]
}

const randomFromItemTypeArray = () => {
    const ch = chances.typeChances
    const randPerc = (Math.random()*100).toFixed(2);
    console.log('type',randPerc,'%')
    if (randPerc <= ch.avatars ){
        return 'avatars'
    }
    else if(randPerc <= (ch.pets+ch.avatars)){
        return 'pets'
    }
    else if(randPerc <= (ch.pets+ch.avatars+ch.backgrounds)){
        return 'backgrounds'
    }
    else if(randPerc <= (ch.pets+ch.avatars+ch.backgrounds+ch.equipments)){
        return 'equipments'
    }
    else{
        return 'collectibles'
    }
}

const randomFromItemRarityArray = () => {
    const ch = chances.rarityChances
    const randPerc = (Math.random()*100).toFixed(2);
    console.log('rar', randPerc,'%')
    if (randPerc <= ch.exotic ){
        return 'exotic'
    }
    else if(randPerc <= (ch.exotic+ch.legendary)){
        return 'legendary'
    }
    else if(randPerc <= (ch.exotic+ch.legendary+ch.epic)){
        return 'epic'
    }
    else if(randPerc <= (ch.exotic+ch.legendary+ch.epic+ch.rare)){
        return 'rare'
    }
    else if(randPerc <= (ch.exotic+ch.legendary+ch.epic+ch.rare+ch.uncommon)){
        return 'uncommon'
    }
    else{
        return 'common'
    }
}

const resolvers = {
    Mutation: {
        async addUser (parent, args, context, info) {
            const {username, password, userId} = args

            const hashedPassword = await bcrypt.hash(password, 12)
			const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

            const userObj = new User({
                username,
                password: hashedPassword,
                userId
            })
            return userObj.save()
                .then(result => {
                    return {...result._doc}
                })
                .catch(err => {
                    console.error(err)
                })
        },

        // resetPassword (parent, args, context, info){
        //     const {oldPassword, newPassword} = args
        // },

        addItemToInventory (parent, args, context, info){
            console.log("👘👘👘👘👘👘👘")
            const {userId} = args

            const category = randomFromItemTypeArray();
            const rarity = randomFromItemRarityArray();
            let numInWorld;
            const newItem = equalRandomFromArray(items[category][rarity])



            return User.updateOne({userId}, {$push: {inventory: newItem}}).
                then(res => {
                    return Item.findOneAndUpdate(
                        {itemId:newItem.itemId}, 
                        {...newItem, 
                            imgUrl:`${itemsImgPath}${newItem.imgUrl}`,
                            category,
                            rarity,
                            $inc:{numInWorld: 1}},
                        {useFindAndModify: false, new: true, upsert: true}
                    ).
                    then(res=>{
                        numInWorld = res.numInWorld
                    }).
                    then(() =>{
                        return{
                            success: true,
                            message: `Ви отримали ${newItem.name}`,
                            item: {...newItem, 
                                    imgUrl:`${itemsImgPath}${newItem.imgUrl}`,
                                    category,
                                    rarity,
                                    numInWorld,
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
        }
    }
}

module.exports = resolvers;