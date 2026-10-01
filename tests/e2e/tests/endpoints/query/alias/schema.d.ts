export interface Schema {
	articles: Articles[];
	date_blocks: DateBlocks[];
	text_blocks: TextBlocks[];
	tags: Tags[];
	users: Users[];
	links: Links[];
	articles_tags_junction: ArticlesTagsJunction[];
	articles_builder: ArticlesBuilder[];
}

export interface Articles {
	id: number;
	title: string | null;
	author: number | Users | null;
	tags: number[] | ArticlesTagsJunction[];
	links: number[] | Links[];
	blocks: number[] | ArticlesBuilder[];
}

export interface DateBlocks {
	id: number;
	date: string | null;
}

export interface TextBlocks {
	id: number;
	text: string | null;
	author: number | Users | null;
}

export interface Tags {
	id: number;
	tag: string | null;
}

export interface Users {
	id: number;
	name: string | null;
}

export interface Links {
	id: number;
	link: string | null;
	article_id: number | Articles | null;
}

export interface ArticlesTagsJunction {
	id: number;
	articles_id: number | Articles | null;
	tags_id: number | Tags | null;
}

export interface ArticlesBuilder {
	id: number;
	articles_id: number | Articles | null;
	item: string | DateBlocks | TextBlocks | null;
	collection: string | null;
}
