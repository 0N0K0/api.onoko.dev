// Types GraphQL pour les stacks
export const stackTypes = `
  type Stack {
    id: ID!
    label: String!
    icon: ID!
    description: String
    versions: [String!]
    skills: [String!]
    category: ID
  }
`;

// Requêtes GraphQL pour les stacks
export const stackQueries = `
  stacks: [Stack!]!
  stacksByCategory(key: String!, value: String!): [Stack!]!
  stack(key: String!, value: String!): Stack
`;

// Mutations GraphQL pour les stacks
export const stackMutations = `
  createStack(label: String!, icon: ID!, description: String, versions: [String!], skills: [String!], category: ID): Boolean!
  updateStack(id: ID!, label: String, icon: ID, description: String, versions: [String!], skills: [String!], category: ID): Boolean!
  deleteStack(id: ID!): Boolean!
`;
