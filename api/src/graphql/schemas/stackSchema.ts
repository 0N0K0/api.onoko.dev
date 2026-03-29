export const stackTypes = `
  type Stack {
    id: ID!
    label: String!
    icon: String!
    description: String
  }
  type StackVersion {
    version: String!
  }
`;

export const stackQueries = `
  stacks: [Stack!]!
  stack(id: ID!): Stack
  stackVersions(stackId: ID!): [StackVersion!]!
`;

export const stackMutations = `
  createStack(label: String!, icon: String!, description: String): Stack!
  updateStack(id: ID!, label: String, icon: String, description: String): Stack!
  deleteStack(id: ID!): Boolean!
  addStackVersion(stackId: ID!, version: String!): StackVersion!
  removeStackVersion(stackId: ID!, version: String!): Boolean!
`;
