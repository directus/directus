<template>
	<div>
		<v-notice type="info">
			{{
				t('fields_for_role', {
					role: role ? role.name : t('public'),
					action: t(permission.action).toLowerCase(),
				})
			}}
		</v-notice>

		<p class="type-label">{{ t('field', 0) }}</p>
		<interface-select-multiple-checkbox
			:value="fields"
			@input="fields = $event"
			type="json"
			:choices="fieldsInCollection"
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
import { Permission, Field, Role } from '@/types';
import useSync from '@/composables/use-sync';
import { useFieldsStore } from '@/stores';

export default defineComponent({
	emits: ['update:permission'],
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
	setup(props, { emit }) {
		const { t } = useI18n();

		const fieldsStore = useFieldsStore();

		const internalPermission = useSync(props, 'permission', emit);

		const fieldsInCollection = computed(() => {
			const fields = fieldsStore.getFieldsForCollection(props.permission.collection);

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
					if (newFields.length === fieldsInCollection.value.length) {
						internalPermission.value = {
							...internalPermission.value,
							fields: ['*'],
						};
					} else {
						internalPermission.value = {
							...internalPermission.value,
							fields: newFields,
						};
					}
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
