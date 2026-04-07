// Types GraphQL pour les stacks
export const stackTypes = `
  type Stack {
    id: ID!
    label: String!
    icon: Media
    description: String
    versions: [String!]
    skills: [String!]
    category: Category
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
  createStack(label: String!, icon_id: ID!, description: String, versions: [String!], skills: [String!], category: ID): Stack!
  updateStack(id: ID!, label: String, icon_id: ID, description: String, versions: [String!], skills: [String!], category: ID): Stack!
  deleteStack(id: ID!): Boolean!
`;
