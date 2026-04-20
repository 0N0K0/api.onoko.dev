// Types GraphQL pour l'authentification
export const authTypes = `
  type AuthPayload {
    token: String!
  }
  type VerifyTokenPayload {
    login: String!
  }
`;

// Mutations GraphQL pour l'authentification
export const authMutations = `
  login(login: String!, password: String!): AuthPayload!
  refreshToken(token: String!): AuthPayload!
  verifyToken(token: String!): VerifyTokenPayload
`;
