// Type GraphQL pour les paramètres
export const settingsTypes = `
  type Settings {
    maintenance: Boolean!
  }
`;

// Requête GraphQL pour les paramètres
export const settingsQueries = `settings: Settings!`;

// Mutations GraphQL pour les paramètres
export const settingsMutations = `
  updateSettings(maintenance: Boolean!): Settings!
`;
