import { ID } from '../src/types';

export type Post = {
	id: ID;
	title: string;
	body: string;
	published: boolean;
	author: ID | Author;
};

export type Category = {
	slug: string;
	name: string;
};

export type Author = {
	id: ID;
	name: string;
	posts: (ID | Post)[];
};

export type Blog = {
	posts: Post;
	categories: Category;
	author: Author;
};
