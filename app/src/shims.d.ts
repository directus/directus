declare module '*.vue' {
	import { DefineComponent } from 'vue';
	// eslint-disable-next-line @typescript-eslint/ban-types
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

declare module '*.md' {
	import { DefineComponent } from 'vue';
	// eslint-disable-next-line @typescript-eslint/ban-types
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

declare module '*.yaml' {
	const value: Record<string, any>;
	export default value;
}

declare module '*.json' {
	const value: Record<string, any>;
	export default value;
}

declare module 'jsonlint-mod' {
	const x: any;
	export default x;
}

declare module 'frappe-charts/src/js/charts/AxisChart' {
	export class Chart {
		constructor(element: string, options: Record<string, any>);
	}
}

declare module '@directus-extensions' {}

declare module '@editorjs/image';
declare module '@editorjs/attaches';
declare module '@editorjs/paragraph';
declare module '@editorjs/quote';
declare module '@editorjs/checklist';
declare module '@editorjs/delimiter';
declare module '@editorjs/table';
declare module '@editorjs/code';
declare module '@editorjs/header';
declare module '@editorjs/underline';
declare module '@editorjs/embed';
declare module '@editorjs/raw';
declare module '@editorjs/inline-code';
declare module '@editorjs/nested-list';
declare module 'editorjs-text-alignment-blocktune';
declare module 'editorjs-toggle-block';
