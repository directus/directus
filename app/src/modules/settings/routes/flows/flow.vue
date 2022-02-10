<template>
	<settings-not-found v-if="!currentFlow && !loading" />
	<private-view v-else :title="currentFlow?.name ?? t('loading')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon :name="currentFlow?.icon ?? 'account_tree'" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('flows'), to: '/flows' }]" />
		</template>

		<template #actions></template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_flows_item')" class="page-description" />
			</sidebar-detail>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<!-- @edit="editPanel"
				@update="stagePanelEdits"
				@move="movePanelID = $event"
				@delete="deletePanel"
				@duplicate="duplicatePanel" -->
		<div class="container">
			<v-progress-circular v-if="loading" class="loading" indeterminate />
			<v-workspace v-else :panels="panels" :edit-mode="true">
				<template>
					<step-block type="trigger" />
					<!-- 					<component
						:is="`panel-${props.panel.type}`"
						v-bind="props.panel.options"
						:id="props.panel.id"
						:show-header="props.panel.show_header"
						:height="props.panel.height"
						:width="props.panel.width"
						:now="now"
					/> -->
				</template>
			</v-workspace>
		</div>

		<!-- 		<div v-else class="grid" style="min-width: 3000px; min-height: 3000px">
				<step-block type="trigger" />
				<step-block type="operation" style="grid-column: 1" />
				<step-block type="operation" style="grid-column: 1" />
				<step-block type="error" style="grid-column: 2" />
				<step-block type="operation" style="grid-column: 1" />
			</div>
 -->

		<!-- <v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog> -->
	</private-view>
</template>

<script lang="ts" setup>
import { FlowRaw } from '@directus/shared/types';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { unexpectedError } from '@/utils/unexpected-error';
import api from '@/api';

import SettingsNotFound from '../not-found.vue';
import StepBlock from './components/step-block.vue';
import SettingsNavigation from '../../components/navigation.vue';

const props = defineProps({
	primaryKey: {
		type: String,
		required: true,
	},
});

const currentFlow = ref<FlowRaw>();
const loading = ref(true);
const { t } = useI18n();

const panels = [
	{
		position_x: 2,
		position_y: 2,
		height: 10,
		width: 10,
		show_header: true,
		icon: 'place',
		color: 'red',
		id: '1',
		borderRadius: [30, 30, 30, 30],
	},
	{
		position_x: 2,
		position_y: 20,
		height: 10,
		width: 10,
		show_header: true,
		icon: 'map',
		color: 'blue',
		id: '1',
		borderRadius: [30, 30, 30, 30],
	},
];

fetchFlow();

async function fetchFlow() {
	try {
		const response = await api.get(`/flows/${props.primaryKey}`, {
			params: {
				fields: '*.*',
			},
		});

		currentFlow.value = response.data.data;
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		loading.value = false;
	}
}
</script>

<style scoped>
.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.container {
	--column-size: 200px;
	--row-size: 100px;
	--gap-size: 40px;

	padding: var(--content-padding);
}

.grid {
	display: grid;
	grid-template-rows: repeat(auto-fit, var(--row-size));
	grid-template-columns: repeat(auto-fit, var(--column-size));
	gap: var(--gap-size);
	min-width: calc(var(--column-size) * 2);
	min-height: calc(var(--row-size) * 2);
}
</style>
