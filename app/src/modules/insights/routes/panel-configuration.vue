<template>
	<v-drawer active :title="(panel && panel.name) || $t('panel')" @cancel="$emit('cancel')">
		<template #actions>
			<v-button :disabled="!edits.type" @click="emitSave" icon rounded v-tooltip.bottom="$t('done')">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<p class="type-label panel-type-label">{{ $t('type') }}</p>

			<v-fancy-select class="select" :items="selectItems" v-model="edits.type" />

			<template v-if="edits.type && selectedPanel">
				<v-notice v-if="!selectedPanel.options || selectedPanel.options.length === 0">
					{{ $t('no_options_available') }}
				</v-notice>

				<v-form
					v-else-if="Array.isArray(selectedPanel.options)"
					:fields="selectedPanel.options"
					primary-key="+"
					v-model="edits.options"
				/>

				<component v-model="edits.options" :collection="collection" :is="`panel-options-${selectedPanel.id}`" v-else />
			</template>

			<v-divider />

			<div class="form-grid">
				<div class="field half-left">
					<p class="type-label">{{ $t('show_header') }}</p>
					<v-checkbox block v-model="edits.show_header" :label="$t('enabled')" />
				</div>

				<div class="field half-right">
					<p class="type-label">{{ $t('name') }}</p>
					<v-input v-model="edits.name" :disabled="edits.show_header !== true" />
				</div>

				<div class="field half-left">
					<p class="type-label">{{ $t('icon') }}</p>
					<interface-select-icon v-model="edits.icon" :disabled="edits.show_header !== true" />
				</div>

				<div class="field half-right">
					<p class="type-label">{{ $t('color') }}</p>
					<interface-select-color v-model="edits.color" :disabled="edits.show_header !== true" width="half" />
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, watch, PropType } from '@vue/composition-api';
import { getPanels } from '@/panels';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { Panel } from '@/types';

export default defineComponent({
	name: 'PanelConfiguration',
	props: {
		panel: {
			type: Object as PropType<Partial<Panel>>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const { panels } = getPanels();

		const edits = reactive<Partial<Panel>>({
			show_header: false,
			type: undefined,
			name: undefined,
			icon: undefined,
			color: undefined,
			width: undefined,
			height: undefined,
			position_x: 1,
			position_y: 1,
			...(props.panel || {}),
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
			return panels.value.find((panel) => panel.id === edits.type);
		});

		watch(selectedPanel, (newPanel) => {
			if (newPanel) {
				edits.width = newPanel.minWidth;
				edits.height = newPanel.minHeight;
			} else {
				edits.width = undefined;
				edits.height = undefined;
			}
		});

		return {
			selectItems,
			selectedPanel,
			close,
			emitSave,
			edits,
		};

		function emitSave() {
			emit('save', edits);
		}
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
