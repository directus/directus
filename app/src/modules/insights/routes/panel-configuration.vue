<template>
	<v-drawer
		:model-value="isOpen"
		:title="panel?.name || t('panel')"
		:subtitle="t('panel_options')"
		:icon="panel?.icon || 'insert_chart'"
		persistent
		@cancel="$emit('cancel')"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('done')" :disabled="!edits.type" icon rounded @click="emitSave">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<p class="type-label panel-type-label">{{ t('type') }}</p>

			<v-fancy-select v-model="edits.type" class="select" :items="selectItems" />

			<template v-if="edits.type && selectedPanel">
				<v-notice v-if="!selectedPanel.options || selectedPanel.options.length === 0 || edits.options === {}">
					{{ t('no_options_available') }}
				</v-notice>

				<extension-options
					v-else-if="edits.options"
					:options="selectedPanel.options"
					@field-values="setOptionsValues"
				/>

				<component :is="`panel-options-${selectedPanel.id}`" v-else v-model="edits.options" :collection="collection" />
			</template>

			<v-divider :inline-title="false" large>
				<template #icon><v-icon name="info" /></template>
				<template #default>{{ t('panel_header') }}</template>
			</v-divider>

			<div class="form-grid">
				<div class="field half-left">
					<p class="type-label">{{ t('visible') }}</p>
					<v-checkbox v-model="edits.show_header" block :label="t('show_header')" />
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('name') }}</p>
					<v-input
						v-model="edits.name"
						:nullable="false"
						:disabled="edits.show_header !== true"
						:placeholder="t('panel_name_placeholder')"
					/>
				</div>

				<div class="field half-left">
					<p class="type-label">{{ t('icon') }}</p>
					<interface-select-icon
						:value="edits.icon"
						:disabled="edits.show_header !== true"
						@input="edits.icon = $event"
					/>
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('color') }}</p>
					<interface-select-color
						:value="edits.color"
						:disabled="edits.show_header !== true"
						width="half"
						@input="edits.color = $event"
					/>
				</div>

				<div class="field full">
					<p class="type-label">{{ t('note') }}</p>
					<v-input
						v-model="edits.note"
						:disabled="edits.show_header !== true"
						:placeholder="t('panel_note_placeholder')"
					/>
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<script lang="ts">
import ExtensionOptions from '../../settings/routes/data-model/field-detail/shared/extension-options.vue';
import { computed, defineComponent, reactive, watch, PropType } from 'vue';
import { getPanels } from '@/panels';
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { Panel } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { useDialogRoute } from '@/composables/use-dialog-route';

export default defineComponent({
	name: 'PanelConfiguration',
	components: { ExtensionOptions },
	props: {
		panel: {
			type: Object as PropType<Partial<Panel>>,
			default: null,
		},
	},
	emits: ['cancel', 'save'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const { panels } = getPanels();

		const isOpen = useDialogRoute();

		const edits = reactive<Partial<Panel>>({
			show_header: props.panel?.show_header ?? true,
			type: props.panel?.type || undefined,
			name: props.panel?.name,
			note: props.panel?.note,
			icon: props.panel?.icon ?? 'insert_chart',
			color: props.panel?.color ?? '#00C897',
			width: props.panel?.width ?? undefined,
			height: props.panel?.height ?? undefined,
			position_x: props.panel?.position_x ?? 1,
			position_y: props.panel?.position_y ?? 1,
			options: {},
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

			// Allows panels to manipulate the returned fields
			// instead of only allowing .options to be a function make a new optional arg
			// on PanelConFig and index.ts
			// This should probably go in a watch on edits? Because right now it only runs when selectedPanel changes
			// if (newPanel && newPanel.alterOptions) {
			// 	edits.options = newPanel?.alterOptions(edits);
			// } else {
			// 	edits.options = props.panel.options ?? {};
			// }
		});

		return {
			selectItems,
			selectedPanel,
			close,
			emitSave,
			edits,
			t,
			isOpen,
			setOptionsValues,
		};

		function emitSave() {
			emit('save', edits);
		}

		function setOptionsValues(newValues: any) {
			edits.options = newValues;
		}
	},
});
</script>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}

.select {
	margin-bottom: 32px;
}

.panel-type-label {
	margin-bottom: 16px;
}

.v-divider {
	margin: 68px 0 48px;
}
</style>
