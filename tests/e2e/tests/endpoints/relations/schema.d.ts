export interface Schema {
	articles: Articles[];
	authors: Authors[];
	editors: Editors[];
}
export type Articles = {
	id: string | number;
	title: string | number;
	author: Authors;
	editor: Editors;
};
export type Authors = {
	id: string | number;
	name: string | number;
};
export type Editors = {
	id: string | number;
	name: string | number;
};
