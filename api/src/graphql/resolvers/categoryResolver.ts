import { Category } from "../../types/categoryTypes";

const categoryResolver = {
  categories: async (_args: any, context: { categoryRepo: any }) => {
    return await context.categoryRepo.getAll();
  },
  categoriesByEntity: async (
    _args: { entity: string },
    context: { categoryRepo: any },
  ) => {
    return await context.categoryRepo.getAllByEntity(_args.entity);
  },
  category: async (
    _args: { key: "id" | "label"; value: any; entity: string },
    context: { categoryRepo: any },
  ) => {
    return await context.categoryRepo.get(_args.key, _args.value, _args.entity);
  },
  createCategory: async (
    _args: Omit<Category, "id">,
    context: { user: any; categoryRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    const id = await context.categoryRepo.create(_args);
    return await context.categoryRepo.get("id", id);
  },
  updateCategory: async (
    _args: Partial<Category>,
    context: { user: any; categoryRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await context.categoryRepo.update(_args);
    return await context.categoryRepo.get("id", _args.id);
  },
  deleteCategory: async (
    _args: { id: string },
    context: { user: any; categoryRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await context.categoryRepo.delete(_args.id);
    return true;
  },
};

export default categoryResolver;
