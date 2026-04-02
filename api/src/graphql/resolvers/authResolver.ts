import {
  generateToken,
  verifyToken as verifyJwtToken,
} from "../../utils/auth/jwtUtils";
import { verifyPassword } from "../../utils/passwordUtils";

const authResolver = {
  login: async (
    _args: { login: string; password: string },
    context: { settingsRepo: any },
  ) => {
    const storedLogin = await context.settingsRepo.get("login");
    const storedHash = await context.settingsRepo.get("password_hash");
    if (!storedLogin || !storedHash || _args.login !== storedLogin) {
      throw new Error("Invalid credentials");
    }
    const valid = await verifyPassword(_args.password, storedHash);
    if (!valid) throw new Error("Invalid credentials");
    const token = generateToken({ login: _args.login });
    return { token };
  },

  refreshToken: async (_args: { token: string }) => {
    try {
      const payload = verifyJwtToken(_args.token);
      const newToken = generateToken({ login: payload.login });
      return { token: newToken };
    } catch {
      throw new Error("Invalid token");
    }
  },

  verifyToken: async (
    _args: { token: string },
    context: { settingsRepo: any },
  ) => {
    try {
      verifyJwtToken(_args.token);
      return { login: await context.settingsRepo.get("login") };
    } catch {
      throw new Error("Invalid token");
    }
  },
};

export default authResolver;
