<template>
	<v-list>
		<draggable v-model="fields" :force-fallback="true" item-key="key" handle=".drag-handle">
			<template #item="{ element: field }">
				<v-list-item block>
					<v-icon name="drag_handle" class="drag-handle" left />
					<div class="name">{{ field.name }}</div>
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

		<v-field-list :disabled-fields="value" :collection="collectionName" @select-field="addField" />
	</v-menu>
</template>

<script lang="ts" setup>
import { useFieldsStore } from '@/stores/fields';
import { Field } from '@directus/shared/types';
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import { useI18n } from 'vue-i18n';

interface Props {
	collectionName: string;
	value?: string[] | null;
}

const props = withDefaults(defineProps<Props>(), { value: () => null });

const emit = defineEmits(['input']);

const fieldsStore = useFieldsStore();

const fields = computed<(Field & { key: string })[]>({
	get() {
		return (
			props.value?.map((fieldKey) => ({
				key: fieldKey,
				...fieldsStore.getField(props.collectionName, fieldKey)!,
			})) ?? []
		);
	},
	set(updatedFields) {
		const newFields = updatedFields.map((field) => field.key);
		emit('input', newFields);
	},
});

const { t } = useI18n();

function addField(fieldKey: string) {
	emit('input', [...(props.value ?? []), fieldKey]);
}

function removeField(fieldKey: string) {
	const newArray = props.value?.filter((val) => val !== fieldKey);

	if (!newArray || newArray.length === 0) {
		emit('input', null);
	}

	emit('input', newArray);
}
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
</style>
