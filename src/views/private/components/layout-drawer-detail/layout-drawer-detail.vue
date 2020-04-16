<template>
	<drawer-detail :icon="currentLayout.icon" :title="$t('view_type')">
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
		let currentLayout = layouts.find((layout) => layout.id === props.value);

		// If for whatever reason the current layout doesn't exist, force reset it to tabular
		if (currentLayout === undefined) {
			currentLayout = layouts.find((layout) => layout.id === 'tabular');
			emit('input', 'tabular');
		}

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
