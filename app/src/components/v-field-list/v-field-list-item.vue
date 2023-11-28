<script setup lang="ts">
import { FieldNode } from '@/composables/use-field-tree';
import formatTitle from '@directus/format-title';
import { getFunctionsForType } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

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
	}>(),
	{
		search: undefined,
		includeFunctions: false,
		relationalFieldSelectable: true,
		allowSelectAll: false,
		parent: null,
		rawFieldNames: false,
	},
);

const emit = defineEmits(['add']);

const { t } = useI18n();

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
</script>

<template>
	<v-list-group
		v-if="field.children || supportedFunctions.length > 0"
		:clickable="!field.disabled && (relationalFieldSelectable || !field.relatedCollection)"
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
						:text="`${t(`functions.${fn}`)} (${rawFieldNames ? field.field : field.name || formatTitle(field.field)})`"
						:highlight="search"
					/>
				</v-list-item-content>
			</v-list-item>

			<v-divider v-if="field.children && field.children.length > 0" />
		</div>

		<template v-if="allowSelectAll">
			<v-list-item clickable :disabled="selectAllDisabled" @click="addAll">
				{{ t('select_all') }}
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
