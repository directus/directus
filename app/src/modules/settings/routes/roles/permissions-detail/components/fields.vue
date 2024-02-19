<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { useSync } from '@directus/composables';
import type { Field, Permission, Role } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	permission: Permission;
	role?: Role;
	appMinimal?: Permission['fields'];
}>();

const emit = defineEmits(['update:permission']);

const { t } = useI18n();

const fieldsStore = useFieldsStore();

const internalPermission = useSync(props, 'permission', emit);

const fieldsInCollection = computed(() => {
	const fields = fieldsStore.getFieldsForCollectionSorted(props.permission.collection);

	const appMinimalPermissionsFields = new Set(props.appMinimal ?? []);

	return fields.map((field: Field) => {
		return {
			text: field.field,
			disabled: appMinimalPermissionsFields.has(field.field),
			value: field.field,
		};
	});
});

const fields = computed({
	get() {
		if (!internalPermission.value.fields) return [];

		if (internalPermission.value.fields.includes('*')) {
			return fieldsInCollection.value.map(({ value }: { value: string }) => value);
		}

		return internalPermission.value.fields;
	},
	set(newFields: string[] | null) {
		if (newFields && newFields.length > 0) {
			internalPermission.value = {
				...internalPermission.value,
				fields: newFields,
			};
		} else {
			internalPermission.value = {
				...internalPermission.value,
				fields: null,
			};
		}
	},
});
</script>

<template>
	<div>
		<v-notice>
			{{
				t('fields_for_role', {
					role: role ? role.name : t('public_label'),
					action: t(permission.action).toLowerCase(),
				})
			}}
		</v-notice>

		<p class="type-label">{{ t('field', 0) }}</p>
		<interface-select-multiple-checkbox
			:value="fields"
			type="json"
			:choices="fieldsInCollection"
			@input="fields = $event"
		/>

		<div v-if="appMinimal" class="app-minimal">
			<v-divider />
			<v-notice type="warning">{{ t('the_following_are_minimum_permissions') }}</v-notice>
			<pre class="app-minimal-preview">{{ appMinimal }}</pre>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.type-label {
	margin-bottom: 8px;
}

.v-notice {
	margin-bottom: 36px;
}

.checkboxes :deep(.v-checkbox .type-text) {
	font-family: var(--theme--fonts--monospace--font-family);
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
