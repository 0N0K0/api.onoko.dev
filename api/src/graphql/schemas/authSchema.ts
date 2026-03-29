const authTypes = `
  type AuthPayload {
    token: String!
  }
`;

const authMutations = `
  login(login: String!, password: String!): AuthPayload!
  refreshToken(token: String!): AuthPayload!
  verifyToken(token: String!): Boolean!
`;

export { authTypes, authMutations };
