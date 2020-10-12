<template>
	<v-list large :multiple="false" v-model="selection" :mandatory="false">
		<navigation-item v-for="item in navSections" :key="item.name" :section="item" />
	</v-list>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, watch, ref } from '@vue/composition-api';
import NavigationItem from './navigation-item.vue';
import { nav } from '@directus/docs';

function spreadPath(path: string) {
	const sections = path.substr(1).split('/');
	if (sections.length === 0) return [];

	const paths: string[] = ['/' + sections[0]];

	for (let i = 1; i < sections.length; i++) {
		paths.push(paths[i - 1] + '/' + sections[i]);
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
		const _selection = ref<string[] | null>(null);

		watch(
			() => props.path,
			(newPath) => {
				if (newPath === null) return;
				_selection.value = spreadPath(newPath.replace('/docs', ''));
			}
		);

		const selection = computed({
			get() {
				if (_selection.value === null && props.path !== null)
					_selection.value = spreadPath(props.path.replace('/docs', ''));
				return _selection.value || [];
			},
			set(newSelection: string[]) {
				if (newSelection.length === 0) {
					_selection.value = [];
				} else {
					if (_selection.value && _selection.value.includes(newSelection[0])) {
						_selection.value = _selection.value.filter((s) => s !== newSelection[0]);
					} else {
						_selection.value = spreadPath(newSelection[0]);
					}
				}
			},
		});

		return { navSections: nav.app, selection };
	},
});
</script>
