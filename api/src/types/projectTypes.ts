import { Category } from "./categoryTypes";
import { Coworker } from "./CoworkerTypes";
import { ImageFile } from "./imageTypes";
import { Role } from "./RoleTypes";
import { Stack } from "./stackTypes";

export interface Project {
  id: string;
  label: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  categories?: Category[] | string[];
  website?: {
    url: string;
    label: string;
  };
  mockup?: {
    url: string;
    label: string;
    images?: string[];
    imagesUrls?: string[];
  };
  client?: {
    label: string;
    logo?: string;
    logoUrl?: string;
  };
  manager?: {
    name: string;
    email?: string;
  };
  startDate?: Date;
  endDate?: Date;
  intro?: {
    context?: string;
    objective?: string;
    client?: string;
  };
  presentation?: {
    description?: string;
    issue?: string;
    audience?: string;
  };
  need?: {
    features?: string;
    functionalConstraints?: string;
    technicalConstraints?: string;
  };
  organization?: {
    workload?: string;
    anticipation?: string;
    methodology?: string;
    evolution?: string;
    validation?: string;
  };
  roles?: Role[] | string[];
  coworkers?: Coworker[];
  stacks?: (Partial<Stack> & { section?: string })[];
  kpis?: {
    issues?: number;
    points?: number;
    commits?: number;
    pullRequests?: number;
  };
  feedback?: {
    general?: string;
    client?: string;
  };
}

export interface ProjectInput {
  label: string;
  thumbnailFile?: ImageFile;
  categories?: string[];
  websiteLabel?: string;
  websiteUrl?: string;
  mockupUrl?: string;
  mockupLabel?: string;
  mockupImagesFiles?: ImageFile[];
  clientLabel?: string;
  clientLogoFile?: ImageFile;
  managerName?: string;
  managerEmail?: string;
  startDate?: string;
  endDate?: string;
  introContext?: string;
  introObjective?: string;
  introClient?: string;
  presentationDescription?: string;
  presentationIssue?: string;
  presentationAudience?: string;
  needFeatures?: string;
  needFunctionalConstraints?: string;
  needTechnicalConstraints?: string;
  organizationWorkload?: string;
  organizationAnticipation?: string;
  organizationMethodology?: string;
  organizationEvolution?: string;
  organizationValidation?: string;
  coworkers?: Array<{ id: string; roles: string[] }>;
  roles?: string[];
  stacks?: Array<{ id: string; version?: string; section?: string }>;
  kpisIssues?: number;
  kpisPoints?: number;
  kpisCommits?: number;
  kpisPullRequests?: number;
  feedbackGeneral?: string;
  feedbackClient?: string;
}
