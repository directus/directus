export type Schema = {
	articles: Articles[];
	articles_tags: ArticlesTags[];
	links: Links[];
	tags: Tags[];
	users: Users[];
};
export type Articles = {
	id?: string | number;
	author?: string | number | Users;
	tags: (string | number | ArticlesTags)[];
	links: (string | number | Links)[];
	metadata?: string | number;
	data?: string | number;
	name?: string | number;
};
export type ArticlesTags = {
	id?: string | number;
	articles_id?: string | number | Articles;
	tags_id?: string | number | Tags;
};
export type Links = {
	id?: string | number;
	article_id?: string | number | Articles;
	metadata?: string | number;
};
export type Tags = {
	id?: string | number;
	metadata?: string | number;
};
export type Users = {
	id?: string | number;
	metadata?: string | number;
};
