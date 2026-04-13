// Types GraphQL pour les rôles
export const roleTypes = `
    type Role {
        id: ID!
        label: String!
    }
`;

// Requêtes GraphQL pour les rôles
export const roleQueries = `
    roles: [Role!]!
    role(id: ID!): Role
`;

// Mutations GraphQL pour les rôles
export const roleMutations = `
    createRole(label: String!): Boolean!
    updateRole(id: ID!, label: String): Boolean!
    deleteRole(id: ID!): Boolean!
`;
