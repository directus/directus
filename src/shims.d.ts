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

declare module 'vuedraggable' {
	import Vue from 'vue';
	export default Vue;
}

declare module 'jsonlint-mod' {
	export default any;
}

declare module 'jshint' {
	export default any;
}

declare module 'csslint' {
	export default any;
}

declare module 'js-yaml' {
	export default any;
}
