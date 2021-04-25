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
			<display-color
				v-for="item in items"
				:key="item.value"
				:value="item.background"
				:default-color="defaultBackground"
				v-tooltip="item.text"
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import formatTitle from '@directus/format-title';

type Choice = {
	value: string;
	text: string;
	foreground: string | null;
	background: string | null;
};

export default defineComponent({
	props: {
		value: {
			type: [String, Array] as PropType<string | string[]>,
			required: true,
		},
		format: {
			type: Boolean,
			default: true,
		},
		showAsDot: {
			type: Boolean,
			default: false,
		},
		choices: {
			type: Array as PropType<Choice[]>,
			default: () => [],
		},
		defaultBackground: {
			type: String,
			default: '#eceff1',
		},
		defaultForeground: {
			type: String,
			default: '#263238',
		},
		type: {
			type: String,
			validator: (val: string) => ['text', 'string', 'json', 'csv'].includes(val),
		},
	},
	setup(props) {
		const items = computed(() => {
			let items: string[];

			if (props.value === null) items = [];
			else if (props.type === 'string') items = [props.value as string];
			else items = props.value as string[];

			return items.map((item) => {
				const choice = (props.choices || []).find((choice) => choice.value === item);

				if (choice === undefined) {
					return {
						value: item,
						text: props.format ? formatTitle(item) : item,
						foreground: props.defaultForeground,
						background: props.defaultBackground,
					};
				} else {
					return {
						value: item,
						text: choice.text || (props.format ? formatTitle(item) : item),
						foreground: choice.foreground || props.defaultForeground,
						background: choice.background || props.defaultBackground,
					};
				}
			});
		});

		return { items };
	},
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
