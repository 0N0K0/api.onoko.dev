// Types GraphQL pour les médias
export const mediaTypes = `
    type Media {
        id: ID!
        label: String
        path: String!
        type: String!
        category: ID
        focus: String
    }
`;
export const mediaInputs = `
    scalar Upload

    input FileInput {
        file: Upload!
        category: ID
    }

    input MediaInput {
        label: String
        category: ID
        focus: String
    }
`;

// Requête GraphQL pour les médias
export const mediaQueries = `medias: [Media!]!`;

// Mutations GraphQL pour les médias
export const mediaMutations = `
    addMedia(input: FileInput): Boolean!
    updateMedia(id: ID!, input: MediaInput): Boolean!
    removeMedia(id: ID!): Boolean!
`;
