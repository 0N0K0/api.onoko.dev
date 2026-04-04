import { Category } from "./categoryTypes";
import { Coworker } from "./coworkerTypes";
import { ImageFile } from "./imageTypes";
import { Role } from "./roleTypes";
import { Stack } from "./stackTypes";

// Interface représentant un projet
export interface Project {
  id: string;
  label: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  thumbnailFile?: ImageFile;
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
    imagesFiles?: ImageFile[];
  };
  client?: {
    label: string;
    logo?: string;
    logoUrl?: string;
    logoFile?: ImageFile;
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

// Interface représentant une ligne de projet dans la base de données, utilisée pour les opérations de lecture et d'écriture des projets dans la base de données.
export interface ProjectRow {
  id: string;
  label: string;
  thumbnail?: string;
  website_url?: string;
  website_label?: string;
  mockup_url?: string;
  mockup_label?: string;
  client_label?: string;
  client_logo?: string;
  manager_name?: string;
  manager_email?: string;
  start_date?: Date;
  end_date?: Date;
  intro_context?: string;
  intro_objective?: string;
  intro_client?: string;
  presentation_description?: string;
  presentation_issue?: string;
  presentation_audience?: string;
  need_features?: string;
  need_functional_constraints?: string;
  need_technical_constraints?: string;
  organization_workload?: string;
  organization_anticipation?: string;
  organization_methodology?: string;
  organization_evolution?: string;
  organization_validation?: string;
  kpis_issues?: number;
  kpis_points?: number;
  kpis_commits?: number;
  kpis_pull_requests?: number;
  feedback?: string;
  feedback_client?: string;
}
