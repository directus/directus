<template>
	<v-list v-model="selection" nav :mandatory="false" scope="docs-navigation">
		<navigation-item v-for="item in navSections" :key="item.name" :section="item" />
	</v-list>
</template>

<script lang="ts">
import { defineComponent, watch, ref } from 'vue';
import NavigationItem from './navigation-item.vue';
import navLinks from './links.yaml';

function spreadPath(path: string) {
	const sections = path.slice(1).split('/');
	if (sections.length === 0) return [];

	const paths: string[] = ['/' + sections[0]];

	for (let i = 1; i < sections.length; i++) {
		paths.push(paths[i - 1] + '/' + sections[i]);
	}

	if (paths[0] === '/reference' && paths[1] === '/reference/api') {
		paths.shift();
	}

	return paths;
}

export default defineComponent({
	components: { NavigationItem },
	props: {
		path: {
			type: String,
			default: '/docs',
		},
	},
	setup(props) {
		const selection = ref<string[] | null>(null);

		watch(
			() => props.path,
			(newPath) => {
				if (newPath === null) return;
				selection.value = [...(selection.value || []), ...spreadPath(newPath.replace('/docs', ''))];
			},
			{ immediate: true }
		);

		return { navSections: navLinks, selection };
	},
});
</script>
