<template>
	<v-modal :title="modalTitle" :active="true" class="new-collection" persistent>
		<template #sidebar v-if="!loading">
			<tabs :current-tab.sync="currentTab" :tabs="tabs" />
		</template>

		<template v-if="!loading">
			<permissions v-if="currentTab[0] === 'permissions'" :permission.sync="permission" :role="role" />
			<fields v-if="currentTab[0] === 'fields'" :permission.sync="permission" :role="role" />
			<validation v-if="currentTab[0] === 'validation'" :permission.sync="permission" :role="role" />
			<presets v-if="currentTab[0] === 'presets'" :permission.sync="permission" :role="role" />
		</template>

		<template #footer v-if="!loading">
			<actions :role-key="roleKey" :permission="permission" @refresh="$emit('refresh', +permissionKey)" />
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import api from '@/api';
import { Permission, Role } from '@/types';
import { useFieldsStore, useCollectionsStore } from '@/stores/';
import notify from '@/utils/notify';
import router from '@/router';
import i18n from '@/lang';
import Actions from './components/actions.vue';
import Tabs from './components/tabs.vue';

import Permissions from './components/permissions.vue';
import Fields from './components/fields.vue';
import Validation from './components/validation.vue';
import Presets from './components/presets.vue';

export default defineComponent({
	components: { Actions, Tabs, Permissions, Fields, Validation, Presets },
	props: {
		roleKey: {
			type: String,
			required: true,
		},
		permissionKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();

		const permission = ref<Permission>();
		const role = ref<Role>();
		const error = ref<any>();
		const loading = ref(false);

		const collectionName = computed(() => {
			if (!permission.value) return null;
			return collectionsStore.state.collections.find(
				(collection) => collection.collection === permission.value!.collection
			)?.name;
		});

		const modalTitle = computed(() => {
			if (!permission.value || !role.value || loading.value) return i18n.t('loading');
			return role.value!.name + ' -> ' + collectionName.value + ' -> ' + i18n.t(permission.value.action);
		});

		watch(() => props.permissionKey, load, { immediate: true });

		const tabs = computed(() => {
			if (!permission.value) return [];

			const action = permission.value.action;

			const tabs = [];

			if (['read', 'update', 'delete'].includes(action)) {
				tabs.push({
					text: i18n.t('item_permissions'),
					value: 'permissions',
					hasValue:
						permission.value.permissions !== null && Object.keys(permission.value.permissions).length > 0,
				});
			}

			if (['create', 'read', 'update'].includes(action)) {
				tabs.push({
					text: i18n.t('field_permissions'),
					value: 'fields',
					hasValue: permission.value.fields !== null,
				});
			}

			if (['create', 'update'].includes(action)) {
				tabs.push({
					text: i18n.t('field_validation'),
					value: 'validation',
					hasValue:
						permission.value.validation !== null && Object.keys(permission.value.validation).length > 0,
				});
			}

			if (['create', 'update'].includes(action)) {
				tabs.push({
					text: i18n.t('field_presets'),
					value: 'presets',
					hasValue: permission.value.presets !== null && Object.keys(permission.value.presets).length > 0,
				});
			}

			return tabs;
		});

		const currentTab = ref<string[]>([]);

		watch(
			tabs,
			(newTabs, oldTabs) => {
				if (newTabs && oldTabs && newTabs.length === oldTabs.length) return;
				currentTab.value = [tabs?.value?.[0]?.value];
			},
			{ immediate: true }
		);

		return { permission, role, error, loading, modalTitle, tabs, currentTab };

		async function load() {
			loading.value = true;

			try {
				const [roleRes, permRes] = await Promise.all([
					api.get(`/roles/${props.roleKey}`),
					api.get(`/permissions/${props.permissionKey}`),
				]);

				role.value = roleRes.data.data;
				permission.value = permRes.data.data;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>
