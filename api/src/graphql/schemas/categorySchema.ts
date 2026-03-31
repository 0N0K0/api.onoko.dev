export const categoryTypes = `
  type Category {
    id: ID!
    label: String!
    entity: String
    description: String
    parent: Category | String
    children: [Category!]
    entities: [Stack!]
  }
`;

export const categoryQueries = `
  categories: [Category!]!
  category(id: ID!): Category
`;

export const categoryMutations = `
  createCategory(label: String!, entity: String!, description: String, parent: ID): Category!
  updateCategory(id: ID!, label: String, entity: String, description: String, parent: ID): Category!
  deleteCategory(id: ID!): Boolean!
`;
