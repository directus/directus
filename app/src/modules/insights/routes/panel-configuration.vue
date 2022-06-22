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

			<v-fancy-select v-model="panel.type" class="select" :items="selectItems" />

			<extension-options
				v-if="panel.type"
				v-model="panel.options"
				:options="customOptionsFields"
				type="panel"
				:extension="panel.type"
			/>

			<v-divider :inline-title="false" large>
				<template #icon><v-icon name="info" /></template>
				<template #default>{{ t('panel_header') }}</template>
			</v-divider>

			<div class="form-grid">
				<div class="field half-left">
					<p class="type-label">{{ t('visible') }}</p>
					<v-checkbox v-model="panel.show_header" block :label="t('show_header')" />
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('name') }}</p>
					<v-input
						v-model="panel.name"
						:nullable="false"
						:disabled="panel.show_header !== true"
						:placeholder="t('panel_name_placeholder')"
					/>
				</div>

				<div class="field half-left">
					<p class="type-label">{{ t('icon') }}</p>
					<interface-select-icon
						:value="panel.icon"
						:disabled="panel.show_header !== true"
						@input="panel.icon = $event"
					/>
				</div>

				<div class="field half-right">
					<p class="type-label">{{ t('color') }}</p>
					<interface-select-color
						:value="panel.color"
						:disabled="panel.show_header !== true"
						width="half"
						@input="panel.color = $event"
					/>
				</div>

				<div class="field full">
					<p class="type-label">{{ t('note') }}</p>
					<v-input
						v-model="panel.note"
						:disabled="panel.show_header !== true"
						:placeholder="t('panel_note_placeholder')"
					/>
				</div>
			</div>
		</div>
	</v-drawer>
</template>

<script lang="ts" setup>
import { FancySelectItem } from '@/components/v-fancy-select/types';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { getPanel, getPanels } from '@/panels';
import { useInsightsStore } from '@/stores';
import { CreatePanel } from '@/stores/insights';
import { Panel } from '@directus/shared/types';
import { assign, clone } from 'lodash';
import { nanoid } from 'nanoid';
import { storeToRefs } from 'pinia';
import { computed, ref, unref } from 'vue';
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

const edits = ref<Partial<Panel>>({});

const insightsStore = useInsightsStore();

const { panels } = storeToRefs(insightsStore);
const { panels: panelTypes } = getPanels();

const router = useRouter();

const panel = computed<Partial<Panel>>({
	get() {
		if (props.panelKey === '+') return unref(edits);
		const existing: Partial<Panel> = unref(panels).find((panel) => panel.id === props.panelKey) ?? {};
		return assign({}, existing, unref(edits));
	},
	set(updatedEdits) {
		edits.value = updatedEdits;
	},
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

const currentTypeInfo = computed(() => {
	return unref(panel).type ? getPanel(unref(panel).type) : null;
});

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
