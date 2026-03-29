import { settingsRepo } from "../..";
import {
  generateToken,
  verifyToken as verifyJwtToken,
} from "../../utils/auth/jwtUtils";
import { verifyPassword } from "../../utils/passwordUtils";

const authResolver = {
  login: async ({ login, password }: { login: string; password: string }) => {
    const storedLogin = await settingsRepo.get("login");
    const storedHash = await settingsRepo.get("password_hash");
    if (!storedLogin || !storedHash || login !== storedLogin) {
      throw new Error("Invalid credentials");
    }
    const valid = await verifyPassword(password, storedHash);
    if (!valid) throw new Error("Invalid credentials");
    const token = generateToken({ login });
    return { token };
  },

  refreshToken: async ({ token }: { token: string }) => {
    try {
      const payload = verifyJwtToken(token);
      const newToken = generateToken({ login: payload.login });
      return { token: newToken };
    } catch {
      throw new Error("Invalid token");
    }
  },

  verifyToken: async ({ token }: { token: string }) => {
    try {
      verifyJwtToken(token);
      return true;
    } catch {
      return false;
    }
  },
};

export default authResolver;
