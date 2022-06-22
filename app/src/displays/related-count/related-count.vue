<template>
	<div
			class="display-related-count"
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

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import ValueNull from '@/views/private/components/value-null';
import { useI18n } from 'vue-i18n';
import { get } from 'lodash';

export default defineComponent({
	components: { ValueNull },
	props: {
		field: String,
		rootItem: Object as PropType<Record<string, any>>,
	  format: {
		  type: Boolean,
		  default: false,
	  },
	  font: {
		  type: String,
		  default: 'sans-serif',
		  validator: (value: string) => ['sans-serif', 'serif', 'monospace'].includes(value),
	  },
	  bold: {
		  type: Boolean,
		  default: false,
	  },
	  italic: {
		  type: Boolean,
		  default: false,
	  },
	  prefix: {
		  type: String,
		  default: null,
	  },
	  suffix: {
		  type: String,
		  default: null,
	  },
	  color: {
		  type: String,
		  default: null,
	  },
	  background: {
		  type: String,
		  default: null,
	  },
	  icon: {
		  type: String,
		  default: null,
	  },
	  border: {
		  type: Boolean,
		  default: false,
	  },
	  conditionalFormatting: {
		  type: Array as PropType<
			  {
				  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
				  value: string;
				  color: string;
				  background: string;
				  text: string;
				  icon: string;
			  }[]
			  >,
		  default: () => [],
	  },
	},
	setup(props) {
	  const { t, n } = useI18n();
		const count = computed(() => get(props.rootItem, `${props.field}_count`) ?? 0);

	  const matchedConditions = computed(() => {
		  return (props.conditionalFormatting || []).filter(({ operator, value }) => {
				const left = parseInt(String(count.value));
				const right = parseInt(String(value));
				return matchNumber(left, right, operator);
		  });
	  });

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
			  }
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
		  if (computedFormat.value.text) {
			  const { text } = computedFormat.value;
			  return text.startsWith('$t:') ? t(text.slice(3)) : text;
		  }npm

		  let value = String(count.value);

		  if (props.format) {
		  	value = n(parseInt(value));
		  }

		  const prefix = props.prefix ?? '';
		  const suffix = props.suffix ?? '';

		  return `${prefix}${value}${suffix}`;
	  });

	  return { t, computedFormat, displayValue, computedStyle };

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
	  }
  },
});
</script>

<style lang="scss" scoped>
.display-related-count {
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
		color: var(--foreground-normal-alt);
		font-weight: 700;
  }

  &.italic {
		font-style: italic;
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

  .v-icon {
		flex-shrink: 0;
		vertical-align: -3px;
  }
}
</style>
