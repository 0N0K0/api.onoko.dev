import { ImageFile } from "../../types/imageTypes";
import { Stack } from "../../types/stackTypes";

const stackResolver = {
  stacks: async (_args: any, { stackRepo }: { stackRepo: any }) => {
    return await stackRepo.getAll();
  },

  stacksByCategory: async (
    _args: { key: string; value: string },
    { stackRepo }: { stackRepo: any },
  ) => {
    return await stackRepo.getAllByCategory(_args.key, _args.value);
  },

  stack: async (
    _args: { key: string; value: string },
    { stackRepo }: { stackRepo: any },
  ) => {
    return await stackRepo.get(_args.key, _args.value);
  },

  createStack: async (
    _args: Omit<Stack, "id"> & {
      iconFile: ImageFile;
    },
    context: { user: any },
    { stackRepo }: { stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    const id = await stackRepo.create(_args);
    return await stackRepo.get("id", id);
  },

  updateStack: async (
    _args: Partial<Stack> & {
      iconFile?: ImageFile;
    },
    context: { user: any },
    { stackRepo }: { stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await stackRepo.update(_args);
    return await stackRepo.get("id", _args.id);
  },

  deleteStack: async (
    _args: { id: string },
    context: { user: any },
    { stackRepo }: { stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await stackRepo.delete(_args.id);
    return true;
  },
};

export default stackResolver;
