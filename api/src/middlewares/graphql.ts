import { graphqlHTTP } from "express-graphql";
import jwt from "jsonwebtoken";
import mariadb from "mariadb";
import { verifyToken } from "../utils/auth/jwtUtils";
import { getGraphqlContext } from "../graphql/graphqlContext";
import { getRoot, getSchema } from "../graphql/graphqlSchema";

/**
 * Middleware pour gérer les requêtes GraphQL.
 * Vérifie l'authentification de l'utilisateur à partir du token JWT dans les en-têtes, puis crée le contexte GraphQL avec les informations de l'utilisateur et les repositories.
 * @param pool La pool de connexions à la base de données, utilisée pour créer les instances des repositories dans le contexte GraphQL.
 * @param isDev Un booléen indiquant si l'environnement est en développement, utilisé pour inclure la pile d'erreurs dans les réponses GraphQL en cas d'erreur.
 * @returns Un middleware Express pour gérer les requêtes GraphQL.
 */
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
