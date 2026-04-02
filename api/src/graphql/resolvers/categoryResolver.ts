import { Category } from "../../types/categoryTypes";

const categoryResolver = {
  categories: async (_args: any, context: { categoryRepo: any }) => {
    return await context.categoryRepo.getAll();
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
    const result = await context.categoryRepo.get("id", id);
    if (!result || !result[0]) throw new Error("Category not found");
    return result[0];
  },
  updateCategory: async (
    _args: Partial<Category>,
    context: { user: any; categoryRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await context.categoryRepo.update(_args);
    const result = await context.categoryRepo.get("id", _args.id);
    if (!result || !result[0]) throw new Error("Category not found");
    return result[0];
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
