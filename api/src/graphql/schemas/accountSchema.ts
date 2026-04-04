// Types GraphQL pour le compte utilisateur
export const accountTypes = `
  type Account {
    login: String!
    email: String
  }
`;

// Requêtes GraphQL pour le compte utilisateur
export const accountQueries = `
  account: Account!
`;

// Mutations GraphQL pour le compte utilisateur
export const accountMutations = `
  updateAccount(login: String, email: String, oldPassword: String!, newPassword: String): Account!
  requestResetPassword(email: String!): Boolean!
  resetPassword(token: String!, newPassword: String!): Boolean!
`;
