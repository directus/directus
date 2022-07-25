<template>
	<div>
		<v-notice type="info">
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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { Permission, Role } from '@directus/shared/types';
import { Field } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';
import { useFieldsStore } from '@/stores/fields';

export default defineComponent({
	props: {
		permission: {
			type: Object as PropType<Permission>,
			required: true,
		},
		role: {
			type: Object as PropType<Role>,
			default: null,
		},
		appMinimal: {
			type: Object as PropType<Partial<Permission>>,
			default: undefined,
		},
	},
	emits: ['update:permission'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fieldsStore = useFieldsStore();

		const internalPermission = useSync(props, 'permission', emit);

		const fieldsInCollection = computed(() => {
			const fields = fieldsStore.getFieldsForCollectionSorted(props.permission.collection);

			return fields.map((field: Field) => {
				return {
					text: field.name,
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

		return { t, fields, fieldsInCollection };
	},
});
</script>

<style lang="scss" scoped>
.type-label {
	margin-bottom: 8px;
}

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
