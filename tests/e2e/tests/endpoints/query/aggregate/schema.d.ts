export type Schema = {
	articles: Articles[];
	articles_blocks: ArticlesBlocks[];
	articles_tags: ArticlesTags[];
	date_blocks: DateBlocks[];
	links: Links[];
	tags: Tags[];
	text_blocks: TextBlocks[];
	users: Users[];
};
export type Articles = {
	id: string | number;
	title: string | number;
	author: string | number | Users;
	tags: (string | number | ArticlesTags)[];
	links: (string | number | Links)[];
	blocks: (string | number | ArticlesBlocks)[];
	votes: string | number;
	release: string | number;
};
export type ArticlesBlocks = {
	id: string | number;
	articles_id: string | number | Articles;
	item: string | number | DateBlocks | TextBlocks;
	collection: string | number;
};
export type ArticlesTags = {
	id: string | number;
	articles_id: string | number | Articles;
	tags_id: string | number | Tags;
};
export type DateBlocks = {
	id: string | number;
	date: string | number;
};
export type Links = {
	id: string | number;
	article_id: string | number | Articles;
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
