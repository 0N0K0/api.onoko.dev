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

export const categoryInputs = `
    input CategoryInput {
        label: String!
        entity: String!
        description: String
        parent: ID
    }
`;

// Requêtes GraphQL pour les catégories
export const categoryQueries = `
  categories: [Category!]!
  category(key: String!, value: String!, entity: String): [Category!]
`;

// Mutations GraphQL pour les catégories
export const categoryMutations = `
  createCategory(input: CategoryInput): Boolean!
  updateCategory(id: ID!, input: CategoryInput): Boolean!
  deleteCategory(id: ID!): Boolean!
`;
