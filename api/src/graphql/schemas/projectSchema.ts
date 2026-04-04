// Types GraphQL pour les projets
export const projectTypes = `
    type Project {
        id: ID!
        label: String!
        thumbnailUrl: String
        categories: [Category!]
        website: Website
        mockup: Mockup
        client: Client
        manager: Manager
        startDate: String
        endDate: String
        intro: Intro
        presentation: Presentation
        need: Need
        organization: Organization
        roles: [Role!]
        coworkers: [Coworker!]
        stacks: [ProjectStack!]
        kpis: KPIs
        feedback: Feedback
    }

    type Website {
        url: String!
        label: String!
    }

    type Mockup {
        url: String!
        label: String!
        imagesUrls: [String!]
    }

    type Client {
        label: String!
        logoUrl: String
    }

    type Manager {
        name: String!
        email: String
    }

    type Intro {
        context: String
        objective: String
        client: String
    }

    type Presentation {
        description: String
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

    type ProjectStack {
        id: ID!
        label: String!
        iconUrl: String
        version: String
        category: Category
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

// Types GraphQL pour les entrées de projet (utilisées pour les mutations)
export const projectInputs = `
    input WebsiteInput {
        url: String!
        label: String!
    }

    input MockupInput {
        url: String!
        label: String!
        imagesFiles: [Upload!]
    }
    
    input ClientInput {
        label: String!
        logoFile: Upload
    }

    input ManagerInput {
        name: String!
        email: String
    }

    input IntroInput {
        context: String
        objective: String
        client: String
    }

    input PresentationInput {
        description: String
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

    input CoworkerInput {
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
        label: String!
        thumbnailFile: Upload
        categories: [ID!]
        website: WebsiteInput
        mockup: MockupInput
        client: ClientInput
        manager: ManagerInput
        startDate: String
        endDate: String
        intro: IntroInput
        presentation: PresentationInput
        need: NeedInput
        organization: OrganizationInput
        coworkers: [CoworkerInput!]
        roles: [ID!]
        stacks: [ProjectStackInput!]
        kpis: KPIsInput
        feedback: FeedbackInput
    }
`;

// Requêtes GraphQL pour les projets
export const projectQueries = `
    projects: [Project!]!
    project(id: ID!): Project
`;

// Mutations GraphQL pour les projets
export const projectMutations = `
    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectInput): Project!
    deleteProject(id: ID!): Boolean!
`;
