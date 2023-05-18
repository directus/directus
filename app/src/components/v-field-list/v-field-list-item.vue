<template>
	<v-list-group
		v-if="field.children || supportedFunctions.length > 0"
		:clickable="!field.disabled && (relationalFieldSelectable || !field.relatedCollection)"
		:value="field.path"
		@click="$emit('add', [field.key])"
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
				@click="$emit('add', [`${fn}(${field.key})`])"
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
			@add="$emit('add', $event)"
		/>
	</v-list-group>

	<v-list-item v-else :disabled="field.disabled" clickable @click="$emit('add', [field.key])">
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

interface Props {
	field: FieldInfo;
	search?: string;
	includeFunctions?: boolean;
	relationalFieldSelectable?: boolean;
	allowSelectAll?: boolean;
	parent?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	search: undefined,
	includeFunctions: false,
	relationalFieldSelectable: true,
	allowSelectAll: false,
	parent: null,
});

const emit = defineEmits(['add']);

const { t } = useI18n();

const supportedFunctions = computed(() => {
	if (!props.includeFunctions || props.field.group) return [];
	return getFunctionsForType(props.field.type);
});

const selectAllDisabled = computed(() => props.field.children?.every((field: FieldInfo) => field.disabled === true));

const addAll = () => {
	if (!props.field.children) return;

	const selectedFields = props.field.children.map((selectableField) => {
		let res = `${props.field.field}.${selectableField.field}`;

		if (props.parent) {
			res = `${props.parent}.${res}`;
		}

		return res;
	});

	emit('add', selectedFields);
};
</script>

<style lang="scss" scoped>
.functions {
	--v-icon-color: var(--primary);
	--v-list-item-color: var(--primary);
}
</style>
