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

const permissionSync = useSync(props, 'permission', emit);

const fieldsInCollection = computed(() => {
	const fields = fieldsStore.getFieldsForCollectionSorted(props.permission.collection);

	const appMinimal = new Set(props.appMinimal ?? []);

	return fields.map((field: Field) => {
		return {
			text: field.field,
			disabled: appMinimal.has('*') || appMinimal.has(field.field),
			value: field.field,
		};
	});
});

const fields = computed({
	get() {
		const fields = new Set([...(props.appMinimal ?? []), ...(permissionSync.value.fields ?? [])]);

		if (fields.has('*')) {
			for (const field of fieldsInCollection.value) {
				fields.add(field.value);
			}
		}

		return Array.from(fields);
	},
	set(newFields: string[] | null) {
		const fields: string[] = [];

		const appMinimal = new Set(props.appMinimal ?? []);
		const previousFields = new Set(permissionSync.value.fields ?? []);

		for (const field of newFields ?? []) {
			if (appMinimal.has(field) && !previousFields.has(field)) continue;
			fields.push(field);
		}

		if (fields && fields.length > 0) {
			permissionSync.value = {
				...permissionSync.value,
				fields,
			};
		} else {
			permissionSync.value = {
				...permissionSync.value,
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
