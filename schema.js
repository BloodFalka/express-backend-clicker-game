const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    userId: ID!,
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
    numInInv: Int!
  },

  type Query {
    users: [User!]!,
    user(username: String!): User!,
    me(username: String!, password: String!): GetMeResponce!,
    inventory(userId: String!): GetInvResponce!,
  }

  type Mutation {
        addUser (username: String!, password: String!): UpdateResponce!,
        changeGoldAmount (userId: String!, amount: Int!): UpdateResponce!,
        addItemToInventory (userId: String!): NewItemResponce!
    }

    type UpdateResponce {
      success: Boolean!
      message: String!
      user: User
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
    }
`;

module.exports = typeDefs;