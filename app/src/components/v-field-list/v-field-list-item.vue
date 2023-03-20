<template>
	<v-list-group
		v-if="field.children || supportedFunctions.length > 0"
		:clickable="!field.disabled && (relationalFieldSelectable || !field.relatedCollection)"
		:value="field.path"
		@click="$emit('add', field.key)"
	>
		<template #activator>
			<v-list-item-content>
				<v-text-overflow :text="field.name || formatTitle(field.field)" :highlight="search" />
			</v-list-item-content>
		</template>

		<div v-if="supportedFunctions.length > 0" class="functions">
			<v-list-item
				v-for="fn of supportedFunctions"
				:key="fn"
				:disabled="field.disabled"
				clickable
				@click="$emit('add', `${fn}(${field.key})`)"
			>
				<v-list-item-icon>
					<v-icon name="auto_awesome" small color="var(--primary)" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow
						:text="`${t(`functions.${fn}`)} (${field.name || formatTitle(field.field)})`"
						:highlight="search"
					/>
				</v-list-item-content>
			</v-list-item>

			<v-divider v-if="field.children && field.children.length > 0" />
		</div>
		<template v-if="allowSelectAll">
			<v-divider />
			<v-list-item v-if="disabledFields?.length !== treeList?.length" clickable @click="selectAll">
				{{ t('select_all') }}
			</v-list-item>
			<v-list-item v-else clickable @click="deselectAll">
				{{ t('deselect_all') }}
			</v-list-item>
			<v-divider />
		</template>

		<v-field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:field="childField"
			:search="search"
			:disabled-fields="disabledFields"
			:include-functions="includeFunctions"
			:relational-field-selectable="relationalFieldSelectable"
			:allow-select-all="allowSelectAll"
			@select-all="$emit('select-all', $event)"
			@add="$emit('add', $event)"
		/>
	</v-list-group>

	<v-list-item v-else :disabled="field.disabled" clickable @click="$emit('add', field.key)">
		<v-list-item-content>
			<v-text-overflow :text="field.name || formatTitle(field.field)" :highlight="search" />
		</v-list-item-content>
	</v-list-item>
</template>

<script lang="ts">
export default {
	name: 'VFieldListItem',
};
</script>

<script lang="ts" setup>
import formatTitle from '@directus/format-title';
import { getFunctionsForType } from '@directus/shared/utils';
import { FieldNode } from '@/composables/use-field-tree';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type FieldInfo = FieldNode & {
	disabled?: boolean;
	children?: FieldInfo[];
};

interface Props {
	field: FieldInfo;
	search?: string;
	includeFunctions?: boolean;
	allowSelectAll?: boolean;
	disabledFields?: string[];
	relationalFieldSelectable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	search: undefined,
	includeFunctions: false,
	allowSelectAll: false,
	relationalFieldSelectable: true,
	disabledFields: () => [],
});

const emit = defineEmits(['add', 'select-field', 'select-all']);

const { t } = useI18n();

const supportedFunctions = computed(() => {
	if (!props.includeFunctions || props.field.group) return [];
	return getFunctionsForType(props.field.type);
});

const treeListOriginal = props.field?.children || [];
const disabledFields = props.disabledFields || [];

const treeList = computed(() => {
	const list = props.field?.children?.map(setDisabled) || [];
	return list;

	function setDisabled(
		field: typeof treeListOriginal.value[number]
	): typeof treeListOriginal.value[number] & { disabled: boolean } {
		let disabled = field.group || false;

		if (props.disabledFields?.includes(field.key)) disabled = true;

		return {
			...field,
			disabled,
			children: field.children?.map(setDisabled),
		};
	}
});

/*
const allChildFields = computed(() => {
	return treeList.value.flatMap(map(props.field.field));

	function map(parent?: string) {
		return function (field: FieldNode): string[] {
			if (field.children) {
				return field?.children?.flatMap(map(field.field)) || [];
			} else {
				return [parent ? `${parent}.${field.field}` : field.field];
			}
		};
	}
});
*/

function selectAll() {
	if (!props.field.children) return;
	const fields = props.field.children.filter((field) => !field.disabled).map((field) => `${props.field.field}.${field.field}`);
	const selectedFields = new Set([...(disabledFields ?? []), ...fields]);
	emit('select-all', Array.from(selectedFields));
}

function deselectAll() {
	const selectedFields = new Set([...(disabledFields ?? [])]);
	emit('select-all', Array.from(selectedFields));
}
</script>

<style lang="scss" scoped>
.functions {
	--v-icon-color: var(--primary);
	--v-list-item-color: var(--primary);
}
</style>
