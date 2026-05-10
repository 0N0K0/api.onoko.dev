// Types GraphQL pour les témoignages
export const testimonyTypes = `
    type Testimony {
        id: ID!
        name: String
        company: String
        content: String!
        createdAt: String
        insert: Boolean
    }
`;
export const testimonyInputs = `
    input TestimonyInput {
        name: String
        company: String
        content: String!
        createdAt: String
        insert: Boolean
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
