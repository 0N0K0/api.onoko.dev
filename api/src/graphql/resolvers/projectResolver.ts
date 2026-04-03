import { Project, ProjectInput } from "../../types/projectTypes";

const projectResolver = {
  projects: async (
    _args: any,
    context: { projectRepo: any },
  ): Promise<Project[]> => {
    return await context.projectRepo.getAll();
  },
  project: async (
    _args: { key: string; value: string },
    context: { projectRepo: any },
  ): Promise<Project | null> => {
    return await context.projectRepo.get(_args);
  },
  createProject: async (
    _args: { input: Omit<ProjectInput, "id"> },
    context: { user: any; projectRepo: any },
  ): Promise<Project> => {
    if (!context.user) throw new Error("Unauthorized");
    const id = await context.projectRepo.create(_args.input);
    return await context.projectRepo.get("id", id);
  },
  updateProject: async (
    _args: { id: string; input: Partial<ProjectInput> },
    context: { user: any; projectRepo: any },
  ): Promise<Project> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.projectRepo.update(_args.id, _args.input);
    return await context.projectRepo.get("id", _args.id);
  },
  deleteProject: async (
    _args: { id: string },
    context: { user: any; projectRepo: any },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.projectRepo.delete(_args.id);
    return true;
  },
};

export default projectResolver;
