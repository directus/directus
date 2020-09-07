<template>
	<div class="display-tags">
		<v-chip v-for="item in items" :key="item.value" :style="getStyles(item)" small disabled label>
			{{ getText(item) }}
		</v-chip>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import formatTitle from '@directus/format-title';

type Choice = {
	value: string;
	text?: string;
	foreground?: string | null;
	background?: string | null;
};

export default defineComponent({
	props: {
		value: {
			type: String || (Array as PropType<string[]>),
			required: true,
		},
		format: {
			type: Boolean,
			default: true,
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
	},
	setup(props) {
		const items = computed(() => {
			let items: string[];
			if (typeof props.value === 'string') {
				if (props.value === null) return [];
				items = [props.value];
			} else {
				items = props.value;
			}

			return items.map((item) => {
				const choise = props.choices.find((choise) => choise.value === item);
				if (choise === undefined) {
					return {
						value: item,
					};
				} else {
					return choise;
				}
			});
		});

		function getStyles(item: Choice) {
			return {
				'--v-chip-color': item?.foreground || props.defaultForeground,
				'--v-chip-background-color': item?.background || props.defaultBackground,
			};
		}

		function getText(item: Choice) {
			if (item.text === undefined) {
				return props.format ? formatTitle(item.value) : item.value;
			} else {
				return props.format ? formatTitle(item.text) : item.text;
			}
		}

		return { getStyles, items, getText };
	},
});
</script>

<style lang="scss" scoped>
.display-tags {
	display: inline-block;
}

.v-chip + .v-chip {
	margin-left: 4px;
}
</style>
