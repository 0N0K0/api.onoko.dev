// Types GraphQL pour les intervenants
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

// Requête GraphQL pour les intervenants
export const coworkerQueries = `coworkers: [Coworker!]!`;

// Mutations GraphQL pour les intervenants
export const coworkerMutations = `
  createCoworker(input: CoworkerInput): Boolean!
  updateCoworker(id: ID!, input: CoworkerInput): Boolean!
  deleteCoworker(id: ID!): Boolean!
`;
