import { ID } from '../src/types';

export type Post = {
	id: ID;
	title: string;
	body: string;
	published: boolean;
};
