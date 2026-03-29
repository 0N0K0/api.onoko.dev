export const accountTypes = `
  type Account {
    login: String!
    email: String
  }
`;

export const accountQueries = `
  account: Account!
`;

export const accountMutations = `
  updateAccount(login: String, email: String, oldPassword: String!, newPassword: String): Account!
  requestResetPassword(email: String!): Boolean!
  resetPassword(token: String!, newPassword: String!): Boolean!
`;
