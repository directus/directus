export interface Schema {
	articles: Articles[];
	articles_blocks: ArticlesBlocks[];
	articles_tags: ArticlesTags[];
	date_blocks: DateBlocks[];
	links: Links[];
	tags: Tags[];
	text_blocks: TextBlocks[];
	users: Users[];
	a: any;
	b: any;
}
export type Articles = {
	id: string | number;
	title: string | number;
	author: Users;
	tags: ArticlesTags[];
	links: Links[];
	blocks: ArticlesBlocks[];
};
export type ArticlesBlocks = {
	id: string | number;
	articles_id: Articles;
	item: DateBlocks | TextBlocks;
	collection: string | number;
};
export type ArticlesTags = {
	id: string | number;
	articles_id: Articles;
	tags_id: Tags;
};
export type DateBlocks = {
	id: string | number;
	date: string | number;
};
export type Links = {
	id: string | number;
	article_id: Articles;
	link: string | number;
};
export type Tags = {
	id: string | number;
	tag: string | number;
};
export type TextBlocks = {
	id: string | number;
	text: string | number;
};
export type Users = {
	id: string | number;
	name: string | number;
};
