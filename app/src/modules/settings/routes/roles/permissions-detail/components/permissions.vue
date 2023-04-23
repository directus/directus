<template>
	<div>
		<v-notice type="info">
			{{
				t('permissions_for_role', {
					action: t(permission.action === 'delete' ? 'delete_label' : permission.action).toLowerCase(),
					role: role ? role.name : t('public_label'),
				})
			}}
		</v-notice>

		<v-form v-model="permissionSync" :fields="fields" />

		<div v-if="appMinimal" class="app-minimal">
			<v-divider />
			<v-notice type="warning">{{ t('the_following_are_minimum_permissions') }}</v-notice>
			<pre class="app-minimal-preview">{{ appMinimal }}</pre>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useSync } from '@directus/composables';
import { Permission, Role } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	permission: Permission;
	role?: Role;
	appMinimal?: Partial<Permission>;
}>();

const emit = defineEmits(['update:permission']);

const { t } = useI18n();

const permissionSync = useSync(props, 'permission', emit);

const fields = computed(() => [
	{
		field: 'permissions',
		name: t('rule'),
		type: 'json',
		meta: {
			interface: 'system-filter',
			options: {
				collectionName: permissionSync.value.collection,
			},
		},
	},
]);
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}

.app-minimal {
	.v-divider {
		margin: 24px 0;
	}

	.v-notice {
		margin-bottom: 24px;
	}

	.app-minimal-preview {
		padding: 16px;
		font-family: var(--family-monospace);
		background-color: var(--background-subdued);
		border-radius: var(--border-radius);
	}
}
</style>
