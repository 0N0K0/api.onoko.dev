// Types GraphQL pour les coworkers
export const coworkerTypes = `
  type Coworker {
    id: ID!
    name: String!
    roles: [ID!]
  }
`;

export const coworkerInputs = `
    input CoworkerInput {
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
  createCoworker(input: CoworkerInput): Boolean!
  updateCoworker(id: ID!, input: CoworkerInput): Boolean!
  deleteCoworker(id: ID!): Boolean!
`;
