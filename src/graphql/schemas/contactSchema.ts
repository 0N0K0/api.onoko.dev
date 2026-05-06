export const contactTypes = `
  enum ContactSubject {
    project
    rdv
    other
  }
`;

// Mutations GraphQL pour le formulaire de contact
export const contactMutation = `
  sendContact(
    company: String,
    name: String,
    email: String!,
    phone: String,
    subject: ContactSubject!,
    customSubject: String,
    message: String!
  ): Boolean!
`;
