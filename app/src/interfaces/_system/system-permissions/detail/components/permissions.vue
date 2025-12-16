<script setup lang="ts">
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import type { DeepPartial, Field, Permission, Policy } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppMinimal from './app-minimal.vue';

const props = defineProps<{
	permission: Permission;
	policy?: Policy;
	appMinimal?: Permission['permissions'];
}>();

const emit = defineEmits(['update:permission']);

const { t } = useI18n();

const permissionLocal = ref({ permissions: props.permission.permissions });
const permissionInitial = permissionLocal.value;

const permissionSync = computed({
	get() {
		return permissionLocal.value;
	},
	set(value) {
		permissionLocal.value = value;

		emit('update:permission', {
			...props.permission,
			permissions: value.permissions !== undefined ? value.permissions : permissionInitial.permissions,
		});
	},
});

const fields = computed<DeepPartial<Field>[]>(() => [
	{
		field: 'permissions',
		name: t('rule'),
		type: 'json',
		meta: {
			interface: 'system-filter',
			options: {
				collectionName: props.permission.collection,
				rawFieldNames: true,
			},
		},
	},
]);
</script>

<template>
	<div>
		<v-notice>
			{{
				$t('permissions_for_policy', {
					action: $t(permission.action === 'delete' ? 'delete_label' : permission.action).toLowerCase(),
					policy: policy ? policy.name : $t('public_label'),
				})
			}}
		</v-notice>

		<v-form v-model="permissionSync" :initial-values="permissionInitial" :fields="fields" />

		<app-minimal :value="appMinimal" />
	</div>
</template>

<style scoped>
.v-notice {
	margin-block-end: 36px;
}
</style>
