export const categoryTypes = `
  type Category {
    id: ID!
    label: String!
    entity: String
    description: String
    parent: String
    depth: Int
    entities: [Stack!]
  }
`;

export const categoryQueries = `
  categories: [Category!]!
  category(key: String!, value: String!, entity: String): [Category!]
`;

export const categoryMutations = `
  createCategory(label: String!, entity: String!, description: String, parent: ID): Category!
  updateCategory(id: ID!, label: String, entity: String, description: String, parent: ID): Category!
  deleteCategory(id: ID!): Boolean!
`;
