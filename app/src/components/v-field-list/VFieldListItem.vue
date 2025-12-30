<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { FieldNode } from '@/composables/use-field-tree';
import formatTitle from '@directus/format-title';
import { getFunctionsForType } from '@directus/utils';
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

const supportedFunctions = computed(() => {
	if (!props.includeFunctions || props.field.group) return [];
	return getFunctionsForType(props.field.type);
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
	<VListGroup
		v-if="field.children || supportedFunctions.length > 0"
		:clickable="!field.disabled && (relationalFieldSelectable || !field.relatedCollection)"
		:open="openWhileSearching"
		:collapse-on-change="search"
		:value="field.path"
		:class="{ 'raw-field-names': rawFieldNames }"
		@click="$emit('add', [field.key])"
	>
		<template #activator>
			<VListItemContent>
				<VTextOverflow
					:text="rawFieldNames ? field.field : field.name || formatTitle(field.field)"
					:highlight="search"
				/>
			</VListItemContent>
		</template>

		<div v-if="supportedFunctions.length > 0" class="functions">
			<VListItem
				v-for="fn of supportedFunctions"
				:key="fn"
				:disabled="field.disabled"
				clickable
				@click="$emit('add', [`${fn}(${field.key})`])"
			>
				<VListItemIcon>
					<VIcon name="auto_awesome" small color="var(--theme--primary)" />
				</VListItemIcon>
				<VListItemContent>
					<VTextOverflow
						:text="`${$t(`functions.${fn}`)} (${rawFieldNames ? field.field : field.name || formatTitle(field.field)})`"
						:highlight="search"
					/>
				</VListItemContent>
			</VListItem>

			<VDivider v-if="field.children && field.children.length > 0" />
		</div>

		<template v-if="allowSelectAll">
			<VListItem clickable :disabled="selectAllDisabled" @click="addAll">
				{{ $t('select_all') }}
			</VListItem>

			<VDivider />
		</template>

		<VFieldListItem
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
	</VListGroup>

	<VListItem
		v-else
		:disabled="field.disabled"
		:class="{ 'raw-field-names': rawFieldNames }"
		clickable
		@click="$emit('add', [field.key])"
	>
		<VListItemIcon v-if="field.field.startsWith('$')">
			<VIcon name="auto_awesome" small color="var(--theme--primary)" />
		</VListItemIcon>
		<VListItemContent>
			<VTextOverflow :text="rawFieldNames ? field.field : field.name || formatTitle(field.field)" :highlight="search" />
		</VListItemContent>
	</VListItem>
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
