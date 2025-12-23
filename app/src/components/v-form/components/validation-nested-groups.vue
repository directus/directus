<script setup lang="ts">
import type { ValidationNode } from '@/utils/format-validation-structure';
import { formatValidationRule } from '@/utils/format-validation-structure';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ValidationNestedGroupsList, { type RenderItem } from './validation-nested-groups-list.vue';

interface Props {
	node: ValidationNode;
	depth?: number;
}

const props = withDefaults(defineProps<Props>(), {
	depth: 0,
});

const { t } = useI18n();

function groupLabel(type: 'and' | 'or') {
	return {
		prefix: type === 'and' ? t('interfaces.filter.all') : t('interfaces.filter.any'),
		suffix: t('interfaces.filter.of_the_following'),
	};
}

function renderRule(node: ValidationNode) {
	return formatValidationRule(node, t);
}

function buildItems(node: ValidationNode): RenderItem[] {
	if (node.type === 'rule') {
		return [
			{
				kind: 'rule',
				text: renderRule(node),
			},
		];
	}

	if ((node.type !== 'and' && node.type !== 'or') || !node.children?.length) return [];

	if (node.children.length === 1 && node.children[0]?.type === node.type) {
		return buildItems(node.children[0]);
	}

	const label = groupLabel(node.type);

	return [
		{
			kind: 'group',
			labelPrefix: label.prefix,
			labelSuffix: label.suffix,
			logic: node.type,
			children: node.children.flatMap((child) => buildItems(child)),
		},
	];
}

const items = computed(() => {
	return buildItems(props.node);
});
</script>

<template>
	<div class="validation-nested-groups">
		<ValidationNestedGroupsList
			:items="items"
			:depth="props.depth"
			:list-logic="props.node.type === 'and' || props.node.type === 'or' ? props.node.type : undefined"
		/>
	</div>
</template>

<style lang="scss" scoped>
.validation-nested-groups {
	margin-block-start: 4px;
	margin-inline-start: 0;
	color: var(--theme--danger);
}
</style>
