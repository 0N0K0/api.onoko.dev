import { graphqlHTTP } from "express-graphql";
import jwt from "jsonwebtoken";
import mariadb from "mariadb";
import { verifyToken } from "../utils/auth/jwtUtils";
import { getGraphqlContext } from "../graphql/graphqlContext";
import { getRoot, getSchema } from "../graphql/graphqlSchema";

export function createGraphqlHandler(pool: mariadb.Pool, isDev: boolean) {
  return graphqlHTTP((req) => {
    let user: jwt.JwtPayload | null = null;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      try {
        user = verifyToken(auth.slice(7));
      } catch {}
    }

    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded?.split(",")[0]
      )?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    return {
      schema: getSchema(),
      rootValue: getRoot(),
      graphiql: true,
      context: getGraphqlContext({ user, pool, ip }),
      customFormatErrorFn: (err) => {
        console.error("GraphQL Error:", err);
        return {
          message: err.message,
          ...(isDev && { stack: err.stack }),
        };
      },
    };
  });
}
