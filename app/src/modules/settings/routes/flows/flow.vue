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

		<div class="container">
			<v-progress-circular v-if="loading" class="loading" indeterminate />

			<div v-else class="grid">
				<operation-block />
			</div>
		</div>

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
import OperationBlock from './components/operation-block.vue';
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
	padding: var(--content-padding);
}
</style>
