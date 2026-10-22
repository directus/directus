export interface Schema {
	authors: Authors[];
	editors: Editors[];
	articles: Articles[];
}

export interface Authors {
	id: number;
	name: string | null;
}

export interface Editors {
	id: number;
	name: string | null;
}

export interface Articles {
	id: number;
	title: string | null;
	author: number | Authors | null;
	editor: number | Editors | null;
}
