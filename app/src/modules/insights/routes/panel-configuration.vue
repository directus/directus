<template>
	<v-drawer active :title="values.name || $t('panel')">
		<div class="content">
			<v-fancy-select class="select" :items="selectItems" v-model="values.type" />
		</div>
	</v-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useInsightsStore } from '@/stores';
import { getPanels } from '@/panels';
import { FancySelectItem } from '@/components/v-fancy-select/types';

export default defineComponent({
	name: 'PanelConfiguration',
	props: {
		primaryKey: {
			type: String,
			default: '+',
		},
		dashboardKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { panels } = getPanels();

		const insightsStore = useInsightsStore();

		const existing = computed(() =>
			insightsStore.state.dashboards
				.find((dashboard) => dashboard.id === props.dashboardKey)!
				.panels.find((panel) => panel.id === props.primaryKey)
		);

		const edits = ref({});

		const values = computed(() => {
			if (existing.value) return { ...existing.value, ...edits.value };
			return edits.value;
		});

		const selectItems = computed<FancySelectItem[]>(() => {
			return panels.value.map((panel) => {
				const item: FancySelectItem = {
					text: panel.name,
					icon: panel.icon,
					description: panel.description,
					value: panel.id,
				};

				return item;
			});
		});

		return { existing, values, selectItems };
	},
});
</script>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>

<!--

type
options
--
toggle name
icon   color
note

-->
