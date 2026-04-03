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

    input CoworkerInput {
        id: ID!
        roles: [ID!]!
    }

    input ProjectStackInput {
        id: ID!
        version: String
        section: String
    }
    
    input ProjectInput {
        label: String!
        thumbnailFile: Upload
        categories: [ID!]
        websiteLabel: String
        websiteUrl: String
        mockupUrl: String
        mockupLabel: String
        mockupImagesFiles: [Upload!]
        clientLabel: String
        clientLogoFile: Upload
        managerName: String
        managerEmail: String
        startDate: String
        endDate: String
        introContext: String
        introObjective: String
        introClient: String
        presentationDescription: String
        presentationIssue: String
        presentationAudience: String
        needFeatures: String
        needFunctionalConstraints: String
        needTechnicalConstraints: String
        organizationWorkload: String
        organizationAnticipation: String
        organizationMethodology: String
        organizationEvolution: String
        organizationValidation: String
        coworkers: [CoworkerInput!]
        roles: [ID!]
        stacks: [ProjectStackInput!]
        kpisIssues: Int
        kpisPoints: Int
        kpisCommits: Int
        kpisPullRequests: Int
        feedbackGeneral: String
        feedbackClient: String
    }
`;

export const projectQueries = `
    projects: [Project!]!
    project(id: ID!): Project
`;

export const projectMutations = `
    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectInput): Project!
    deleteProject(id: ID!): Boolean!
`;
