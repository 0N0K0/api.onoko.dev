import { Category } from "./categoryTypes";
import { Coworker } from "./coworkerTypes";
import { ImageFile } from "./imageTypes";
import { Role } from "./roleTypes";
import { Stack } from "./stackTypes";

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
