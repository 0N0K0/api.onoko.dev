// Types GraphQL pour les témoignages
export const testimonyTypes = `
    type Testimony {
        id: ID!
        name: String!
        company: String
        content: String!
        createdAt: String!
    }
`;
export const testimonyInputs = `
    input TestimonyInput {
        name: String!
        company: String
        content: String!
        createdAt: String
    }
`;

// Requête GraphQL pour les témoignages
export const testimonyQueries = `testimonies: [Testimony!]!`;

// Mutations GraphQL pour les témoignages
export const testimonyMutations = `
    createTestimony(input: TestimonyInput): Boolean!
    updateTestimony(id: ID!, input: TestimonyInput): Boolean!
    deleteTestimony(id: ID!): Boolean!
`;
