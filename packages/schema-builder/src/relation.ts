import { Relation, RelationMeta } from "@directus/types";
import { ForeignKey } from "../../schema/dist";

export class RelationBuilder {
	_collection: string;
	_field: string;
	_related_collection: string | null;
	_schema: ForeignKey | null;
	_meta: RelationMeta | null;

	build(): Relation {
		return {

		} as any
	}
}
