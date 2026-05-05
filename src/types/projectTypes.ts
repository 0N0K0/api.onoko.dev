// Interface représentant un projet
export interface Project {
  id: string;
  slug: string;
  label: string;
  thumbnail?: string;
  categories?: string[];
  pined?: boolean;
  website?: {
    url: string;
    label?: string;
  };
  mockup?: {
    url?: string;
    label?: string;
    images?: { id: string; position: number }[];
    embed?: string;
  };
  client?: {
    label: string;
    logo?: string;
  };
  manager?: {
    name: string;
    email?: string;
  };
  startDate?: Date;
  endDate?: Date;
  intro?: string;
  presentation?: {
    context?: string;
    client?: string;
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
  roles?: string[];
  coworkers?: { id: string; roles?: string[] }[];
  stacks?: { id: string; section?: string; version?: string }[];
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
  slug: string;
  label: string;
  thumbnail_id?: string;
  pined?: boolean;
  website_url?: string;
  website_label?: string;
  mockup_url?: string;
  mockup_label?: string;
  mockup_embed?: string;
  client_label?: string;
  client_logo_id?: string;
  manager_name?: string;
  manager_email?: string;
  start_date?: Date;
  end_date?: Date;
  intro?: string;
  presentation_context?: string;
  presentation_client?: string;
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
