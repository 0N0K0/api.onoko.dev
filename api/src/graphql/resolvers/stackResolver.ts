const stackResolver = {
  Stack: {
    imageUrl: (stack: any) => {
      return `/public/stack/${stack.icon}`;
    },
  },
  stacks: async (_args: any, { stackRepo }: { stackRepo: any }) => {
    return await stackRepo.getAll();
  },
  stack: async (_args: { id: string }, { stackRepo }: { stackRepo: any }) => {
    return await stackRepo.get("id", _args.id);
  },
  createStack: async (
    _args: {
      label: string;
      icon: string;
      description?: string;
      versions?: string[];
    },
    context: { user: any },
    { stackRepo }: { stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await stackRepo.create(_args);
    if (_args.versions && _args.versions.length > 0) {
      const stack = await stackRepo.get("label", _args.label);
      for (const version of _args.versions) {
        await stackRepo.addVersion(stack.id, version);
      }
    }
    return await stackRepo.get("label", _args.label);
  },
  updateStack: async (
    _args: { id: string; label?: string; icon?: string; description?: string },
    context: { user: any },
    { stackRepo }: { stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await stackRepo.update(_args.id, _args);
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
  stackVersions: async (
    _args: { stackId: string },
    context: { user: any },
    { stackRepo }: { stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    return await stackRepo.getVersions(_args.stackId);
  },
  addStackVersion: async (
    _args: { stackId: string; version: string },
    context: { user: any },
    { stackRepo }: { stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await stackRepo.addVersion(_args.stackId, _args.version);
    return { version: _args.version };
  },
  removeStackVersion: async (
    _args: { stackId: string; version: string },
    context: { user: any },
    { stackRepo }: { stackRepo: any },
  ) => {
    if (!context.user) throw new Error("Unauthorized");
    await stackRepo.removeVersion(_args.stackId, _args.version);
    return true;
  },
};
