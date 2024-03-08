interface Author {
	first_name: string;
	last_name: string;
	avatar: string;
	title: string;
}

interface Contributor {
	name: string;
}

export interface DeveloperArticle {
	title: string;
	date_published: string;
	slug: string;
	image: string;
	status: string;
	summary: string;
	content: string;
	author: Author;
	contributors: Contributor[];
	tags: DocsTagJunction[];
}

interface DocsTagJunction {
	docs_tags_id: DocsTag;
}

interface DeveloperArticleJunction {
	developer_articles_id: DeveloperArticle;
}

export interface DocsTag {
	id: string;
	title: string;
	slug: string;
	type: string;
	developer_articles: DeveloperArticleJunction[];
}

export interface Schema {
	developer_articles: DeveloperArticle[];
	docs_tags: DocsTag[];
	dplus_docs_sections: DplusDocsSection[];
	dplus_docs_articles: DplusDocsArticle[];
}

export interface DplusDocsArticle {
	title: string;
	slug: string;
	status: string;
	summary: string;
	content: string;
	section?: string | DplusDocsSection;
}

export interface DplusDocsSection {
	title: string;
	slug: string;
	articles: DplusDocsArticle[];
}
