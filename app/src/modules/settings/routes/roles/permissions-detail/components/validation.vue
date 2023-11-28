<script setup lang="ts">
import { useSync } from '@directus/composables';
import { Permission, Role } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	permission: Permission;
	role?: Role;
}>();

const emit = defineEmits(['update:permission']);

const { t } = useI18n();

const permissionSync = useSync(props, 'permission', emit);

const fields = computed(() => [
	{
		field: 'validation',
		name: t('rule'),
		type: 'json',
		meta: {
			interface: 'system-filter',
			options: {
				collectionName: permissionSync.value.collection,
				includeValidation: true,
				includeRelations: false,
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
				t('validation_for_role', {
					action: t(permission.action).toLowerCase(),
					role: role ? role.name : t('public_label'),
				})
			}}
		</v-notice>

		<v-form v-model="permissionSync" :fields="fields" />
	</div>
</template>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
