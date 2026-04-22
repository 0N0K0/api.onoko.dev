// Types GraphQL pour les technologies
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

// Requête GraphQL pour les technologies
export const stackQueries = `stacks: [Stack!]!`;

// Mutations GraphQL pour les technologies
export const stackMutations = `
  createStack(input: StackInput): Boolean!
  updateStack(id: ID!, input: StackInput): Boolean!
  deleteStack(id: ID!): Boolean!
`;
