<script setup lang="ts">
import VFieldList from '@/components/v-field-list/v-field-list.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import { useFieldsStore } from '@/stores/fields';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';
import { Field } from '@directus/types';
import { computed } from 'vue';
import Draggable from 'vuedraggable';

interface Props {
	collectionName: string;
	value?: string[] | null;
	allowSelectAll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: null,
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

<template>
	<template v-if="!collectionName">
		<VNotice>
			{{ $t('interfaces.system-fields.select_a_collection') }}
		</VNotice>
	</template>
	<template v-else>
		<VList v-if="fields.length === 0">
			<VNotice class="no-fields">{{ $t('interfaces.system-fields.no_fields') }}</VNotice>
		</VList>
		<Draggable
			v-else
			v-model="fields"
			tag="v-list"
			item-key="key"
			handle=".drag-handle"
			v-bind="{ 'force-fallback': true }"
		>
			<template #item="{ element: field }">
				<VListItem block>
					<VIcon name="drag_handle" class="drag-handle" left />
					<div class="name">{{ field.displayName }}</div>
					<div class="spacer" />
					<VIcon name="close" clickable @click="removeField(field.key)" />
				</VListItem>
			</template>
		</Draggable>
		<VMenu placement="bottom-start" show-arrow>
			<template #activator="{ toggle }">
				<button class="toggle" @click="toggle">
					{{ $t('add_field') }}
					<VIcon name="expand_more" />
				</button>
			</template>

			<VFieldList
				:disabled-fields="value"
				:collection="collectionName"
				:allow-select-all="allowSelectAll"
				@add="addFields"
			/>
		</VMenu>
	</template>
</template>

<style lang="scss" scoped>
.toggle {
	color: var(--theme--primary);
	font-weight: 600;
	margin-inline-start: 10px;
	margin-block-start: 6px;

	.v-icon {
		position: absolute;
	}
}

.v-notice.no-fields {
	background-color: var(--theme--background);
	border: var(--theme--border-width) solid var(--v-list-item-border-color, var(--theme--border-color-subdued));

	&::after {
		display: none;
	}
}
</style>
