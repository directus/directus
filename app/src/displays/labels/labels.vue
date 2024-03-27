<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { isEmpty } from 'lodash';
import { computed } from 'vue';

type Choice = {
	value: string | number;
	text: string;
	icon?: string;
	color?: string;
	foreground: string | null;
	background: string | null;
};

const props = withDefaults(
	defineProps<{
		value: string | number | string[] | number[];
		type: 'text' | 'string' | 'json' | 'csv' | 'integer' | 'bigInteger' | 'float' | 'decimal';
		format?: boolean;
		showAsDot?: boolean;
		choices?: Choice[];
	}>(),
	{
		format: true,
		choices: () => [],
	},
);

const items = computed(() => {
	let items: string[] | number[];

	if (isEmpty(props.value) && isNaN(props.value as number)) items = [];
	else if (props.type === 'string') items = [props.value as string];
	else if (['integer', 'bigInteger', 'float', 'decimal'].includes(props.type)) items = [props.value as number];
	else items = props.value as string[];

	return items.map((item) => {
		const choice = (props.choices || []).find((choice) => choice.value === item);

		let itemStringValue: string;

		if (typeof item === 'object') {
			itemStringValue = JSON.stringify(item);
		} else {
			if (props.format && isNaN(item as any)) {
				itemStringValue = formatTitle(item as string);
			} else {
				itemStringValue = item as string;
			}
		}

		if (choice === undefined) {
			return {
				value: item,
				text: itemStringValue,
				foreground: 'var(--theme--foreground)',
				background: 'var(--theme--background-normal)',
			};
		} else {
			return {
				value: item,
				text: choice.text || itemStringValue,
				icon: choice.icon,
				color: choice.color,
				foreground: choice.foreground || 'var(--theme--foreground)',
				background: choice.background || 'var(--theme--background-normal)',
			};
		}
	});
});
</script>

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
				:class="{ 'has-icon': !!item.icon || !!item.color }"
			>
				<v-icon v-if="item.icon" :name="item.icon" :color="item.color" left small />
				<display-color v-else-if="item.color" class="inline-dot" :value="item.color" />
				{{ item.text }}
			</v-chip>
		</template>
		<template v-else>
			<display-color
				v-for="item in items"
				:key="item.value"
				v-tooltip="item.text"
				:value="item.color ?? item.background"
			/>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.display-labels {
	display: inline-flex;
}

.has-icon {
	--v-chip-padding: 0 8px 0 4px;
}

.v-chip + .v-chip {
	margin-left: 4px;
}

.v-icon {
	flex-shrink: 0;
	vertical-align: -3px;
}

.inline-dot {
	padding: 0 4px;
	margin-right: 4px;
}
</style>
