export const mediaTypes = `
    type Media {
        id: ID!
        label: String
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
    addMedia(file: Upload!): Media!
    updateMedia(id: ID!, label: String, category: ID): Media!
    removeMedia(id: ID!): Boolean!
`;
