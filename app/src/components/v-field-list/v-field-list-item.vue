<script setup lang="ts">
import { FieldNode } from '@/composables/use-field-tree';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import formatTitle from '@directus/format-title';
import { getFunctionsForType, getRelationType } from '@directus/utils';
import { computed } from 'vue';

type FieldInfo = FieldNode & {
	disabled?: boolean;
	children?: FieldInfo[];
};

const props = withDefaults(
	defineProps<{
		field: FieldInfo;
		search?: string;
		includeFunctions?: boolean;
		relationalFieldSelectable?: boolean;
		allowSelectAll?: boolean;
		parent?: string | null;
		rawFieldNames?: boolean;
		parentOpen?: boolean;
	}>(),
	{
		search: undefined,
		includeFunctions: false,
		relationalFieldSelectable: true,
		allowSelectAll: false,
		parent: null,
		rawFieldNames: false,
		parentOpen: true,
	},
);

const emit = defineEmits(['add']);

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const supportedFunctions = computed(() => {
	if (!props.includeFunctions || props.field.group) return [];
	return getFunctionsForType(props.field.type);
});

// Check if field is o2m or m2m for _none support
const isNoneSupported = computed(() => {
	if (!props.field.relatedCollection || props.field.group) return false;

	const field = fieldsStore.getField(props.field.collection, props.field.field);
	if (!field || field.type !== 'alias') return false;

	const relations = relationsStore.getRelationsForField(props.field.collection, props.field.field);
	if (!relations[0]) return false;

	const relationType = getRelationType({
		relation: relations[0],
		collection: props.field.collection,
		field: props.field.field,
	});

	return relationType === 'o2m' || relationType === 'm2a';
});

const selectAllDisabled = computed(() => props.field.children?.every((field: FieldInfo) => field.disabled === true));

const addAll = () => {
	if (!props.field.children) return;

	const selectedFields = props.field.children.map((selectableField) => selectableField.key);

	emit('add', selectedFields);
};

const openWhileSearching = computed(() => {
	return !!props.search && props.parentOpen && !!props.field.group;
});
</script>

<template>
	<v-list-group
		v-if="field.children || supportedFunctions.length > 0"
		:clickable="!field.disabled && (relationalFieldSelectable || !field.relatedCollection)"
		:open="openWhileSearching"
		:collapse-on-change="search"
		:value="field.path"
		:class="{ 'raw-field-names': rawFieldNames }"
		@click="$emit('add', [field.key])"
	>
		<template #activator>
			<v-list-item-content>
				<v-text-overflow
					:text="rawFieldNames ? field.field : field.name || formatTitle(field.field)"
					:highlight="search"
				/>
			</v-list-item-content>
		</template>

		<div v-if="supportedFunctions.length > 0" class="functions">
			<v-list-item
				v-for="fn of supportedFunctions"
				:key="fn"
				:disabled="field.disabled"
				clickable
				@click="$emit('add', [`${fn}(${field.key})`])"
			>
				<v-list-item-icon>
					<v-icon name="auto_awesome" small color="var(--theme--primary)" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow
						:text="`${$t(`functions.${fn}`)} (${rawFieldNames ? field.field : field.name || formatTitle(field.field)})`"
						:highlight="search"
					/>
				</v-list-item-content>
			</v-list-item>

			<v-divider v-if="isNoneSupported || (field.children && field.children.length > 0)" />
		</div>

		<template v-if="isNoneSupported">
			<v-list-item :disabled="field.disabled" clickable @click="$emit('add', [`$none:${field.key}`])">
				<v-list-item-icon>
					<v-icon name="close" small color="var(--theme--danger)" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow
						:text="`${t('interfaces.filter.none')} (${rawFieldNames ? field.field : field.name || formatTitle(field.field)})`"
						:highlight="search"
					/>
				</v-list-item-content>
			</v-list-item>
			<v-divider v-if="field.children && field.children.length > 0" />
		</template>

		<template v-if="allowSelectAll">
			<v-list-item clickable :disabled="selectAllDisabled" @click="addAll">
				{{ $t('select_all') }}
			</v-list-item>

			<v-divider />
		</template>

		<v-field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:field="childField"
			:search="search"
			:include-functions="includeFunctions"
			:relational-field-selectable="relationalFieldSelectable"
			:parent="field.field"
			:allow-select-all="allowSelectAll"
			:raw-field-names="rawFieldNames"
			:parent-open="openWhileSearching"
			@add="$emit('add', $event)"
		/>
	</v-list-group>

	<v-list-item
		v-else
		:disabled="field.disabled"
		:class="{ 'raw-field-names': rawFieldNames }"
		clickable
		@click="$emit('add', [field.key])"
	>
		<v-list-item-icon v-if="field.field.startsWith('$')">
			<v-icon name="auto_awesome" small color="var(--theme--primary)" />
		</v-list-item-icon>
		<v-list-item-content>
			<v-text-overflow
				:text="rawFieldNames ? field.field : field.name || formatTitle(field.field)"
				:highlight="search"
			/>
		</v-list-item-content>
	</v-list-item>
</template>

<style lang="scss" scoped>
.functions {
	--v-icon-color: var(--theme--primary);
	--v-list-item-color: var(--theme--primary);
}

.raw-field-names {
	--v-list-item-content-font-family: var(--theme--fonts--monospace--font-family);
}
</style>
