<template>
	<value-null v-if="displayValue === null || displayValue === undefined" />

	<div v-else class="display-formatted" :style="displayStyle">
		<v-icon v-if="format.iconLeft" class="left" :name="format.iconLeft" :color="format.iconLeftColor" small />

		<a
			v-if="link"
			class="link"
			:href="href"
			:class="[{ bold }, font]"
			:style="valueStyle"
			:target="linkTarget"
			@click.stop
		>
			{{ displayValue }}
		</a>

		<span v-else class="value" :class="[{ bold }, font]" :style="valueStyle">
			{{ displayValue }}
		</span>

		<v-icon v-if="format.iconRight" class="right" :name="format.iconRight" :color="format.iconRightColor" small />

		<v-icon
			v-if="clipboard"
			v-tooltip="t('displays.formatted-value.clipboard_tooltip')"
			class="button"
			name="copy"
			small
			@click.stop="copyValue"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import formatTitle from '@directus/format-title';
import { decode } from 'html-entities';
import { useI18n } from 'vue-i18n';
import { isNil } from 'lodash';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Number],
			default: null,
		},
		textAlign: {
			type: String,
			default: 'left',
			validator: (value: string) => ['left', 'center', 'right'].includes(value),
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
		backgroundColor: {
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
			type: String,
			default: '',
		},
		linkText: {
			type: String,
			default: '',
		},
		linkTarget: {
			type: String,
			default: '',
		},
		linkEmailSubject: {
			type: String,
			default: '',
		},
		linkEmailBody: {
			type: String,
			default: '',
		},
		linkEmailCC: {
			type: String,
			default: '',
		},
		linkEmailBCC: {
			type: String,
			default: '',
		},
		linkWhatsappText: {
			type: String,
			default: '',
		},
		clipboard: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const { t, locale } = useI18n();

		const matchedRules = computed(() => {
			const leftValue = parseFloat(props.value.toString());
			return (props.formatRules || []).filter((rule) => {
				const rightValue = parseFloat(rule.value);
				switch (rule.operator) {
					case 'lt':
						return leftValue < rightValue;
					case 'lte':
						return leftValue <= rightValue;
					case 'gt':
						return leftValue > rightValue;
					case 'gte':
						return leftValue >= rightValue;
					case 'eq':
						return leftValue == rightValue;
					case 'neq':
						return leftValue != rightValue;
				}
				return false;
			});
		});

		const format = computed(() => {
			const { color, backgroundColor, iconLeft, iconLeftColor, iconRight, iconRightColor } = props;
			return matchedRules.value.reduce((format, rule) => Object.assign({}, format, rule), {
				color,
				backgroundColor,
				iconLeft,
				iconLeftColor,
				iconRight,
				iconRightColor,
			});
		});

		const displayStyle = computed(() => {
			const justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[props.textAlign];
			const alignItems = 'center';
			return { justifyContent, alignItems };
		});

		const valueStyle = computed(() => {
			return { color: format.value.color };
		});

		const displayValue = computed(() => {
			if (isNil(props.value) || props.value === '') return null;

			if (['integer', 'bigInteger', 'float', 'decimal'].includes(props.type)) {
				const hasDecimals = ['float', 'decimal'].includes(props.type);
				const options = hasDecimals ? { minimumFractionDigits: 2 } : {};
				const format = new Intl.NumberFormat(locale.value, options).format;

				const { prefix, value, suffix } = props;
				const number = hasDecimals ? parseFloat(value.toString()) : parseInt(value.toString());

				return `${prefix || ''}${format(number)}${suffix || ''}`;
			}

			let value = String(props.value);

			if (props.link) {
				return props.linkText || value;
			}

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
			if (props.link === 'url') {
				return props.value;
			} else if (props.link === 'email') {
				const params = Object.entries({
					subject: props.linkEmailSubject,
					body: props.linkEmailBody,
					cc: props.linkEmailCC,
					bcc: props.linkEmailBCC,
				})
					.filter(([_, value]) => value)
					.map(([param, value]) => `${param}=${encodeURIComponent(value)}`);

				return `mailto:${props.value}?${params.join('&')}`;
			} else if (props.link === 'tel') {
				return `tel:${props.value}`;
			} else if (props.link === 'whatsapp') {
				return `https://wa.me/${props.value}?text=${encodeURIComponent(props.linkWhatsappText)}`;
			} else {
				return '#';
			}
		});

		return { t, format, displayValue, href, displayStyle, valueStyle, copyValue };

		function copyValue() {
			navigator.clipboard.writeText(props.value.toString());
		}
	},
});
</script>

<style lang="scss" scoped>
.display-formatted {
	display: flex;
	flex-grow: 1;
	overflow: hidden;
	line-height: 1;
	white-space: nowrap;
	text-overflow: ellipsis;

	& .value,
	& .link {
		&.bold {
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

	.link {
		color: var(--primary-110);
		font-weight: 500;
		text-decoration: none;
	}

	.v-icon {
		&.left {
			flex-shrink: 0;
			margin-right: 2px;
		}

		&.right {
			flex-shrink: 0;
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
</style>
