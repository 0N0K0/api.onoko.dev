import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import mariadb from "mariadb";

const app = express();
const port = 4000;

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "example",
  database: process.env.DB_NAME || "exampledb",
  connectionLimit: 5,
});

const schema = buildSchema(`
  type Query {
    hello: String
    users: [User]
  }
  type User {
    id: ID!
    name: String
  }
`);

type User = {
  id: number;
  name: string;
};

const root = {
  hello: () => "Hello world!",
  users: async (): Promise<User[]> => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT id, name FROM users");
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },
};

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  }),
);

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}/graphql`);
});
