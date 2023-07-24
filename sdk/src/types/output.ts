import type { FieldsWildcard, HasManyToAnyRelation, PickFlatFields, PickRelationalFields } from './fields.js';
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
	RelationalKeys = RelationalFields extends never ? never : keyof RelationalFields,
	FlatFields = FieldsWildcard<CollectionItem, Exclude<Fields, RelationalKeys>>
> = IfAny<
	Schema,
	Record<string, any>,
	Merge<
		PickFlatFields<Schema, CollectionItem, FlatFields>,
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
	Junction = UnpackList<JunctionCollection>
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
