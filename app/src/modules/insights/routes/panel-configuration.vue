<template>
	<v-drawer active :title="values.name || $t('panel')">
		<div class="content">
			<p class="type-label panel-type-label">{{ $t('type') }}</p>

			<v-fancy-select class="select" :items="selectItems" v-model="values.type" />

			<template v-if="values.type && selectedPanel">
				<v-notice v-if="!selectedPanel.options || selectedPanel.options.length === 0">
					{{ $t('no_options_available') }}
				</v-notice>

				<v-form
					v-else-if="Array.isArray(selectedPanel.options)"
					:fields="selectedPanel.options"
					primary-key="+"
					v-model="values.options"
				/>

				<component v-model="values.options" :collection="collection" :is="`panel-options-${selectedPanel.id}`" v-else />
			</template>

			<v-divider />

			<div class="form-grid">
				<div class="field half-left">
					<p class="type-label">{{ $t('show_header') }}</p>
					<v-checkbox block v-model="values.show_header" :label="$t('enabled')" />
				</div>

				<div class="field half-right">
					<p class="type-label">{{ $t('name') }}</p>
					<v-input v-model="values.name" :disabled="values.show_header !== true" />
				</div>

				<div class="field half-left">
					<p class="type-label">{{ $t('icon') }}</p>
					<interface-select-icon v-model="values.icon" :disabled="values.show_header !== true" />
				</div>

				<div class="field half-right">
					<p class="type-label">{{ $t('color') }}</p>
					<interface-select-color v-model="values.color" :disabled="values.show_header !== true" width="half" />
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useInsightsStore } from '@/stores';
import { getPanels } from '@/panels';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { Panel } from '@/types';

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

		const edits = ref<Partial<Panel>>({});

		const values = computed<Partial<Panel>>(() => {
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

		const selectedPanel = computed(() => {
			return panels.value.find((panel) => panel.id === values.value.type);
		});

		return { existing, values, selectItems, selectedPanel };
	},
});
</script>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

.panel-type-label {
	margin-bottom: 16px;
}

.v-divider {
	margin: 48px 0;
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
