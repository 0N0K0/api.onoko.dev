export const mediaTypes = `
    type Media {
        id: ID!
        label: String
        path: String!
        type: String!
        category: ID
    }
`;

export const mediaQueries = `
    medias: [Media!]!
    media(id: ID!): Media
`;

export const mediaMutations = `
    addMedia(input: { file: Upload! }): Boolean!
    updateMedia(id: ID!, input: { label: String, category: ID }): Boolean!
    removeMedia(id: ID!): Boolean!
`;
