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
			<v-button v-if="extension === undefined" rounded icon v-tooltip.bottom="'Install Extension'">
				<v-icon name="save_alt" @click="installDialog = true" />
			</v-button>
			<template v-else>
				<v-button danger rounded icon v-tooltip.bottom="'Delete Extension'">
					<v-icon name="delete" @click="uninstallDialog = true" />
				</v-button>
				<v-button secondary rounded icon v-tooltip.bottom="'Update Extension'">
					<v-icon name="update" @click="updateDialog = true" />
				</v-button>
				<v-button :secondary="extension.enabled === false" rounded icon v-tooltip.bottom="extension.enabled ? 'Disable Extension' : 'Enable Extension'">
					<v-icon :name="extension.enabled ? 'check_box' : 'check_box_outline_blank'" @click="toggleExtension" />
				</v-button>
			</template>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_flows_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<Suspense>
			<Extension :name="name" @select-version="version = $event" :existingExtension="extension" app/>
			<template #fallback>
				Loading...
			</template>
		</Suspense>

		<v-dialog :modelValue="installDialog">
			<v-card>
				<v-card-title>Install {{ title }}</v-card-title>
				<v-card-text>
					Are you sure that you want to install this extension?
					The extension has full access to your database and can do anything.
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="installDialog = false">Close</v-button>
					<v-button danger @click="install()">Install</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :modelValue="updateDialog">
			<v-card>
				<v-card-title>Update {{ title }}</v-card-title>
				<v-card-text>
					Are you sure that you want to update this extension?
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="updateDialog = false">Close</v-button>
					<v-button @click="update()">Update</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-dialog :modelValue="uninstallDialog">
			<v-card>
				<v-card-title>Uninstall {{ title }}</v-card-title>
				<v-card-text>
					Are you sure that you want to uninstall this extension?
				</v-card-text>
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

interface Props {
	name: string;
}

const props = defineProps<Props>();
const installDialog = ref(false);
const updateDialog = ref(false);
const uninstallDialog = ref(false);
const version = ref<string | undefined>()
const extensionsStore = useExtensionsStore();

const extension = computed(() => {
	return extensionsStore.extensions.find((extension) => extension.name === props.name);
});

const {} = useRouter();

provide('api', marketApi);

const { t } = useI18n();

async function install() {
	if(version.value) {
		await api.post(`/extensions/${encodeURIComponent(props.name)}/${encodeURIComponent(version.value)}`)
	} else {
		await api.post(`/extensions/${encodeURIComponent(props.name)}`)
	}
	location.reload();
	installDialog.value = false;
}

async function update() {
	await api.patch(`/extensions/${encodeURIComponent(props.name)}`)

	location.reload();
	updateDialog.value = false;
}

async function uninstall() {
	await api.delete(`/extensions/${encodeURIComponent(props.name)}`)

	location.reload();
	uninstallDialog.value = false;
}

async function toggleExtension() {
	await api.patch(`/extensions/`, [
		{
			name: props.name,
			enabled: !extension.value?.enabled ?? false
		}
	])
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
