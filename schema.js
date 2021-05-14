const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    _id: String!,
    username: String!,
    password: String!,
    stats: Stats!,
    gold: Int!,
    equipment: Equipment!
    background: EquipItem
    avatar: EquipItem
  },

  type Stats {
    lvl: Lvl!,
    stage: Stage!,
    damage: Damage!,
  },

  type Lvl {
    currentLvlXp: Int!,
    currentLvl: Int!,
  },

  type Stage {
    currentLocation: String!
    currentStage: Int!,
    currentCatOnStage: Int!,
    catsOnStage: Int!,
  }

  type Damage {
    dpc: Int!,
    dps: Int!,
    critical: Critical,
    },

 type Critical{
    chance: Float!,
    multipler: Float!,
 }

  type EquipItem {
    name: String!,
    lvl: Int!,
    imgUrl: String!,
    category: String!,
    rarity: String!,
    id: ID!,
    numInWorld: Int!,
    numInInv: Int!,
    updateTime: String!,
    tradable: Boolean!
  }

  type InventoryItem {
    name: String!,
    lvl: Int!,
    imgUrl: String!,
    category: String!,
    rarity: String!,
    id: ID!,
    numInWorld: Int!,
    numInInv: Int!,
    updateTime: String!,
    tradable: Boolean!,
    isEquipped: Boolean!,
  }

  type Equipment {
			glove: EquipItem,
			brush: EquipItem,
			scissors: EquipItem, 
			pet: EquipItem,
	},

  type Cat {
    name: String!,
    power: Float!,
    imgUrl: String!
    hp: Int!
    animation: Animation
  }

  type Animation{
    keyframes: AnimationFrames
    rows: Int
    columns: Int
    fps: Int
  }

  type AnimationFrames {
    walk: [Int!]
    appear: [Int!]
    die: [Int!]
  }

  type Query {
    users: [User!]!,
    user(username: String, token: String): User!,
    me(username: String!, password: String!): GetMeResponce!,
    inventory(token: String!, offset: Int, limit: Int): GetInvResponce!,
    cat(token: String!): GetCatResponce!,
    defaultAvas: GetDefaultAvasResponse!
  }


  type Mutation {
      addUser (username: String!, password: String!, avatar: Int!): NewUserResponce! ,
      changeGoldAmount (token: String!, amount:Int): UpdateResponce!,
      addItemToInventory (token: String!): ItemChangeResponce!,
      addXp (token: String!):  AddXpResponse!
      catBrushed(token: String!): UpdateResponce!
      changeLvl(token: String!, operator:String): UpdateResponce!# operator 'inc'|'dec'

      changeAvatar(token: String!, avatarId: String!): ItemChangeResponce!
  }

    type GetDefaultAvasResponse {
      success: Boolean!
      message: String!
      avatars: [String]
    }

    type AddXpResponse {
      success: Boolean!
      message: String!
      user: User
      isNewLvl: Boolean
    }

    type UpdateResponce {
      success: Boolean!
      message: String!
      user: User
    }

    type NewUserResponce {
      success: Boolean!
      message: String!
      user: User
      token: String
    }

    type ItemChangeResponce {
      success: Boolean!
      message: String!
      item: InventoryItem
    }

    type GetMeResponce {
      success: Boolean!
      message: String!
      user: User
      token: String
    }

    type GetInvResponce{
      success: Boolean!
      message: String!
      items: [InventoryItem]
      count: Int
    }

    type GetCatResponce{
      success: Boolean!
      message: String!
      cat: Cat
    }
`;


module.exports = typeDefs;