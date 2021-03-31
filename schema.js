const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    _id: String!,
    username: String!,
    password: String!,
    stats: Stats!,
    gold: Int!,
    # inventory: [Item],
  },

  type Stats {
    lvl: Lvl,
    damage: Damage,
  },

  type Lvl {
    xp: Int!,
    currentLvl: Int!,
    currentStage: Int!,
    enemiesOnLvl: Int!,
  },

  type Damage {
    dpc: Int!,
    dps: Int!,
    critical: Critical,
    },

 type Critical{
    chance: Int!,
    multipler: Int!,
 }

  type Item {
    name: String!,
    lvl: String!,
    imgUrl: String!,
    category: String!,
    rarity: String!,
    itemId: String!,
    numInWorld: Int!,
    numInInv: Int!,
    updateTime: String!
  },

  type Query {
    users: [User!]!,
    user(username: String!): User!,
    me(username: String!, password: String!): GetMeResponce!,
    inventory(token: String!, offset: Int, limit: Int): GetInvResponce!,
  }

  type Mutation {
        addUser (username: String!, password: String!): NewUserResponce!,
        changeGoldAmount (token: String!, amount:Int): UpdateResponce!,
        addItemToInventory (token: String!): NewItemResponce!
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

    type NewItemResponce {
      success: Boolean!
      message: String!
      item: Item
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
      items: [Item]
      count: Int
    }


`;


module.exports = typeDefs;