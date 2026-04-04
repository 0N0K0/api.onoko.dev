import { Coworker } from "../../types/coworkerTypes";

const coworkerResolver = {
  coworkers: async (
    _args: any,
    context: { coworkerRepo: any },
  ): Promise<Coworker[]> => {
    return await context.coworkerRepo.getAll();
  },
  coworker: async (
    _args: { key: string; value: string },
    context: { coworkerRepo: any },
  ): Promise<Coworker | null> => {
    return await context.coworkerRepo.get(_args);
  },
  createCoworker: async (
    _args: Omit<Coworker, "id">,
    context: { user: any; coworkerRepo: any },
  ): Promise<Coworker> => {
    if (!context.user) throw new Error("Unauthorized");
    const id = await context.coworkerRepo.create(_args);
    return await context.coworkerRepo.get("id", id);
  },
  updateCoworker: async (
    _args: Partial<Coworker>,
    context: { user: any; coworkerRepo: any },
  ): Promise<Coworker> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.coworkerRepo.update(_args);
    return await context.coworkerRepo.get("id", _args.id);
  },
  deleteCoworker: async (
    _args: { id: string },
    context: { user: any; coworkerRepo: any },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.coworkerRepo.delete(_args.id);
    return true;
  },
};

export default coworkerResolver;
