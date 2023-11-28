<script setup lang="ts">
import api from '@/api';
import { useDialogRoute } from '@/composables/use-dialog-route';
import { isPermissionEmpty } from '@/utils/is-permission-empty';
import { unexpectedError } from '@/utils/unexpected-error';
import { Permission, Role } from '@directus/types';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { appMinimalPermissions } from '../app-permissions';
import Actions from './components/actions.vue';
import Fields from './components/fields.vue';
import Permissions from './components/permissions.vue';
import Presets from './components/presets.vue';
import Tabs from './components/tabs.vue';
import Validation from './components/validation.vue';

const props = defineProps<{
	permissionKey: string;
	roleKey?: string;
}>();

defineEmits(['refresh']);

const { t } = useI18n();

const router = useRouter();

const isOpen = useDialogRoute();

const permission = ref<Permission>();
const role = ref<Role>();
const loading = ref(false);

const modalTitle = computed(() => {
	if (loading.value || !permission.value) return t('loading');

	if (props.roleKey) {
		return role.value!.name + ' -> ' + permission.value!.collection + ' -> ' + t(permission.value.action);
	}

	return t('public_label') + ' -> ' + permission.value!.collection + ' -> ' + t(permission.value.action);
});

watch(() => props.permissionKey, load, { immediate: true });

const tabsValue = computed(() => {
	if (!permission.value) return [];

	const action = permission.value.action;

	const tabs = [];

	if (['read', 'update', 'delete', 'share'].includes(action)) {
		tabs.push({
			text: t('item_permissions'),
			value: 'permissions',
			hasValue: permission.value.permissions !== null && Object.keys(permission.value.permissions).length > 0,
		});
	}

	if (['create', 'read', 'update'].includes(action)) {
		tabs.push({
			text: t('field_permissions'),
			value: 'fields',
			hasValue: permission.value.fields !== null,
		});
	}

	if (['create', 'update'].includes(action)) {
		tabs.push({
			text: t('field_validation'),
			value: 'validation',
			hasValue: permission.value.validation !== null && Object.keys(permission.value.validation).length > 0,
		});
	}

	if (['create', 'update'].includes(action)) {
		tabs.push({
			text: t('field_presets'),
			value: 'presets',
			hasValue: permission.value.presets !== null && Object.keys(permission.value.presets).length > 0,
		});
	}

	return tabs;
});

const currentTab = ref<string>();

const currentTabInfo = computed(() => {
	const tabKey = currentTab.value?.[0];
	if (!tabKey) return null;
	return tabsValue.value.find((tab) => tab.value === tabKey);
});

watch(
	tabsValue,
	(newTabs, oldTabs) => {
		if (newTabs && oldTabs && newTabs.length === oldTabs.length) return;
		currentTab.value = tabsValue.value?.[0]?.value;
	},
	{ immediate: true },
);

const appMinimal = computed(() => {
	if (!permission.value) return null;
	return appMinimalPermissions.find(
		(p: Partial<Permission>) => p.collection === permission.value!.collection && p.action === permission.value!.action,
	);
});

async function close() {
	if (permission.value && isPermissionEmpty(permission.value)) {
		await api.delete(`/permissions/${permission.value.id}`);
		router.replace(`/settings/roles/${props.roleKey || 'public'}`);
	} else {
		router.push(`/settings/roles/${props.roleKey || 'public'}`);
	}
}

async function load() {
	loading.value = true;

	try {
		if (props.roleKey) {
			const response = await api.get(`/roles/${props.roleKey}`, {
				params: {
					deep: { users: { _limit: 0 } },
				},
			});

			role.value = response.data.data;
		}

		const response = await api.get(`/permissions/${props.permissionKey}`);
		permission.value = response.data.data;
	} catch (error: any) {
		if (error?.response?.status === 403) {
			router.push(`/settings/roles/${props.roleKey || 'public'}`);
		} else {
			unexpectedError(error);
		}
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<v-drawer
		:title="modalTitle"
		:model-value="isOpen"
		class="new-collection"
		persistent
		:sidebar-label="currentTabInfo && currentTabInfo.text"
		@cancel="close"
	>
		<template v-if="!loading" #sidebar>
			<tabs v-model:current-tab="currentTab" :tabs="tabsValue" />
		</template>

		<div v-if="!loading && permission" class="content">
			<permissions
				v-if="currentTab === 'permissions'"
				v-model:permission="permission"
				:role="role"
				:app-minimal="appMinimal?.permissions"
			/>
			<fields
				v-if="currentTab === 'fields'"
				v-model:permission="permission"
				:role="role"
				:app-minimal="appMinimal?.fields"
			/>
			<validation v-if="currentTab === 'validation'" v-model:permission="permission" :role="role" />
			<presets v-if="currentTab === 'presets'" v-model:permission="permission" :role="role" />
		</div>

		<template v-if="!loading && permission" #actions>
			<actions :role-key="roleKey" :permission="permission" @refresh="$emit('refresh', Number(permissionKey))" />
		</template>
	</v-drawer>
</template>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>
