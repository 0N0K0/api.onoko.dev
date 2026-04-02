export const stackTypes = `
  type Stack {
    id: ID!
    label: String!
    iconUrl: String
    description: String
    versions: [String!]
    skills: [String!]
    category: Category
  }
`;

export const stackQueries = `
  stacks: [Stack!]!
  stacksByCategory(key: String!, value: String!): [Stack!]!
  stack(key: String!, value: String!): Stack
`;

export const stackMutations = `
  createStack(label: String!, iconFile: Upload!, description: String, versions: [String!], skills: [String!], category: ID): Stack!
  updateStack(id: ID!, label: String, iconFile: Upload, description: String, versions: [String!], skills: [String!], category: ID): Stack!
  deleteStack(id: ID!): Boolean!
`;
