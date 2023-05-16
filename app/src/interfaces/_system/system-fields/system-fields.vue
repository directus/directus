<template>
	<template v-if="!collectionName">
		<v-notice type="info">
			{{ t('interfaces.system-fields.select_a_collection') }}
		</v-notice>
	</template>
	<template v-else>
		<v-list v-if="fields.length === 0">
			<v-notice class="no-fields">{{ t('interfaces.system-fields.no_fields') }}</v-notice>
		</v-list>
		<v-list v-else>
			<draggable v-model="fields" :force-fallback="true" item-key="key" handle=".drag-handle">
				<template #item="{ element: field }">
					<v-list-item block>
						<v-icon name="drag_handle" class="drag-handle" left />
						<div class="name">{{ field.displayName }}</div>
						<div class="spacer" />
						<v-icon name="close" clickable @click="removeField(field.key)" />
					</v-list-item>
				</template>
			</draggable>
		</v-list>
		<v-menu placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<button class="toggle" @click="toggle">
					{{ t('add_field') }}
					<v-icon name="expand_more" />
				</button>
			</template>

			<v-field-list
				:disabled-fields="value"
				:collection="collectionName"
				:allow-select-all="allowSelectAll"
				@add="addFields"
			/>
		</v-menu>
	</template>
</template>

<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { Field } from '@directus/types';
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import { useI18n } from 'vue-i18n';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';

interface Props {
	collectionName: string;
	value?: string[] | null;
	allowSelectAll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: () => null,
	allowSelectAll: false,
});

const emit = defineEmits(['input']);

const fieldsStore = useFieldsStore();

const fields = computed<(Field & { key: string })[]>({
	get() {
		return (
			props.value?.map((fieldKey) => ({
				key: fieldKey,
				...fieldsStore.getField(props.collectionName, fieldKey)!,
				displayName: getFieldDisplayName(fieldKey),
			})) ?? []
		);

		function getFieldDisplayName(fieldKey: string) {
			const fieldParts = fieldKey.split('.');

			const fieldNames = fieldParts.map((fieldKey, index) => {
				const hasFunction = fieldKey.includes('(') && fieldKey.includes(')');

				let key = fieldKey;
				let functionName;

				if (hasFunction) {
					const { field, fn } = extractFieldFromFunction(fieldKey);
					functionName = fn;
					key = field;
				}

				const pathPrefix = fieldParts.slice(0, index);
				const field = fieldsStore.getField(props.collectionName, [...pathPrefix, key].join('.'));

				const name = field?.name ?? key;

				if (hasFunction) {
					return t(`functions.${functionName}`) + ` (${name})`;
				}

				return name;
			});

			return fieldNames.join(' -> ');
		}
	},
	set(updatedFields) {
		const newFields = updatedFields.map((field) => field.key);
		emit('input', newFields);
	},
});

const { t } = useI18n();

const addFields = (fields: string[]) => {
	const uniqueFields = new Set([...(props.value ?? []), ...fields]);
	emit('input', Array.from(uniqueFields));
};

const removeField = (field: string) => {
	const newFields = props.value?.filter((val) => val !== field);

	if (!newFields || newFields.length === 0) {
		emit('input', null);
	}

	emit('input', newFields);
};
</script>

<style lang="scss" scoped>
.toggle {
	color: var(--primary);
	font-weight: 600;
	margin-left: 10px;
	margin-top: 6px;

	.v-icon {
		position: absolute;
	}
}

.v-notice.no-fields {
	background-color: var(--background-page);
	border: var(--border-width) solid var(--v-list-item-border-color);

	&::after {
		display: none;
	}
}
</style>
