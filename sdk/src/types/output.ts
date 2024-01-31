import type { FieldsWildcard, HasManyToAnyRelation, PickRelationalFields } from './fields.js';
import type { MappedFunctionFields } from './functions.js';
import type { ItemType } from './schema.js';
import type { IfAny, IsNullable, Merge, Mutable, UnpackList } from './utils.js';

/**
 * Apply the configured fields query parameter on a given Item type
 */
export type ApplyQueryFields<
	// input types
	Schema extends object,
	Collection extends object,
	ReadonlyFields,
	// calculated types
	CollectionItem extends object = UnpackList<Collection>,
	Fields = UnpackList<Mutable<ReadonlyFields>>,
	RelationalFields = PickRelationalFields<Fields>,
	RelationalKeys extends keyof RelationalFields = RelationalFields extends never ? never : keyof RelationalFields,
	FlatFields extends keyof CollectionItem = FieldsWildcard<CollectionItem, Exclude<Fields, RelationalKeys>>,
> = IfAny<
	Schema,
	Record<string, any>,
	Merge<
		MappedFunctionFields<Schema, CollectionItem> extends infer FF
			? MapFlatFields<CollectionItem, FlatFields, FF extends Record<string, string> ? FF : Record<string, string>>
			: never,
		RelationalFields extends never
			? never
			: {
					[Field in keyof RelationalFields]: Field extends keyof CollectionItem
						? Extract<CollectionItem[Field], ItemType<Schema>> extends infer RelatedCollection
							? RelationNullable<
									CollectionItem[Field],
									RelatedCollection extends any[]
										? HasManyToAnyRelation<RelatedCollection> extends never
											? ApplyNestedQueryFields<Schema, RelatedCollection, RelationalFields[Field]>[] | null // many-to-many or one-to-many
											: ApplyManyToAnyFields<Schema, RelatedCollection, RelationalFields[Field]>[] // many-to-any'
										: ApplyNestedQueryFields<Schema, RelatedCollection, RelationalFields[Field]> // many-to-one
							  >
							: never
						: never;
			  }
	>
>;

/**
 * Apply the configured fields query parameter on a many to any relation
 */
export type ApplyManyToAnyFields<
	// input types
	Schema extends object,
	JunctionCollection,
	FieldsList,
	// calculated types
	Junction = UnpackList<JunctionCollection>,
> = Junction extends object
	? PickRelationalFields<FieldsList> extends never
		? ApplyQueryFields<Schema, Junction, Readonly<UnpackList<FieldsList>>> // no relational fields
		: 'item' extends keyof PickRelationalFields<FieldsList> // do m2a magic
		  ? PickRelationalFields<FieldsList>['item'] extends infer ItemFields
				? Omit<ApplyQueryFields<Schema, Omit<Junction, 'item'>, Readonly<UnpackList<FieldsList>>>, 'item'> & {
						item: {
							[Scope in keyof ItemFields]: Scope extends keyof Schema
								? ApplyNestedQueryFields<Schema, Schema[Scope], ItemFields[Scope]>
								: never;
						}[keyof ItemFields];
				  }
				: never
		  : ApplyQueryFields<Schema, Junction, Readonly<UnpackList<FieldsList>>> // no items query
	: never;

/**
 * wrapper to aid in recursion
 */
export type ApplyNestedQueryFields<Schema extends object, Collection, Fields> = Collection extends object
	? ApplyQueryFields<Schema, Collection, Readonly<UnpackList<Fields>>>
	: never;

/**
 * Carry nullability of
 */
export type RelationNullable<Relation, Output> = IsNullable<Relation, Output | null, Output>;

/**
 * Map literal types to actual output types
 */
export type MapFlatFields<
	Item extends object,
	Fields extends keyof Item,
	FunctionMap extends Record<string, string>,
> = {
	[F in Fields as F extends keyof FunctionMap ? FunctionMap[F] : F]: F extends keyof FunctionMap
		? FunctionOutputType
		: Extract<Item[F], keyof FieldOutputMap> extends infer A
		  ? A[] extends never[]
				? Item[F]
				: A extends keyof FieldOutputMap
				  ? FieldOutputMap[A] | Exclude<Item[F], A>
				  : Item[F]
		  : Item[F];
};

// Possible JSON types
type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonPrimitive[] | { [key: string]: JsonValue };

/**
 * Output map for specific literal types
 */
export type FieldOutputMap = {
	json: JsonValue;
	csv: string[];
	datetime: string;
};

// all functions return a numeric type
type FunctionOutputType = number;
