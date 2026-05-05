// Types GraphQL pour les projets
export const projectTypes = `
    type Project {
        id: ID!
        slug: String
        label: String!
        thumbnail: ID
        categories: [ID!]
        pined: Boolean
        website: Website
        mockup: Mockup
        client: Client
        manager: Manager
        startDate: String
        endDate: String
        intro: String
        presentation: Presentation
        need: Need
        organization: Organization
        roles: [ID!]
        coworkers: [ProjectCoworker!]
        stacks: [ProjectStack!]
        kpis: KPIs
        feedback: Feedback
    }

    type Website {
        url: String!
        label: String
    }

    type MockupImage {
        id: ID!
        position: Int!
    }

    type Mockup {
        url: String
        label: String
        images: [MockupImage!]
        embed: String
    }

    type Client {
        label: String!
        logo: ID
    }

    type Manager {
        name: String!
        email: String
    }

    type Presentation {
        context: String
        client: String
        issue: String
        audience: String
    }

    type Need {
        features: String
        functionalConstraints: String
        technicalConstraints: String
    }

    type Organization {
        workload: String
        anticipation: String
        methodology: String
        evolution: String
        validation: String
    }

    type ProjectCoworker {
        id: ID!
        roles: [ID!]!
    }

    type ProjectStack {
        id: ID!
        version: String
        section: String
    }

    type KPIs {
        issues: Int
        points: Int
        commits: Int
        pullRequests: Int
    }

    type Feedback {
        general: String
        client: String
    }
`;
export const projectInputs = `
    input WebsiteInput {
        url: String!
        label: String!
    }

    input MockupImageInput {
        id: ID!
        position: Int!
    }

    input MockupInput {
        url: String
        label: String
        images: [MockupImageInput!]
        embed: String
    }
    
    input ClientInput {
        label: String!
        logo: ID
    }

    input ManagerInput {
        name: String!
        email: String
    }

    input PresentationInput {
        context: String
        client: String
        issue: String
        audience: String
    }

    input NeedInput {
        features: String
        functionalConstraints: String
        technicalConstraints: String
    }

    input OrganizationInput {
        workload: String
        anticipation: String
        methodology: String
        evolution: String
        validation: String
    }

    input ProjectCoworkerInput {
        id: ID!
        roles: [ID!]!
    }

    input ProjectStackInput {
        id: ID!
        version: String
        section: String
    }

    input KPIsInput {
        issues: Int
        points: Int
        commits: Int
        pullRequests: Int
    }

    input FeedbackInput {
        general: String
        client: String
    }
    
    input ProjectInput {
        slug: String
        label: String!
        thumbnail: ID
        categories: [ID!]
        pined: Boolean
        website: WebsiteInput
        mockup: MockupInput
        client: ClientInput
        manager: ManagerInput
        startDate: String
        endDate: String
        intro: String
        presentation: PresentationInput
        need: NeedInput
        organization: OrganizationInput
        coworkers: [ProjectCoworkerInput!]
        roles: [ID!]
        stacks: [ProjectStackInput!]
        kpis: KPIsInput
        feedback: FeedbackInput
    }
`;

// Requête GraphQL pour les projets
export const projectQueries = `projects: [Project!]!`;

// Mutations GraphQL pour les projets
export const projectMutations = `
    createProject(input: ProjectInput!): Boolean!
    updateProject(id: ID!, input: ProjectInput): Boolean!
    deleteProject(id: ID!): Boolean!
`;
