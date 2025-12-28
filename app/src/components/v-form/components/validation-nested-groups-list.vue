<script setup lang="ts">
import ValidationNestedGroupsList from './validation-nested-groups-list.vue';
export type RenderItem =
	| {
			kind: 'rule';
			text: string;
	  }
	| {
			kind: 'group';
			logic: 'and' | 'or';
			labelPrefix: string;
			labelSuffix: string;
			children?: RenderItem[];
	  };

defineOptions({ name: 'ValidationNestedGroupsList' });

const props = defineProps<{
	items: RenderItem[];
	depth: number;
	listLogic?: 'and' | 'or';
}>();
</script>

<template>
	<ul
		:class="['group-list', props.listLogic === 'or' ? 'logic-or' : 'logic-and']"
		:style="{
			listStyleType: (props.listLogic ?? 'and') === 'and' ? 'disc' : 'square',
			listStylePosition: 'outside',
			paddingInlineStart: props.depth === 0 ? '22px' : '18px',
		}"
	>
		<li v-for="(item, idx) in props.items" :key="idx" class="group-item">
			<span class="rule">
				<template v-if="item.kind === 'group'">
					<span class="group-prefix">{{ item.labelPrefix }}</span>
					{{ item.labelSuffix }}
				</template>
				<template v-else>
					{{ item.text }}
				</template>
			</span>
			<ValidationNestedGroupsList
				v-if="item.kind === 'group' && item.children && item.children.length > 0"
				:items="item.children"
				:depth="props.depth + 1"
				:list-logic="item.logic"
			/>
		</li>
	</ul>
</template>

<style lang="scss" scoped>
.group-list {
	margin: 0;
}

.group-item {
	margin-block-end: 0;
	line-height: 1.25;
}

.group-item + .group-item {
	margin-block-start: var(--validation-errors-line-gap, 4px);
}

.group-item > .group-list {
	margin-block-start: var(--validation-errors-line-gap, 4px);
}

.group-prefix {
	text-transform: uppercase;
}
</style>
