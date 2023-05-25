<template>
	<v-list :mandatory="false" @toggle="loadFieldRelations($event.value)">
		<slot name="prepend" />
		<v-list-item v-if="fieldsCount > 20">
			<v-list-item-content>
				<v-input v-model="search" autofocus small :placeholder="t('search')" @click.stop>
					<template #append>
						<v-icon small name="search" />
					</template>
				</v-input>
			</v-list-item-content>
		</v-list-item>

		<template v-if="allowSelectAll">
			<v-list-item clickable :disabled="selectAllDisabled" @click="addAll">
				{{ t('select_all') }}
			</v-list-item>

			<v-divider />
		</template>

		<v-field-list-item
			v-for="fieldNode in treeList"
			:key="fieldNode.field"
			:field="fieldNode"
			:search="search"
			:include-functions="includeFunctions"
			:relational-field-selectable="relationalFieldSelectable"
			:allow-select-all="allowSelectAll"
			@add="$emit('add', $event)"
		/>
	</v-list>
</template>

<script setup lang="ts">
import { FieldNode, useFieldTree } from '@/composables/use-field-tree';
import { useFieldsStore } from '@/stores/fields';
import { Field } from '@directus/types';
import { debounce, isNil } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VFieldListItem from './v-field-list-item.vue';

interface Props {
	collection: string;
	field?: string;
	disabledFields?: string[];
	includeFunctions?: boolean;
	includeRelations?: boolean;
	relationalFieldSelectable?: boolean;
	allowSelectAll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	field: undefined,
	disabledFields: () => [],
	includeFunctions: false,
	includeRelations: true,
	relationalFieldSelectable: true,
	allowSelectAll: false,
});

const emit = defineEmits(['add']);

const fieldsStore = useFieldsStore();

const { collection, includeRelations } = toRefs(props);

const fieldsCount = computed(() => fieldsStore.getFieldsForCollection(collection.value)?.length ?? 0);

const search = ref('');

const { treeList: treeListOriginal, loadFieldRelations, refresh } = useFieldTree(collection, undefined, filter);

const debouncedRefresh = debounce(() => refresh(), 250);

watch(search, () => debouncedRefresh());

const { t } = useI18n();

const selectAllDisabled = computed(() => unref(treeList).every((field) => field.disabled === true));

const treeList = computed(() => {
	const list = treeListOriginal.value.map(setDisabled);

	if (props.field) return list.filter((fieldNode) => fieldNode.field === props.field);

	return list;

	function setDisabled(
		field: (typeof treeListOriginal.value)[number]
	): (typeof treeListOriginal.value)[number] & { disabled: boolean } {
		let disabled = field.group || false;

		if (props.disabledFields?.includes(field.key)) disabled = true;

		return {
			...field,
			disabled,
			children: field.children?.map(setDisabled),
		};
	}
});

const addAll = () => {
	const allFields = unref(treeList).map((field) => field.field);
	emit('add', unref(allFields));
};

function filter(field: Field, parent?: FieldNode): boolean {
	if (
		!includeRelations.value &&
		(field.collection !== collection.value || (field.type === 'alias' && !field.meta?.special?.includes('group')))
	) {
		return false;
	}

	if (!search.value || isNil(parent) === false) return true;

	const children = isNil(field.schema?.foreign_key_table)
		? fieldsStore.getFieldGroupChildren(field.collection, field.field)
		: fieldsStore.getFieldsForCollection(field.schema!.foreign_key_table);

	return children?.some((field) => matchesSearch(field)) || matchesSearch(field);

	function matchesSearch(field: Field) {
		return (
			field.field.toLowerCase().includes(search.value.toLowerCase()) ||
			field.name.toLowerCase().includes(search.value.toLowerCase())
		);
	}
}
</script>

<style lang="scss" scoped>
.v-list {
	--v-list-min-width: 300px;
}
</style>
