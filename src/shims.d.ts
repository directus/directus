declare module '*.vue' {
	import Vue from 'vue';
	export default Vue;
}

declare module '*.svg' {
	import Vue from 'vue';
	export default Vue;
}

declare module '*.md' {
	const value: string;
	export default value;
}

declare module '*.json' {
	const value: { [key: string]: any };
	export default value;
}

declare module 'vuedraggable' {
	import Vue from 'vue';
	export default Vue;
}

declare module 'jsonlint-mod' {
	const x: any;
	export default x;
}

declare module 'jshint' {
	const x: any;
	export default x;
}

declare module 'csslint' {
	const x: any;
	export default x;
}

declare module 'js-yaml' {
	const x: any;
	export default x;
}
