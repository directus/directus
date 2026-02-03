<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { isEmpty, isString } from 'lodash';
import { computed } from 'vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import DisplayColor from '@/displays/color/color.vue';

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
	else if (['integer', 'bigInteger', 'float', 'decimal'].includes(props.type)) items = [props.value as number];
	else if (isString(props.value)) items = [props.value as string];
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
			<VChip
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
				<VIcon v-if="item.icon" :name="item.icon" :color="item.color" left small />
				<DisplayColor v-else-if="item.color" class="inline-dot" :value="item.color" />
				{{ item.text }}
			</VChip>
		</template>
		<template v-else>
			<DisplayColor
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
	margin-inline-start: 4px;
}

.v-icon {
	flex-shrink: 0;
	vertical-align: -3px;
}

.inline-dot {
	padding: 0 4px;
	margin-inline-end: 4px;
}
</style>
