<template>
	<v-drawer
		:model-value="isOpen"
		:title="panel?.name || t('panel')"
		:subtitle="t('panel_options')"
		:icon="panel?.icon || 'insert_chart'"
		persistent
		@cancel="router.push(`/insights/${dashboardKey}`)"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('done')" :disabled="!panel.type" icon rounded @click="stageChanges">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<p class="type-label panel-type-label">{{ t('type') }}</p>

			<v-fancy-select
				:model-value="panel.type"
				class="select"
				:items="selectItems"
				@update:model-value="edits.type = $event"
			/>

			<extension-options
				v-if="panel.type"
				:model-value="panel.options"
				:options="customOptionsFields"
				type="panel"
				:extension="panel.type"
				raw-editor-enabled
				@update:model-value="edits.options = $event"
			/>

			<v-divider :inline-title="false" large>
				<template #icon><v-icon name="info" /></template>
				<template #default>{{ t('panel_header') }}</template>
			</v-divider>

			<div class="form-grid">
				<div class="field half-left">
					<p class="type-label">{{ t('visible') }}</p>
					<v-checkbox
						:model-value="panel.show_header"
						block
						:label="t('show_header')"
						@update:model-value="edits.show_header = $event"
					/>
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('name') }}</p>
					<v-input
						:model-value="panel.name"
						:nullable="false"
						:disabled="panel.show_header !== true"
						:placeholder="t('panel_name_placeholder')"
						@update:model-value="edits.name = $event"
					/>
				</div>

				<div class="field half-left">
					<p class="type-label">{{ t('icon') }}</p>
					<interface-select-icon
						:value="panel.icon"
						:disabled="panel.show_header !== true"
						@input="edits.icon = $event"
					/>
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('color') }}</p>
					<interface-select-color
						:value="panel.color"
						:disabled="panel.show_header !== true"
						width="half"
						@input="edits.color = $event"
					/>
				</div>

				<div class="field full">
					<p class="type-label">{{ t('note') }}</p>
					<v-input
						:model-value="panel.note"
						:disabled="panel.show_header !== true"
						:placeholder="t('panel_note_placeholder')"
						@update:model-value="edits.note = $event"
					/>
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<script setup lang="ts">
import { useDialogRoute } from '@/composables/use-dialog-route';
import { useExtension } from '@/composables/use-extension';
import { useExtensions } from '@/extensions';
import { useInsightsStore } from '@/stores/insights';
import { CreatePanel } from '@/stores/insights';
import { Panel } from '@directus/types';
import { assign, clone, omitBy, isUndefined } from 'lodash';
import { nanoid } from 'nanoid/non-secure';
import { storeToRefs } from 'pinia';
import { computed, reactive, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ExtensionOptions from '../../settings/routes/data-model/field-detail/shared/extension-options.vue';

interface Props {
	dashboardKey: string;
	panelKey: string;
}

const props = defineProps<Props>();

const { t } = useI18n();

const isOpen = useDialogRoute();

const edits = reactive<Partial<Panel>>({
	show_header: undefined,
	type: undefined,
	name: undefined,
	note: undefined,
	icon: undefined,
	color: undefined,
	width: undefined,
	height: undefined,
	position_x: undefined,
	position_y: undefined,
	options: undefined,
});

const insightsStore = useInsightsStore();

const { panels } = storeToRefs(insightsStore);
const { panels: panelTypes } = useExtensions();

const router = useRouter();

const panel = computed<Partial<Panel>>(() => {
	if (props.panelKey === '+') return edits;
	const existing: Partial<Panel> = unref(panels).find((panel) => panel.id === props.panelKey) ?? {};
	return assign({}, existing, omitBy(edits, isUndefined));
});

const selectItems = computed<FancySelectItem[]>(() => {
	return panelTypes.value.map((panelType) => {
		const item: FancySelectItem = {
			text: panelType.name,
			icon: panelType.icon,
			description: panelType.description,
			value: panelType.id,
		};

		return item;
	});
});

const currentTypeInfo = useExtension(
	'panel',
	computed(() => panel.value.type ?? null)
);

const customOptionsFields = computed(() => {
	if (typeof currentTypeInfo.value?.options === 'function') {
		return currentTypeInfo.value?.options(unref(panel)) ?? null;
	}

	return null;
});

const stageChanges = () => {
	if (props.panelKey === '+') {
		const createPanel = clone(unref(panel));

		createPanel.id = `_${nanoid()}`;
		createPanel.dashboard = props.dashboardKey;
		createPanel.width ??= unref(currentTypeInfo)?.minWidth ?? 4;
		createPanel.height ??= unref(currentTypeInfo)?.minHeight ?? 4;
		createPanel.position_x ??= 1;
		createPanel.position_y ??= 1;
		createPanel.options ??= {};

		insightsStore.stagePanelCreate(unref(createPanel as CreatePanel));
		router.push(`/insights/${props.dashboardKey}`);
	} else {
		insightsStore.stagePanelUpdate({ id: props.panelKey, edits: unref(panel) });
		router.push(`/insights/${props.dashboardKey}`);
	}
};
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
