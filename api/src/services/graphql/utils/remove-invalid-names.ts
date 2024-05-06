import type { SchemaOverview } from "@directus/types";
import { useLogger } from "../../../logger.js";

/**
 * Regex was taken from the spec
 * https://spec.graphql.org/June2018/#sec-Names
 */
const GRAPHQL_NAME_REGEX = /^[_A-Za-z][_0-9A-Za-z]*/;

/**
 * Filters out invalid collections to prevent graphql from errorring on schema generation
 *
 * @param schema
 * @returns
 */
export function removeInvalidNames(schema: SchemaOverview) {
	const logger = useLogger();

	const collections = Object.entries(schema.collections)
		.filter(([collectionName, _data]) => {
			const valid = !collectionName.startsWith('__')
				&& collectionName.match(GRAPHQL_NAME_REGEX);

			if (!valid) {
				logger.warn(`Ignored collection "${collectionName}" because it is not a valid name for GraphQL /^[_A-Za-z][_0-9A-Za-z]*/`)
			}

			return valid;
		})

	schema.collections = Object.fromEntries(collections);

	return schema;
}
