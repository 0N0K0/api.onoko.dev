import { buildSchema } from "graphql";
import { authMutations, authTypes } from "./schemas/authSchema";
import {
  accountMutations,
  accountQueries,
  accountTypes,
} from "./schemas/accountSchema";
import {
  stackInputs,
  stackMutations,
  stackQueries,
  stackTypes,
} from "./schemas/stackSchema";
import {
  categoryInputs,
  categoryMutations,
  categoryQueries,
  categoryTypes,
} from "./schemas/categorySchema";
import {
  roleInputs,
  roleMutations,
  roleQueries,
  roleTypes,
} from "./schemas/roleSchema";
import {
  coworkerInputs,
  coworkerMutations,
  coworkerQueries,
  coworkerTypes,
} from "./schemas/coworkerSchema";
import {
  projectInputs,
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
import {
  mediaInputs,
  mediaMutations,
  mediaQueries,
  mediaTypes,
} from "./schemas/mediaSchema";
import mediaResolver from "./resolvers/mediaResolver";

/**
 * Construit le schéma GraphQL en combinant les types, requêtes et mutations de tous les modules.
 * @returns Le schéma GraphQL complet.
 */
export function getSchema() {
  return buildSchema(`
    scalar Upload
    ${authTypes}
    ${accountTypes}
    ${categoryTypes}
    ${categoryInputs}
    ${mediaTypes}
    ${mediaInputs}
    ${stackTypes}
    ${stackInputs}
    ${roleTypes}
    ${roleInputs}
    ${coworkerTypes}
    ${coworkerInputs}
    ${projectTypes}
    ${projectInputs}
    type Query {
      ${accountQueries}
      ${categoryQueries}
      ${stackQueries}
      ${roleQueries}
      ${coworkerQueries}
      ${projectQueries}
      ${mediaQueries}
    }
    type Mutation {
      ${authMutations}
      ${accountMutations}
      ${categoryMutations}
      ${stackMutations}
      ${roleMutations}
      ${coworkerMutations}
      ${projectMutations}
      ${mediaMutations}
    }
  `);
}

/**
 * Construit le resolver root en combinant les resolvers de tous les modules.
 * @returns Le resolver root complet.
 */
export function getRoot() {
  return {
    ...authResolver,
    ...accountResolver,
    ...categoryResolver,
    ...stackResolver,
    ...roleResolver,
    ...coworkerResolver,
    ...projectResolver,
    ...mediaResolver,
  };
}
