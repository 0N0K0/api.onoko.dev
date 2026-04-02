export const roleTypes = `
    type Role {
        id: ID!
        label: String!
    }
`;

export const roleQueries = `
    roles: [Role!]!
    role(id: ID!): Role
`;

export const roleMutations = `
    createRole(label: String!): Role!
    updateRole(id: ID!, label: String): Role!
    deleteRole(id: ID!): Boolean!
`;
