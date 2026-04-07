export const mediaTypes = `
    type Media {
        id: ID!
        path: String!
        type: String!
        category: Category
    }
`;

export const mediaQueries = `
    medias: [Media!]!
    media(id: ID!): Media
`;

export const mediaMutations = `
    addMedia(file: Upload!, category: ID!): Media!
    updateMedia(id: ID!, category: ID!): Media!
    removeMedia(id: ID!): Boolean!
`;
