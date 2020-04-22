<template>
	<drawer-detail :icon="currentLayout.icon" :title="$t('layout_type')">
		<v-select :items="layouts" item-text="name" item-value="id" v-model="viewType" full-width />
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import layouts from '@/layouts';

export default defineComponent({
	props: {
		value: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const currentLayout = computed(() => {
			const layout = layouts.find((layout) => layout.id === props.value);

			if (layout === undefined) {
				return layouts.find((layout) => layout.id === 'tabular');
			}

			return layout;
		});

		const viewType = computed({
			get() {
				return props.value;
			},
			set(newType: string) {
				emit('input', newType);
			},
		});

		return { currentLayout, layouts, viewType };
	},
});
</script>
