// Interface représentant un témoignage
export interface Testimony {
  id: string;
  name: string;
  company?: string;
  content: string;
  createdAt: Date;
}
