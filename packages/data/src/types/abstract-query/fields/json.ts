/**
 * A node to select specific attributes from a JSON field.
 *
 * @example
 * ```
 * const jsonField: AbstractQueryFieldNodeJson = {
 * 	type: 'json',
 * 	fieldName: 'Person',
 * 	path: {
 * 		name: 'name',
 * 		children: [
 * 			{
 * 				name: 'first',
 * 				children: []
 * 			},
 * 	}
 * 	alias: 'Person'
 * ```
 */
export interface AbstractQueryFieldNodeJson {
	type: 'json';
	fieldName: string;
	path: Attribute;
	alias: string;
}

export interface Attribute {
	name: string;
	children: Attribute[];
}
