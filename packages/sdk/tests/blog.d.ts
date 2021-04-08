import { ID } from '../src/types';

export type Post = {
	id: ID;
	title: string;
	body: string;
	published: boolean;
};

export type Category = {
	slug: string;
	name: string;
};

export type Blog = {
	posts: Post;
	categories: Category;
};
