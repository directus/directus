<template>
	<v-list nav :multiple="false" v-model="rootSelection">
		<navigation-item v-for="item in sections" :key="item.to" :section="item" v-model="childSelection"></navigation-item>
	</v-list>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from '@vue/composition-api';
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
		const active = ref<string[]>(props.section.to.replace('/docs/','').split('/'))

		watch(props.section, (newSection) => {
			if(newSection !== null)
				active.value = newSection.to.replace('/docs/','').split('/')
		})

		const rootSelection = computed({
			get() {
				if(active.value.length === 0) return []
				return [active.value[0]]
			},
			set(newVal: string[]) {
				active.value = newVal
			}
		})

		const childSelection = computed({
			get() {
				if(active.value.length < 2) return []
				return active.value.slice(1)
			},
			set(newVal: string[]) {
				active.value = [active.value[0], ...newVal]
			}
		})

		return { sections, active, childSelection, rootSelection };
	},
});
</script>
