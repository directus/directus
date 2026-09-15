export interface Schema {
	articles: Articles[];
	authors: Authors[];
}
export type Articles = {
	id: string | number;
	title: string | number;
	author: Authors;
	editor: Authors;
};
export type Authors = {
	id: string | number;
	name: string | number;
};
