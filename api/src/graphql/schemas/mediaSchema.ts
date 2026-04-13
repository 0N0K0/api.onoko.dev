export const mediaTypes = `
    type Media {
        id: ID!
        label: String
        path: String!
        type: String!
        category: ID
    }
`;

export const mediaInputs = `
    input FileInput {
        file: Upload!
    }

    input MediaInput {
        label: String
        category: ID
    }
`;

export const mediaQueries = `
    medias: [Media!]!
    media(id: ID!): Media
`;

export const mediaMutations = `
    addMedia(input: FileInput): Boolean!
    updateMedia(id: ID!, input: MediaInput): Boolean!
    removeMedia(id: ID!): Boolean!
`;
