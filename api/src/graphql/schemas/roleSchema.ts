// Types GraphQL pour les rôles
export const roleTypes = `
    type Role {
        id: ID!
        label: String!
    }
`;

export const roleInputs = `
    input RoleInput {
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
    createRole(input: RoleInput): Boolean!
    updateRole(id: ID!, input: RoleInput): Boolean!
    deleteRole(id: ID!): Boolean!
`;
