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

export const stackInputs = `
  input StackInput {
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
  createStack(input: StackInput): Boolean!
  updateStack(id: ID!, input: StackInput): Boolean!
  deleteStack(id: ID!): Boolean!
`;
