import { Role } from "../../types/RoleTypes";

const roleResolver = {
  roles: async (_args: any, context: { roleRepo: any }): Promise<Role[]> => {
    return await context.roleRepo.getAll();
  },
  role: async (
    _args: { key: string; value: string },
    context: { roleRepo: any },
  ): Promise<Role | null> => {
    return await context.roleRepo.get(_args);
  },
  createRole: async (
    _args: Omit<Role, "id">,
    context: { user: any; roleRepo: any },
  ): Promise<Role> => {
    if (!context.user) throw new Error("Unauthorized");
    const id = await context.roleRepo.create(_args);
    return await context.roleRepo.get("id", id);
  },
  updateRole: async (
    _args: Partial<Role>,
    context: { user: any; roleRepo: any },
  ): Promise<Role> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.roleRepo.update(_args);
    return await context.roleRepo.get("id", _args.id);
  },
  deleteRole: async (
    _args: { id: string },
    context: { user: any; roleRepo: any },
  ): Promise<boolean> => {
    if (!context.user) throw new Error("Unauthorized");
    await context.roleRepo.delete(_args.id);
    return true;
  },
};

export default roleResolver;
