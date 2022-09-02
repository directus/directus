<template>
	<v-list-group
		v-if="field.children || supportedFunctions.length > 0"
		:clickable="!field.disabled"
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

		<v-field-list-item
			v-for="childField in field.children"
			:key="childField.key"
			:field="childField"
			:search="search"
			:include-functions="includeFunctions"
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
}

const props = withDefaults(defineProps<Props>(), {
	search: undefined,
	includeFunctions: false,
});

defineEmits(['add']);

const { t } = useI18n();

const supportedFunctions = computed(() => {
	if (!props.includeFunctions || props.field.group) return [];
	return getFunctionsForType(props.field.type);
});
</script>

<style lang="scss" scoped>
.functions {
	--v-icon-color: var(--primary);
	--v-list-item-color: var(--primary);
}
</style>
