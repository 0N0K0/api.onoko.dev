import { ImageFile } from "../../types/imageTypes";
import { Stack } from "../../types/stackTypes";

const stackResolver = {
  stacks: async (_args: any, context: { stackRepo: any }) => {
    return await context.stackRepo.getAll();
  },

  stacksByCategory: async (
    _args: { key: string; value: string },
    context: { stackRepo: any },
  ) => {
    return await context.stackRepo.getAllByCategory(_args.key, _args.value);
  },

  stack: async (
    _args: { key: string; value: string },
    context: { stackRepo: any },
  ) => {
    return await context.stackRepo.get(_args.key, _args.value);
  },

  createStack: async (
    _args: Omit<Stack, "id"> & {
      iconFile: ImageFile;
    },
    context: { user: any; stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    const id = await context.stackRepo.create(_args);
    return await context.stackRepo.get("id", id);
  },

  updateStack: async (
    _args: Partial<Stack> & {
      iconFile?: ImageFile;
    },
    context: { user: any; stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await context.stackRepo.update(_args);
    return await context.stackRepo.get("id", _args.id);
  },

  deleteStack: async (
    _args: { id: string },
    context: { user: any; stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await context.stackRepo.delete(_args.id);
    return true;
  },
};

export default stackResolver;
