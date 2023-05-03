<template>
	<div class="display-labels">
		<template v-if="!showAsDot">
			<v-chip
				v-for="item in items"
				:key="item.value"
				:style="{
					'--v-chip-color': item.foreground,
					'--v-chip-background-color': item.background,
				}"
				small
				disabled
				label
			>
				{{ item.text }}
			</v-chip>
		</template>
		<template v-else>
			<display-color v-for="item in items" :key="item.value" v-tooltip="item.text" :value="item.background" />
		</template>
	</div>
</template>

<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { isEmpty } from 'lodash';
import { computed } from 'vue';

type Choice = {
	value: string;
	text: string;
	foreground: string | null;
	background: string | null;
};

const props = withDefaults(
	defineProps<{
		value: string | string[];
		type: 'text' | 'string' | 'json' | 'csv';
		format?: boolean;
		showAsDot?: boolean;
		choices?: Choice[];
	}>(),
	{
		format: true,
		choices: () => [],
	}
);

const items = computed(() => {
	let items: string[];

	if (isEmpty(props.value)) items = [];
	else if (props.type === 'string') items = [props.value as string];
	else items = props.value as string[];

	return items.map((item) => {
		const choice = (props.choices || []).find((choice) => choice.value === item);

		let itemStringValue: string;

		if (typeof item === 'object') {
			itemStringValue = JSON.stringify(item);
		} else {
			if (props.format) {
				itemStringValue = formatTitle(item);
			} else {
				itemStringValue = item;
			}
		}

		if (choice === undefined) {
			return {
				value: item,
				text: itemStringValue,
				foreground: 'var(--foreground-normal)',
				background: 'var(--background-normal)',
			};
		} else {
			return {
				value: item,
				text: choice.text || itemStringValue,
				foreground: choice.foreground || 'var(--foreground-normal)',
				background: choice.background || 'var(--background-normal)',
			};
		}
	});
});
</script>

<style lang="scss" scoped>
.display-labels {
	display: inline-flex;
}

.v-chip + .v-chip {
	margin-left: 4px;
}
</style>
