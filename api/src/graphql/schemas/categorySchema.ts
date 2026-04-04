// Types GraphQL pour les catégories
export const categoryTypes = `
  type Category {
    id: ID!
    label: String!
    entity: String
    description: String
    parent: String
    entities: [Stack!]
    depth: Int
  }
`;

// Requêtes GraphQL pour les catégories
export const categoryQueries = `
  categories: [Category!]!
  category(key: String!, value: String!, entity: String): [Category!]
`;

// Mutations GraphQL pour les catégories
export const categoryMutations = `
  createCategory(label: String!, entity: String!, description: String, parent: ID): Category!
  updateCategory(id: ID!, label: String, entity: String, description: String, parent: ID): Category!
  deleteCategory(id: ID!): Boolean!
`;
