const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    _id: ID!,
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
    currentCat: Cat!
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

  type Message {
    id: ID!,
    body: String!,
    createTime: String!,
    likes: [String]!,
    user: MessageSendler!
    animation: Boolean!
  }

  type MessageSendler {
    id: String!,
    username: String!,
    avatarUrl: String!,
    backgroundUrl: String!,
  }

  type Query {
    users: [User!]!,
    user(username: String, token: String): User!,
    me(username: String!, password: String!): GetMeResponce!,
    inventory(token: String!, offset: Int, limit: Int): GetInvResponce!,
    cat(token: String!): GetCatResponce!,
    defaultAvas: GetDefaultAvasResponse!,
    messages(offset: Int, limit: Int): GetMessagesResponce!
  }


  type Mutation {
      addUser (username: String!, password: String!, avatar: Int!): NewUserResponce! ,
      changeGoldAmount (token: String!, amount:Int): UpdateResponce!,
      addItemToInventory (token: String!): ItemChangeResponce!,
      addXp (token: String!):  AddXpResponse!
      catBrushed(token: String!): UpdateResponce!
      changeLvl(token: String!, operator:String): UpdateResponce!# operator 'inc'|'dec'
      changeAvatar(token: String!, avatarId: String!): ItemChangeResponce!
      sendMessage(token: String!, body: String!): MessageMutationResponce!
      toggleLike(token: String!, messageId: String!): MessageMutationResponce!
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
      item: InventoryItem,
      user: User
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

    type GetMessagesResponce{
      success: Boolean!
      message: String!
			userMessages: [Message]
    }

    type MessageMutationResponce{
      success: Boolean!
      message: String!
			userMessage: Message
    }
`;


module.exports = typeDefs;