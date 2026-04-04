import { buildSchema } from "graphql";
import { authMutations, authTypes } from "./schemas/authSchema";
import {
  accountMutations,
  accountQueries,
  accountTypes,
} from "./schemas/accountSchema";
import {
  stackMutations,
  stackQueries,
  stackTypes,
} from "./schemas/stackSchema";
import {
  categoryMutations,
  categoryQueries,
  categoryTypes,
} from "./schemas/categorySchema";
import { roleMutations, roleQueries, roleTypes } from "./schemas/roleSchema";
import {
  coworkerMutations,
  coworkerQueries,
  coworkerTypes,
} from "./schemas/coworkerSchema";
import {
  projectMutations,
  projectQueries,
  projectTypes,
} from "./schemas/projectSchema";
import authResolver from "./resolvers/authResolver";
import accountResolver from "./resolvers/accountResolver";
import stackResolver from "./resolvers/stackResolver";
import categoryResolver from "./resolvers/categoryResolver";
import roleResolver from "./resolvers/roleResolver";
import coworkerResolver from "./resolvers/coworkerResolver";
import projectResolver from "./resolvers/projectResolver";

export function getSchema() {
  return buildSchema(`
    scalar Upload
    ${authTypes}
    ${accountTypes}
    ${categoryTypes}
    ${stackTypes}
    ${roleTypes}
    ${coworkerTypes}
    ${projectTypes}
    type Query {
      ${accountQueries}
      ${categoryQueries}
      ${stackQueries}
      ${roleQueries}
      ${coworkerQueries}
      ${projectQueries}
    }
    type Mutation {
      ${authMutations}
      ${accountMutations}
      ${categoryMutations}
      ${stackMutations}
      ${roleMutations}
      ${coworkerMutations}
      ${projectMutations}
    }
  `);
}

export function getRoot() {
  return {
    ...authResolver,
    ...accountResolver,
    ...categoryResolver,
    ...stackResolver,
    ...roleResolver,
    ...coworkerResolver,
    ...projectResolver,
  };
}
