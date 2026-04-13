// Types GraphQL pour les catégories
export const categoryTypes = `
  type Category {
    id: ID!
    label: String!
    entity: String
    description: String
    parent: String
    depth: Int
    path: String
  }
`;

// Requêtes GraphQL pour les catégories
export const categoryQueries = `
  categories: [Category!]!
  category(key: String!, value: String!, entity: String): [Category!]
`;

// Mutations GraphQL pour les catégories
export const categoryMutations = `
  createCategory(input: { label: String!, entity: String!, description: String, parent: ID }): Boolean!
  updateCategory(id: ID!, input: { label: String, entity: String, description: String, parent: ID }): Boolean!
  deleteCategory(id: ID!): Boolean!
`;
