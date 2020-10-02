<template>
	<v-list nav :multiple="false" v-model="selection">
		<navigation-item v-for="item in sections" :key="item.to" :section="item"></navigation-item>
	</v-list>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from '@vue/composition-api';
import { spread } from 'lodash';
import NavigationItem from './navigation-item.vue';
import sections, {Section} from './sections';

export default defineComponent({
	components: { NavigationItem },
	props: {
		section: {
			type: Object as PropType<Section>,
			default: null,
		},
	},
	setup(props) {
		const _selection = ref<string[]>(spreadPath(props.section.to))

		watch(props.section, (newSection) => {
			if(newSection !== null)
				_selection.value = spreadPath(newSection.to)
		})

		const selection = computed({
			get() {
				return _selection.value
			},
			set(newSelection: string[]) {
				if(newSelection.length === 0) {
					_selection.value =  []
				} else {
					if(_selection.value.includes(newSelection[0])) {
						_selection.value = _selection.value.filter(s => s !== newSelection[0])
					} else {
						_selection.value = spreadPath(newSelection[0])
					}
					
				}
			}
		})

		function spreadPath(path: string) {
			const sections = path.substr(1).split('/')
			if(sections.length === 0) return []

			const paths: string[] = ['/'+sections[0]]

			for(let i = 1; i < sections.length; i++) {
				paths.push(paths[i - 1] + '/' + sections[i])
			}
			return paths
		}

		return { sections, selection };
	},
});
</script>
