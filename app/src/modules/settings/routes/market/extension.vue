<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact to="/settings/market">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('marketplace'), to: '/settings/market' }]" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #actions>
			<v-button v-if="extension === undefined" v-tooltip.bottom="'Install Extension'" rounded icon>
				<v-icon name="save_alt" @click="installDialog = true" />
			</v-button>
			<template v-else>
				<v-button v-tooltip.bottom="'Delete Extension'" danger rounded icon>
					<v-icon name="delete" @click="uninstallDialog = true" />
				</v-button>
				<v-button v-if="local === false" v-tooltip.bottom="'Update Extension'" secondary rounded icon>
					<v-icon name="update" @click="updateDialog = true" />
				</v-button>
				<v-button
					v-tooltip.bottom="extension.enabled ? 'Disable Extension' : 'Enable Extension'"
					:secondary="extension.enabled === false"
					rounded
					icon
				>
					<v-icon :name="extension.enabled ? 'check_box' : 'check_box_outline_blank'" @click="toggleExtension" />
				</v-button>
			</template>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_marketplace')" class="page-description" />
			</sidebar-detail>
		</template>

		<Extension
			:name="name"
			:existing-extension="extension"
			app
			:directus-version="serverStore.info.directus?.version"
			@select-version="version = $event"
		/>

		<v-dialog :model-value="installDialog">
			<v-card>
				<v-card-title>Install {{ title }}</v-card-title>
				<v-card-text>
					Are you sure that you want to install this extension? The extension has full access to your database and can
					do anything.
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="installDialog = false">Close</v-button>
					<v-button danger @click="install()">Install</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :model-value="updateDialog">
			<v-card>
				<v-card-title>Update {{ title }}</v-card-title>
				<v-card-text>Are you sure that you want to update this extension?</v-card-text>
				<v-card-actions>
					<v-button secondary @click="updateDialog = false">Close</v-button>
					<v-button @click="update()">Update</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-dialog :model-value="uninstallDialog">
			<v-card>
				<v-card-title>Uninstall {{ title }}</v-card-title>
				<v-card-text>Are you sure that you want to uninstall this extension?</v-card-text>
				<v-card-actions>
					<v-button secondary @click="uninstallDialog = false">Close</v-button>
					<v-button danger @click="uninstall()">Uninstall</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import Extension from '@nitwel/directus-marketplace/components/extension.vue';
import { formatTitle } from '@nitwel/directus-marketplace/utils/format';
import { computed, provide, ref } from 'vue';
import { useRouter } from 'vue-router';
import { marketApi } from './market-api';
import api from '@/api';
import { useExtensionsStore } from '@/stores/extensions';
import { useServerStore } from '@/stores/server';

interface Props {
	name: string;
}

const props = defineProps<Props>();
const installDialog = ref(false);
const updateDialog = ref(false);
const uninstallDialog = ref(false);
const version = ref<string | undefined>();
const extensionsStore = useExtensionsStore();
const serverStore = useServerStore();

const extension = computed(() => {
	return extensionsStore.extensions.find((extension) => extension.name === props.name);
});

provide('api', marketApi);

const { t } = useI18n();

const local = computed(() => Boolean(extension.value && !extension.value.registry));

async function install() {
	if (version.value) {
		await api.post(`/extensions/${encodeURIComponent(props.name)}/${encodeURIComponent(version.value)}`);
	} else {
		await api.post(`/extensions/${encodeURIComponent(props.name)}`);
	}
	location.reload();
	installDialog.value = false;
}

async function update() {
	await api.patch(`/extensions/${encodeURIComponent(props.name)}`);

	location.reload();
	updateDialog.value = false;
}

async function uninstall() {
	await api.delete(`/extensions/${encodeURIComponent(props.name)}`);

	location.reload();
	uninstallDialog.value = false;
}

async function toggleExtension() {
	await api.patch(`/extensions/`, [
		{
			name: props.name,
			enabled: !extension.value?.enabled ?? false,
		},
	]);
	location.reload();
}

const title = computed(() => {
	return formatTitle(props.name);
});
</script>

<style scoped>
.header-icon {
	--v-button-color: var(--primary);
	--v-button-background-color: var(--primary-10);
}
.extension {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
