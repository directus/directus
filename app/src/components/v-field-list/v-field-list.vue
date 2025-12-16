<script setup lang="ts">
import { useFieldTree, type FieldNode } from '@/composables/use-field-tree';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { useFakeVersionField } from '@/composables/use-fake-version-field';
import { Field } from '@directus/types';
import { debounce, isNil } from 'lodash';
import { computed, ref, toRefs, unref, watch } from 'vue';
import VFieldListItem from './VFieldListItem.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VList from '@/components/v-list.vue';
import VListItem from '@/components/v-list-item.vue';
import VListItemContent from '@/components/v-list-item-content.vue';

const collectionsStore = useCollectionsStore();

const props = withDefaults(
	defineProps<{
		collection: string;
		field?: string;
		disabledFields?: string[];
		includeFunctions?: boolean;
		includeRelations?: boolean;
		injectVersionField?: boolean;
		relationalFieldSelectable?: boolean;
		allowSelectAll?: boolean;
		rawFieldNames?: boolean;
	}>(),
	{
		field: undefined,
		disabledFields: () => [],
		includeFunctions: false,
		includeRelations: true,
		injectVersionField: false,
		relationalFieldSelectable: true,
		allowSelectAll: false,
		rawFieldNames: false,
	},
);

const emit = defineEmits(['add']);

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const { collection, includeRelations } = toRefs(props);

const search = ref('');

const showSearch = computed(() => {
	const fields = fieldsStore.getFieldsForCollection(collection.value);
	if (!fields.length) return false;

	if (fields?.length > 10) return true;

	const anyGroupExists = fields.some((field) => field.meta?.group !== null);
	if (anyGroupExists) return true;

	const anyRelationExists = relationsStore.getRelationsForCollection(collection.value)?.length;
	if (anyRelationExists) return true;

	return false;
});

const collectionInfo = computed(() => collectionsStore.getCollection(collection.value));
const versioningEnabled = computed(() => Boolean(collectionInfo.value?.meta?.versioning && props.injectVersionField));
const { fakeVersionField } = useFakeVersionField(collection, versioningEnabled);

const injectFields = computed(() => {
	return fakeVersionField.value ? { fields: [fakeVersionField.value] } : null;
});

const { treeList: treeListOriginal, loadFieldRelations, refresh } = useFieldTree(collection, injectFields, filter);

const debouncedRefresh = debounce(() => refresh(), 250);

watch(search, () => debouncedRefresh());

const selectAllDisabled = computed(() => unref(treeList).every((field) => field.disabled === true));

const treeList = computed(() => {
	const list = treeListOriginal.value.map(setDisabled);

	if (props.field) return list.filter((fieldNode) => fieldNode.field === props.field);

	return list;

	function setDisabled(
		field: (typeof treeListOriginal.value)[number],
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

	if (!search.value) {
		return true;
	}

	const children = isNil(field.schema?.foreign_key_table)
		? fieldsStore.getFieldGroupChildren(field.collection, field.field)
		: fieldsStore.getFieldsForCollection(field.schema!.foreign_key_table);

	return children?.some(matchesInNestedGroups) || matchesSearch(field) || (!!parent && matchesSearch(parent));

	function matchesSearch(field: Field | FieldNode) {
		return field.name.toLowerCase().includes(search.value.toLowerCase());
	}

	function matchesInNestedGroups(field: Field) {
		const groupChildren = fieldsStore.getFieldGroupChildren(field.collection, field.field);

		if (groupChildren?.some(matchesInNestedGroups)) return true;

		const isRelationalFieldOfRootCollection =
			!isNil(field.schema?.foreign_key_table) && field.collection === props.collection;

		const relationalChildren = isRelationalFieldOfRootCollection
			? fieldsStore.getFieldsForCollection(field.schema!.foreign_key_table!)
			: null;

		return relationalChildren?.some((field) => matchesSearch(field)) || matchesSearch(field);
	}
}
</script>

<template>
	<VList :mandatory="false" @toggle="loadFieldRelations($event.value)">
		<slot name="prepend" />
		<VListItem v-if="showSearch">
			<VListItemContent>
				<VInput v-model="search" autofocus small :placeholder="$t('search')" @click.stop>
					<template #append>
						<VIcon small name="search" />
					</template>
				</VInput>
			</VListItemContent>
		</VListItem>

		<template v-if="allowSelectAll">
			<VListItem clickable :disabled="selectAllDisabled" @click="addAll">
				{{ $t('select_all') }}
			</VListItem>

			<VDivider />
		</template>

		<VFieldListItem
			v-for="fieldNode in treeList"
			:key="fieldNode.field"
			:field="fieldNode"
			:search="search"
			:include-functions="includeFunctions"
			:relational-field-selectable="relationalFieldSelectable"
			:allow-select-all="allowSelectAll"
			:raw-field-names="rawFieldNames"
			@add="$emit('add', $event)"
		/>
	</VList>
</template>

<style lang="scss" scoped>
.v-list {
	--v-list-min-width: 300px;
}
</style>
