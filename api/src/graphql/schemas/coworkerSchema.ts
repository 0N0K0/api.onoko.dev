export const coworkerTypes = `
  type Coworker {
    id: ID!
    name: String!
    roles: [Role!]
  }
`;

export const coworkerQueries = `
  coworkers: [Coworker!]!
  coworker(id: ID!): Coworker
`;

export const coworkerMutations = `
  createCoworker(name: String!, roleIds: [ID!]): Coworker!
  updateCoworker(id: ID!, name: String, roleIds: [ID!]): Coworker!
  deleteCoworker(id: ID!): Boolean!
`;
