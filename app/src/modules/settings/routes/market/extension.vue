<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact to="/settings/market">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('marketplace.title'), to: '/settings/market' }]" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #actions>
			<v-button
				v-if="installedExtension === undefined"
				v-tooltip.bottom="'Install Extension'"
				rounded
				icon
				:disabled="!installAllowed"
				@click="drawer = 'install'"
			>
				<v-icon name="save_alt" />
			</v-button>
			<template v-else>
				<v-button v-tooltip.bottom="'Delete Extension'" danger rounded icon @click="uninstallDialog = true">
					<v-icon name="delete" />
				</v-button>
				<v-button
					v-if="canChangeVersion"
					v-tooltip.bottom="'Change Extension Version'"
					secondary
					rounded
					icon
					:disabled="!installAllowed"
					@click="drawer = 'change'"
				>
					<v-icon name="update" />
				</v-button>
				<v-button
					v-if="updateAvailable"
					v-tooltip.bottom="'Update Extension'"
					warning
					rounded
					icon
					:disabled="!installAllowed"
					@click="onUpdateDrawer"
				>
					<v-icon name="file_download" />
				</v-button>
				<v-button v-tooltip.bottom="'Settings'" secondary rounded icon @click="drawer = 'settings'">
					<v-icon name="settings" />
				</v-button>
				<v-button
					v-tooltip.bottom="installedExtension?.enabled ? 'Disable Extension' : 'Enable Extension'"
					:secondary="installedExtension?.enabled === false"
					rounded
					icon
					@click="toggleExtension"
				>
					<v-icon :name="installedExtension?.enabled ? 'check_box' : 'check_box_outline_blank'" />
				</v-button>
			</template>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('marketplace.page_help_settings')" class="page-description" />
			</sidebar-detail>
		</template>

		<Extension
			:name="name"
			:existing-extension="installedExtension"
			app
			:directus-version="directusVersion"
			@select-version="version = $event"
		/>

		<v-drawer
			:model-value="drawer !== undefined"
			:title="drawerTitle"
			@update:model-value="onDrawerClose"
			@cancel="onDrawerClose"
		>
			<template #actions>
				<slot name="actions" />
				<v-button v-tooltip.bottom="t('save')" :loading="saving" icon rounded @click="onDrawerSave">
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="drawer-item-content">
				<template v-if="!selectedVersion.secure">
					<v-notice v-if="drawer === 'install'" type="danger">
						<p v-md="t('marketplace.extension.non_secure.install')" />
					</v-notice>
					<v-notice v-if="drawer === 'change' || drawer === 'update'" type="danger">
						<p v-md="t('marketplace.extension.non_secure.update')" />
					</v-notice>
				</template>
				<template v-else>
					<v-notice v-if="drawer === 'install' || drawer === 'update' || drawer === 'change'" type="warning">
						<p v-md="t('marketplace.extension.secure')" />
					</v-notice>

					<div class="title">Required Permissions</div>
					<v-list class="permissions required">
						<Permission
							v-for="(permission, index) in grantedPermissionsRequired"
							:key="permission.permission"
							:permission="permission"
							@update:permissions="grantedPermissionsRequired[index] = $event"
						/>
					</v-list>
					<div class="title">Optional Permissions</div>
					<v-list class="permissions required">
						<Permission
							v-for="(permission, index) in grantedPermissionsOptional"
							:key="permission.permission"
							:permission="permission"
							optional
							@update:permissions="grantedPermissionsOptional[index] = $event"
						/>
					</v-list>
				</template>
			</div>
		</v-drawer>
		<v-dialog :model-value="uninstallDialog">
			<v-card>
				<v-card-title>{{ t('marketplace.extension.uninstall.title', { name: title }) }}</v-card-title>
				<v-card-text>{{ t('marketplace.extension.uninstall.description') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="uninstallDialog = false">{{ t('close') }}</v-button>
					<v-button danger @click="uninstall()">{{ t('marketplace.extension.uninstall.action') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import Permission from './permission.vue';
import Extension from '@nitwel/directus-marketplace/market/extension.vue';
import { formatTitle } from '@nitwel/directus-marketplace/utils/format';
import { computed, provide, ref, watch } from 'vue';
import { marketApi } from './market-api';
import api from '@/api';
import { useExtensionsStore } from '@/stores/extensions';
import { useServerStore } from '@/stores/server';

interface Props {
	name: string;
}

export interface Permission {
	id?: number;
	extension?: string;
	permission: string;
	enabled: boolean;
	options?: string;
}

type Drawer = 'install' | 'settings' | 'update' | 'change' | undefined;

const props = defineProps<Props>();
const drawer = ref<Drawer>();
const uninstallDialog = ref(false);
const saving = ref(false);

const extensionsStore = useExtensionsStore();
const serverStore = useServerStore();

const installedExtension = computed(() => {
	return extensionsStore.extensions.find((extension) => extension.name === props.name);
});

const version = ref<string | undefined>();
const directusVersion = __DIRECTUS_VERSION__;

const marketExtension = ref<Record<string, any> | null>(null);
const latestVersion = ref<string | null>(null);
const grantedPermissionsRequired = ref<Permission[]>([]);
const grantedPermissionsOptional = ref<Permission[]>([]);

provide('api', marketApi);

const { t } = useI18n();

const selectedVersion = computed(() => {
	if (!marketExtension.value) return null;

	return marketExtension.value.versions.find(
		(v: any) => v.version.split('#')[1] === (version.value ?? latestVersion.value)
	);
});

const installedVersion = computed(() => {
	if (!marketExtension.value) return null;

	return marketExtension.value.versions.find((v: any) => v.version.split('#')[1] === installedExtension.value?.version);
});

const updateAvailable = computed(
	() => marketExtension.value?.latest_version.split('#')[1] !== installedExtension.value?.version
);

const canChangeVersion = computed(() => version.value !== installedExtension.value?.version);

watch(drawer, (open) => {
	if (open === undefined) {
		grantedPermissionsRequired.value = [];
		grantedPermissionsOptional.value = [];
		return;
	}

	const permissions: Record<string, any>[] =
		open === 'settings' ? installedVersion.value?.requested_permissions : selectedVersion.value?.requested_permissions;

	grantedPermissionsRequired.value = permissions.reduce<Permission[]>((acc, perm) => {
		if (perm.optional) return acc;

		const grantedPerm = installedExtension.value?.granted_permissions.find((p) => p.permission === perm.permission);

		acc.push({
			id: grantedPerm?.id,
			extension: grantedPerm?.extension,
			permission: perm.permission,
			enabled: grantedPerm?.enabled ?? true,
			options: grantedPerm?.options ?? perm.options,
		});

		return acc;
	}, []);

	grantedPermissionsOptional.value = permissions.reduce<Permission[]>((acc, perm) => {
		if (!perm.optional) return acc;

		const grantedPerm = installedExtension.value?.granted_permissions.find((p) => p.permission === perm.permission);

		if (perm.optional === true) {
			acc.push({
				id: grantedPerm?.id,
				extension: grantedPerm?.extension,
				permission: perm.permission,
				enabled: grantedPerm?.enabled ?? false,
				options: grantedPerm?.options ?? perm.options,
			});
		}

		return acc;
	}, []);
});

const installAllowed = computed(() => {
	return (
		(serverStore.info.extensions?.installAllowed && selectedVersion.value?.secure) ||
		(serverStore.info.extensions?.installAllowed && serverStore.info.extensions?.unsafeAllowed)
	);
});

let versionBeforeUpdate: string | undefined = undefined;

function onUpdateDrawer() {
	drawer.value = 'update';
	versionBeforeUpdate = version.value;
	version.value = latestVersion.value ?? undefined;
}

function onDrawerSave() {
	switch (drawer.value) {
		case 'install':
		case 'update':
		case 'change':
			install();
			break;
		case 'settings':
			saveSettings();
			break;
	}
}

function onDrawerClose() {
	if (drawer.value === 'update') {
		version.value = versionBeforeUpdate;
	}

	drawer.value = undefined;
}

async function saveSettings() {
	saving.value = true;

	await api.patch(`/extensions/${encodeURIComponent(props.name)}`, {
		granted_permissions: [...grantedPermissionsRequired.value, ...grantedPermissionsOptional.value],
	});

	drawer.value = undefined;
	saving.value = false;
	extensionsStore.hydrate();
}

// Works both for installing and Updating
async function install() {
	saving.value = true;

	const body = {
		granted_permissions: [...grantedPermissionsRequired.value, ...grantedPermissionsOptional.value],
	};

	if (version.value) {
		await api.post(`/extensions/${encodeURIComponent(props.name)}/${encodeURIComponent(version.value)}`, body);
	} else {
		await api.post(`/extensions/${encodeURIComponent(props.name)}`, body);
	}

	drawer.value = undefined;
	saving.value = false;
	location.reload();
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
			enabled: !installedExtension.value?.enabled ?? false,
		},
	]);

	location.reload();
}

watch(
	() => props.name,
	() => {
		loadmarketExtension();
	},
	{ immediate: true }
);

async function loadmarketExtension() {
	const versionFields = [
		'version',
		'readme',
		'license',
		'size',
		'directus_version',
		'secure',
		'requested_permissions.*',
	]
		.map((f) => `versions.${f}`)
		.join(',');

	const response = await marketApi.get(`/items/extensions/${encodeURIComponent(props.name)}`, {
		params: {
			fields: '*,latest_version,' + versionFields,
		},
	});

	marketExtension.value = response.data.data;
	latestVersion.value = response.data.data?.latest_version.split('#')[1];
}

const title = computed(() => {
	return formatTitle(props.name);
});

const drawerTitle = computed(() => {
	switch (drawer.value) {
		case 'install':
			return t('marketplace.extension.title.install', { name: title.value });
		case 'update':
			return t('marketplace.extension.title.update', { name: title.value });
		case 'change':
			return t('marketplace.extension.title.change', { name: title.value, version: version.value });
		case 'settings':
			return t('marketplace.extension.title.settings', { name: title.value });
	}

	return '';
});
</script>

<style scoped lang="scss">
.header-icon {
	--v-button-color: var(--primary);
	--v-button-background-color: var(--primary-10);
}
.extension {
	padding: var(--content-padding);
	padding-top: 0;
}

.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);

	.title {
		margin-top: 16px;
		margin-bottom: 8px;
		font-size: 16px;
		font-weight: 600;
	}
}
</style>
