<template>
	<value-null v-if="displayValue === null || displayValue === undefined" />

	<div v-else class="display-formatted">
		<v-icon v-if="format.iconLeft" class="left" :name="format.iconLeft" :color="format.iconLeftColor" small />

		<span class="value" :class="[{ bold }, font]" :style="valueStyle">{{ prefix }}{{ displayValue }}{{ suffix }}</span>

		<v-icon v-if="format.iconRight" class="right" :name="format.iconRight" :color="format.iconRightColor" small />

		<a v-if="link" class="link" :href="href" :target="target" @click.stop>
			<v-icon v-tooltip="t('displays.formatted-value.link_tooltip')" class="button" name="launch" small />
		</a>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import formatTitle from '@directus/format-title';
import { validatePayload } from '@directus/shared/utils';
import { parseFilter } from '@/utils/parse-filter';
import { decode } from 'html-entities';
import { useI18n } from 'vue-i18n';
import { isNil } from 'lodash';

export default defineComponent({
	props: {
		item: {
			type: Object,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Number],
			default: null,
		},
		bold: {
			type: Boolean,
			default: false,
		},
		font: {
			type: String,
			default: 'sans-serif',
			validator: (value: string) => ['sans-serif', 'serif', 'monospace'].includes(value),
		},
		color: {
			type: String,
			default: null,
		},
		iconLeft: {
			type: String,
			default: null,
		},
		iconLeftColor: {
			type: String,
			default: null,
		},
		iconRight: {
			type: String,
			default: null,
		},
		iconRightColor: {
			type: String,
			default: null,
		},
		prefix: {
			type: String,
			default: null,
		},
		suffix: {
			type: String,
			default: null,
		},
		formatRules: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		formatTitle: {
			type: Boolean,
			default: false,
		},
		link: {
			type: Boolean,
			default: false,
		},
		linkTemplate: {
			type: String,
			default: '{{value}}',
		},
	},
	setup(props) {
		const { t, n } = useI18n();

		const matchedRules = computed(() => {
			return (props.formatRules || []).filter((formatRule) => {
				if (!formatRule.rule || Object.keys(formatRule.rule).length !== 1) return;
				const rule = parseFilter(formatRule.rule);
				const errors = validatePayload(rule, props.item, { requireAll: true });
				return errors.length === 0;
			});
		});

		const format = computed(() => {
			const { color, iconLeft, iconLeftColor, iconRight, iconRightColor } = props;
			return matchedRules.value.reduce((format, rule) => Object.assign({}, format, rule), {
				color,
				iconLeft,
				iconLeftColor,
				iconRight,
				iconRightColor,
			});
		});

		const valueStyle = computed(() => {
			return { color: format.value.color };
		});

		const displayValue = computed(() => {
			if (isNil(props.value) || props.value === '') return null;

			if (['integer', 'bigInteger', 'float', 'decimal'].includes(props.type)) {
				const hasDecimals = ['float', 'decimal'].includes(props.type);

				const { value } = props;
				const number = hasDecimals ? parseFloat(value.toString()) : parseInt(value.toString());

				return n(number);
			}

			let value = String(props.value);

			// Strip out all HTML tags
			value = value.replace(/(<([^>]+)>)/gi, '');

			// Decode any HTML encoded characters (like &copy;)
			value = decode(value);

			if (props.formatTitle) {
				value = formatTitle(value);
			}

			return value;
		});

		const href = computed(() => {
			if (isNil(props.value) || props.value === '' || !props.link) return null;

			return props.linkTemplate.replace(/({{\s*value\s*}})/g, props.value.toString());
		});

		const target = computed(() => {
			if (isNil(href.value) || href.value === '') return null;
			if (href.value[0] === '/') return '_self';
			else return '_blank';
		});

		return { t, format, displayValue, href, target, valueStyle };
	},
});
</script>

<style lang="scss" scoped>
.display-formatted {
	display: flex;
	flex-grow: 1;
	align-items: center;
	overflow: hidden;

	& .value {
		flex-shrink: 1;
		overflow: hidden;
		line-height: 1;
		white-space: nowrap;
		text-overflow: ellipsis;

		&.bold {
			color: var(--foreground-normal-alt);
			font-weight: 700;
		}

		&.sans-serif {
			font-family: var(--family-sans-serif);
		}

		&.serif {
			font-family: var(--family-serif);
		}

		&.monospace {
			font-family: var(--family-monospace);
		}
	}

	.v-icon {
		flex-shrink: 0;

		&.left {
			margin-right: 2px;
		}

		&.right {
			margin-left: 2px;
		}

		&.button {
			margin-left: 4px;
			color: var(--foreground-subdued);
			transition: color var(--fast) var(--transition);

			&:hover {
				color: var(--green-75);
			}
		}
	}
}

@media (hover: hover) {
	.display-formatted .v-icon.button {
		display: none;
	}

	.display-formatted:hover .v-icon.button {
		display: block;
	}
}
</style>
