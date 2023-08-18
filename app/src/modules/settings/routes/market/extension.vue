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
			<v-button
				v-if="extension === undefined"
				v-tooltip.bottom="'Install Extension'"
				rounded
				icon
				@click="installDialog = true"
			>
				<v-icon name="save_alt" />
			</v-button>
			<template v-else>
				<v-button v-tooltip.bottom="'Delete Extension'" danger rounded icon @click="uninstallDialog = true">
					<v-icon name="delete" />
				</v-button>
				<v-button
					v-if="local === false"
					v-tooltip.bottom="'Update Extension'"
					secondary
					rounded
					icon
					@click="updateDialog = true"
				>
					<v-icon name="update" />
				</v-button>
				<v-button v-tooltip.bottom="'Settings'" secondary rounded icon @click="settingsDialog = true">
					<v-icon name="settings" />
				</v-button>
				<v-button
					v-tooltip.bottom="extension.enabled ? 'Disable Extension' : 'Enable Extension'"
					:secondary="extension.enabled === false"
					rounded
					icon
					@click="toggleExtension"
				>
					<v-icon :name="extension.enabled ? 'check_box' : 'check_box_outline_blank'" />
				</v-button>
			</template>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_marketplace')" class="page-description" />
			</sidebar-detail>
		</template>

		<Extension
			:name="name"
			:existing-extension="extension"
			app
			:directus-version="serverStore.info?.directus?.version"
			@select-version="version = $event"
		/>

		<v-drawer
			:model-value="installDialog || settingsDialog"
			:title="`Install ${title} extension`"
			@update:model-value="installDialog = settingsDialog = $event"
			@cancel="installDialog = settingsDialog = false"
		>
			<template #actions>
				<slot name="actions" />
				<v-button v-tooltip.bottom="t('save')" :loading="installing" icon rounded @click="install">
					<v-icon name="check" />
				</v-button>
			</template>

			<div class="drawer-item-content">
				<v-notice v-if="installDialog && !selectedVersion.secure" type="danger">
					<p>
						You are installing a
						<strong>non-secure</strong>
						extension. This extension has full access to your database and can do anything.
					</p>
				</v-notice>
				<template v-else>
					<v-notice v-if="installDialog" type="warning">
						This is a secure permission. You are able to configure permissions the extension has access to.
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
	permission: string;
	enabled: boolean;
	options?: string;
}

const props = defineProps<Props>();
const installDialog = ref(false);
const settingsDialog = ref(false);
const installing = ref(false);
const updateDialog = ref(false);
const uninstallDialog = ref(false);
const version = ref<string | undefined>();
const extensionsStore = useExtensionsStore();
const serverStore = useServerStore();

const extension = computed(() => {
	return extensionsStore.extensions.find((extension) => extension.name === props.name);
});

const extensionInfo = ref<Record<string, any> | null>(null);
const latestVersion = ref<string | null>(null);
const grantedPermissionsRequired = ref<Permission[]>([]);
const grantedPermissionsOptional = ref<Permission[]>([]);

provide('api', marketApi);

const { t } = useI18n();

const local = computed(() => Boolean(extension.value && !extension.value.registry));

const selectedVersion = computed(() => {
	if (!extensionInfo.value) return null;

	return extensionInfo.value.versions.find(
		(v: any) => v.version.split('#')[1] === (version.value ?? latestVersion.value)
	);
});

watch([installDialog, settingsDialog], ([openInstall, openSettings]) => {
	if (openInstall || openSettings) {
		grantedPermissionsRequired.value = (selectedVersion.value?.requested_permissions as Record<string, any>[]).reduce<
			Permission[]
		>((acc, perm) => {
			if (perm.optional === false) {
				acc.push({
					permission: perm.permission,
					enabled: true,
					options: perm.options,
				});
			}

			return acc;
		}, []);

		grantedPermissionsOptional.value = (selectedVersion.value?.requested_permissions as Record<string, any>[]).reduce<
			Permission[]
		>((acc, perm) => {
			if (perm.optional === true) {
				acc.push({
					permission: perm.permission,
					enabled: false,
					options: perm.options,
				});
			}

			return acc;
		}, []);
	} else {
		grantedPermissionsRequired.value = [];
		grantedPermissionsOptional.value = [];
	}
});

async function install() {
	installing.value = true;

	const body = {
		granted_permission: [...grantedPermissionsRequired.value, ...grantedPermissionsOptional.value],
	};

	if (version.value) {
		await api.post(`/extensions/${encodeURIComponent(props.name)}/${encodeURIComponent(version.value)}`, body);
	} else {
		await api.post(`/extensions/${encodeURIComponent(props.name)}`, body);
	}

	installDialog.value = false;
	installing.value = false;
	location.reload();
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

watch(
	() => props.name,
	() => {
		loadExtensionInfo();
	},
	{ immediate: true }
);

async function loadExtensionInfo() {
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

	extensionInfo.value = response.data.data;
	latestVersion.value = response.data.data?.latest_version.split('#')[1];
}

const title = computed(() => {
	return formatTitle(props.name);
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
