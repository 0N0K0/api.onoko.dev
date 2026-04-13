// Types GraphQL pour les coworkers
export const coworkerTypes = `
  type Coworker {
    id: ID!
    name: String!
    roles: [ID!]
  }
`;

// Requêtes GraphQL pour les coworkers
export const coworkerQueries = `
  coworkers: [Coworker!]!
  coworker(id: ID!): Coworker
`;

// Mutations GraphQL pour les coworkers
export const coworkerMutations = `
  createCoworker(input: { name: String!, roles: [ID!] }): Boolean!
  updateCoworker(id: ID!, input: { name: String, roles: [ID!] }): Boolean!
  deleteCoworker(id: ID!): Boolean!
`;
