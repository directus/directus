<script setup lang="ts">
import formatTitle from '@directus/format-title';
import dompurify from 'dompurify';
import { decode } from 'html-entities';
import { isNil } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		type: string;
		value?: string | number | (string | number)[];
		format?: boolean;
		font?: 'sans-serif' | 'serif' | 'monospace';
		bold?: boolean;
		italic?: boolean;
		prefix?: string;
		suffix?: string;
		color?: string;
		background?: string;
		icon?: string;
		border?: boolean;
		masked?: boolean;
		translate?: boolean;
		conditionalFormatting?: {
			operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'starts_with' | 'ends_with';
			value: string;
			color: string;
			background: string;
			text: string;
			icon: string;
		}[];
	}>(),
	{
		font: 'sans-serif',
		conditionalFormatting: () => [],
	},
);

const { t, n } = useI18n();

const matchedConditions = computed(() =>
	(props.conditionalFormatting || []).filter(({ operator, value }) => {
		if (['string', 'text'].includes(props.type)) {
			const left = String(props.value);
			const right = String(value);
			return matchString(left, right, operator);
		} else if (['float', 'decimal'].includes(props.type)) {
			const left = parseFloat(String(props.value));
			const right = parseFloat(String(value));
			return matchNumber(left, right, operator);
		} else {
			const left = parseInt(String(props.value));
			const right = parseInt(String(value));
			return matchNumber(left, right, operator);
		}
	}),
);

const computedFormat = computed(() => {
	const { color, background, icon } = props;

	return matchedConditions.value.reduce(
		({ color, background, icon, text }, format) => ({
			color: format.color || color,
			background: format.background || background,
			icon: format.icon || icon,
			text: format.text || text,
		}),
		{
			color,
			background,
			icon,
			text: '',
		},
	);
});

const computedStyle = computed(() => {
	return {
		color: computedFormat.value.color,
		borderStyle: 'solid',
		borderWidth: props.border ? '2px' : 0,
		borderColor: computedFormat.value.color,
		backgroundColor: computedFormat.value.background ?? 'transparent',
	};
});

const displayValue = computed(() => {
	if (props.masked) return '**********';

	if (computedFormat.value.text) {
		const { text } = computedFormat.value;
		return text.startsWith('$t:') ? t(text.slice(3)) : text;
	}

	if (isNil(props.value) || props.value === '') return null;

	let value = String(props.value);

	if (props.translate && value.startsWith('$t:')) {
		value = t(value.slice(3));
	}

	// Strip out all HTML tags
	value = dompurify.sanitize(value, { ALLOWED_TAGS: [] });

	// Decode any HTML encoded characters (like &copy;)
	value = decode(value);

	if (props.format) {
		if (['string', 'text'].includes(props.type)) {
			value = formatTitle(value);
		} else if (['float', 'decimal'].includes(props.type)) {
			value = n(parseFloat(value));
		} else {
			value = n(parseInt(value));
		}
	}

	const prefix = props.prefix ?? '';
	const suffix = props.suffix ?? '';

	return `${prefix}${value}${suffix}`;
});

function matchString(left: string, right: string, operator: string) {
	switch (operator) {
		case 'eq':
			return left === right;
		case 'neq':
			return left !== right;
		case 'contains':
			return left.includes(right);
		case 'starts_with':
			return left.startsWith(right);
		case 'ends_with':
			return left.endsWith(right);
	}

	return;
}

function matchNumber(left: number, right: number, operator: string) {
	switch (operator) {
		case 'eq':
			return left === right;
		case 'neq':
			return left !== right;
		case 'gt':
			return left > right;
		case 'gte':
			return left >= right;
		case 'lt':
			return left < right;
		case 'lte':
			return left <= right;
	}

	return;
}
</script>

<template>
	<value-null v-if="displayValue === null || displayValue === undefined" />

	<div
		v-else
		class="display-formatted"
		:class="[
			{ bold, italic },
			font,
			{ 'has-background': computedFormat.background, 'has-border': computedStyle.borderWidth !== 0 },
		]"
		:style="computedStyle"
	>
		<v-icon v-if="computedFormat.icon" :name="computedFormat.icon" :color="computedFormat.color" left small />

		<span class="value">
			{{ displayValue }}
		</span>
	</div>
</template>

<style lang="scss" scoped>
.display-formatted {
	display: inline;
	overflow: hidden;
	text-overflow: ellipsis;

	&.has-background,
	&.has-border {
		height: 28px;
		padding: 0 10px;
		font-size: 14px;
		line-height: 28px;
		border-radius: 24px;
	}

	&.has-border {
		line-height: 26px;
	}

	&.bold {
		color: var(--theme--foreground-accent);
		font-weight: 700;
	}

	&.italic {
		font-style: italic;
	}

	&.sans-serif {
		font-family: var(--theme--fonts--sans--font-family);
	}

	&.serif {
		font-family: var(--theme--fonts--serif--font-family);
	}

	&.monospace {
		font-family: var(--theme--fonts--monospace--font-family);
	}

	.v-icon {
		flex-shrink: 0;
		vertical-align: -3px;
	}
}
</style>
