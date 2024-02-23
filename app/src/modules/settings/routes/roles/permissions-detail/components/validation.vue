<script setup lang="ts">
import { DeepPartial, Field, Permission, Role } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	permission: Permission;
	role?: Role;
	appMinimal?: Permission['validation'];
}>();

const emit = defineEmits(['update:permission']);

const { t } = useI18n();

const permissionLocal = ref({ validation: props.permission.validation });
const permissionInitial = permissionLocal.value;

const permissionSync = computed({
	get() {
		return permissionLocal.value;
	},
	set(value) {
		permissionLocal.value = value;

		emit('update:permission', {
			...props.permission,
			validation: value.validation !== undefined ? value.validation : permissionInitial.validation,
		});
	},
});

const fields = computed<DeepPartial<Field>[]>(() => [
	{
		field: 'validation',
		name: t('rule'),
		type: 'json',
		meta: {
			interface: 'system-filter',
			options: {
				collectionName: props.permission.collection,
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

		<v-form v-model="permissionSync" :initial-values="permissionInitial" :fields="fields" />

		<div v-if="appMinimal" class="app-minimal">
			<v-divider />
			<v-notice type="warning">{{ t('the_following_are_minimum_permissions') }}</v-notice>
			<pre class="app-minimal-preview">{{ appMinimal }}</pre>
		</div>
	</div>
</template>

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
		font-family: var(--theme--fonts--monospace--font-family);
		background-color: var(--theme--background-subdued);
		border-radius: var(--theme--border-radius);
	}
}
</style>
