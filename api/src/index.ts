import path from "path";
import fs from "fs";
import "dotenv/config";
import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import mariadb from "mariadb";
import { Umzug } from "umzug";
import { initAdmin } from "./utils/initAdmin";
import { SettingsRepository } from "./repositories/SettingsRepository";
import { corsDynamicOrigin } from "./middlewares/corsDynamicOrigin";
import { authMutations, authTypes } from "./graphql/schemas/authSchema";
import {
  accountMutations,
  accountQueries,
  accountTypes,
} from "./graphql/schemas/accountSchema";
import authResolver from "./graphql/resolvers/authResolver";
import accountResolver from "./graphql/resolvers/accountResolver";
import { verifyToken } from "./utils/auth/jwtUtils";
import {
  stackMutations,
  stackQueries,
  stackTypes,
} from "./graphql/schemas/stackSchema";

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "onokodb",
  connectionLimit: 5,
});

export const settingsRepo = new SettingsRepository(pool);

async function main() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    fs.existsSync(path.join(__dirname, "migrations", "202603252047.js"));
  const migrationsPath = isProd
    ? path.join(__dirname, "migrations", "*.js")
    : path.join(__dirname, "migrations", "*.ts");

  const umzug = new Umzug({
    migrations: { glob: migrationsPath },
    context: pool,
    logger: console,
  });

  await umzug.up();

  await initAdmin(settingsRepo).catch((err) => {
    console.error("Admin init error:", err.message);
    process.exit(1);
  });

  const app = express();
  const port = 4000;
  app.use(express.json());

  app.use(
    "/public/stack",
    express.static(path.join(process.cwd(), "public", "stack")),
  );

  app.use(corsDynamicOrigin);

  const schema = buildSchema(`
    ${authTypes}
    ${accountTypes}
    ${stackTypes}
    type Query {
      ${accountQueries}
      ${stackQueries}
    }
    type Mutation {
      ${authMutations}
      ${accountMutations}
      ${stackMutations}
    }
  `);

  const root = {
    ...authResolver,
    ...accountResolver,
    ...stackResolver,
  };

  app.use(
    "/graphql",
    graphqlHTTP((req) => {
      let user = null;
      const auth = req.headers.authorization;
      if (auth && auth.startsWith("Bearer ")) {
        try {
          user = verifyToken(auth.slice(7));
        } catch {}
      }
      return {
        schema,
        rootValue: root,
        graphiql: true,
        context: { user },
        customFormatErrorFn: (err) => {
          console.error("GraphQL Error:", err);
          return { message: err.message, stack: err.stack };
        },
      };
    }),
  );

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}/graphql`);
  });
}

main();
