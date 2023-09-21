import type { Collection, Field, Relation } from '@directus/types';

export interface CliOptions {
	host: string;
	accessToken: string;
	file: string;
	naming: 'database' | 'camelcase' | 'pascalcase';
}

export interface DataModel {
	collections: Collection[];
	fields: Field[];
	relations: Relation[];
}

export type SchemaDefinition = Map<string, CollectionDefinition>;

export interface CollectionDefinition {
	name: string;
	system: boolean;
	singleton: boolean;
	fields: FieldDefinition[];
}

export interface FieldDefinition {
	name: string;
	type: string;
	nullable: boolean;
	primary_key: boolean;
	relation: RelationDefinition | null;
}

export interface RelationDefinition {
	collection: string;
	mutliple: boolean;
}

export type NameTransformer = (str: string) => string;
