<script setup lang="ts">
import api from '@/api';
import VDrawer from '@/components/v-drawer.vue';
import { isPermissionEmpty } from '@/utils/is-permission-empty';
import { unexpectedError } from '@/utils/unexpected-error';
import { appAccessMinimalPermissions } from '@directus/system-data';
import { Permission, Policy, PrimaryKey } from '@directus/types';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Actions from './components/actions.vue';
import Fields from './components/fields.vue';
import Permissions from './components/permissions.vue';
import Presets from './components/presets.vue';
import Tabs from './components/tabs.vue';
import Validation from './components/validation.vue';

const props = defineProps<{
	active: boolean;
	policyKey: PrimaryKey | null;
	permissionKey: PrimaryKey | null;
	policyEdits?: Record<string, any>;
	edits: Record<string, any>;
}>();

const emit = defineEmits<{
	input: [Permission | null];
	'update:active': [boolean];
}>();

const { permissionKey, policyKey } = toRefs(props);
const { t } = useI18n();

const { internalActive } = useActiveState();

const permission = ref<Permission | null>(null);
const policy = ref<Policy | null>(null);

const loading = ref(false);

const modalTitle = computed(() => {
	if (loading.value || !permission.value) return t('loading');

	if (props.policyKey) {
		return (
			(policy.value?.name ?? t('editing_policy')) +
			' -> ' +
			permission.value!.collection +
			' -> ' +
			t(permission.value.action)
		);
	}

	return t('public_label') + ' -> ' + permission.value!.collection + ' -> ' + t(permission.value.action);
});

watch([permissionKey, policyKey], load, { immediate: true });

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
	if (!policy.value?.app_access) return null;

	const currentPermission = permission.value;

	if (!currentPermission) return null;

	return appAccessMinimalPermissions.find(
		(minimalPermission: Partial<Permission>) =>
			minimalPermission.collection === currentPermission.collection &&
			minimalPermission.action === currentPermission.action,
	);
});

function close() {
	internalActive.value = false;
	permission.value = null;
	policy.value = null;
}

async function load() {
	loading.value = true;

	try {
		if (props.policyKey !== null && props.policyKey !== '+') {
			const response = await api.get(`/policies/${props.policyKey}`, {
				params: {
					deep: { users: { _limit: 0 } },
				},
			});

			policy.value = { ...response.data.data, ...props.policyEdits };
		} else {
			policy.value = { ...props.policyEdits } as Policy;
		}

		if (props.permissionKey !== null && props.permissionKey !== '+') {
			const response = await api.get(`/permissions/${props.permissionKey}`);
			permission.value = { ...response.data.data, ...props.edits };
		} else if (props.permissionKey === '+') {
			permission.value = { ...props.edits } as Permission;
		}
	} catch (error: any) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function useActiveState() {
	const localActive = ref(false);

	const internalActive = computed({
		get() {
			return props.active ?? localActive.value;
		},
		set(newActive: boolean) {
			localActive.value = newActive;
			emit('update:active', newActive);
		},
	});

	return { internalActive };
}

function save() {
	if (permission.value && isPermissionEmpty(permission.value)) {
		emit('input', null);
	} else {
		emit('input', permission.value);
	}

	close();
}
</script>

<template>
	<v-drawer
		v-model="internalActive"
		:title="modalTitle"
		class="new-collection"
		persistent
		:sidebar-label="currentTabInfo && currentTabInfo.text"
		@cancel="close"
		@apply="save"
	>
		<template v-if="!loading" #sidebar>
			<tabs v-model:current-tab="currentTab" :tabs="tabsValue" />
		</template>

		<div v-if="!loading && permission && policy" class="content">
			<permissions
				v-if="currentTab === 'permissions'"
				v-model:permission="permission"
				:policy="policy"
				:app-minimal="appMinimal?.permissions"
			/>
			<fields
				v-if="currentTab === 'fields'"
				v-model:permission="permission"
				:policy="policy"
				:app-minimal="appMinimal?.fields"
			/>
			<validation
				v-if="currentTab === 'validation'"
				v-model:permission="permission"
				:policy="policy"
				:app-minimal="appMinimal?.validation"
			/>
			<presets v-if="currentTab === 'presets'" v-model:permission="permission" :policy="policy" />
		</div>

		<template v-if="!loading && permission" #actions>
			<actions :policy-key="policyKey" :permission="permission" @save="save" />
		</template>
	</v-drawer>
</template>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding);
}
</style>
