const authTypes = `
  type AuthPayload {
    token: String!
  }
  type VerifyTokenPayload {
    login: String!
  }
`;

const authMutations = `
  login(login: String!, password: String!): AuthPayload!
  refreshToken(token: String!): AuthPayload!
  verifyToken(token: String!): VerifyTokenPayload
`;

export { authTypes, authMutations };
