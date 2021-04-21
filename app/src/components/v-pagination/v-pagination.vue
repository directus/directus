<template>
	<div class="v-pagination">
		<v-button class="previous" :disabled="disabled || value === 1" secondary icon small @click="toPrev">
			<v-icon name="chevron_left" />
		</v-button>

		<v-button
			v-if="showFirstLast && value > Math.ceil(totalVisible / 2) + 1 && length > totalVisible"
			class="page"
			@click="toPage(1)"
			secondary
			small
			:disabled="disabled"
		>
			1
		</v-button>

		<span v-if="showFirstLast && value > Math.ceil(totalVisible / 2) + 1 && length > totalVisible + 1" class="gap">
			...
		</span>

		<v-button
			v-for="page in visiblePages"
			:key="page"
			:class="{ active: value === page }"
			class="page"
			@click="toPage(page)"
			secondary
			small
			:disabled="disabled"
		>
			{{ page }}
		</v-button>

		<span
			v-if="showFirstLast && value < length - Math.ceil(totalVisible / 2) && length > totalVisible + 1"
			class="gap"
		>
			...
		</span>

		<v-button
			v-if="showFirstLast && value <= length - Math.ceil(totalVisible / 2) && length > totalVisible"
			:class="{ active: value === length }"
			class="page"
			@click="toPage(length)"
			secondary
			small
			:disabled="disabled"
		>
			{{ length }}
		</v-button>

		<v-button class="next" :disabled="disabled || value === length" secondary icon small @click="toNext">
			<v-icon name="chevron_right" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { isEmpty } from '@/utils/is-empty';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		length: {
			type: Number,
			default: null,
			required: true,
			validator: (val: number) => val % 1 === 0,
		},
		totalVisible: {
			type: Number,
			default: undefined,
			validator: (val: number) => val >= 0,
		},
		value: {
			type: Number,
			default: null,
		},
		showFirstLast: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const visiblePages = computed<number[]>(() => {
			let startPage: number;
			let endPage: number;

			if (isEmpty(props.totalVisible) || props.length <= props.totalVisible) {
				startPage = 1;
				endPage = props.length;
			} else {
				const pagesBeforeCurrentPage = Math.floor(props.totalVisible / 2);
				const pagesAfterCurrentPage = Math.ceil(props.totalVisible / 2) - 1;

				if (props.value <= pagesBeforeCurrentPage) {
					startPage = 1;
					endPage = props.totalVisible;
				} else if (props.value + pagesAfterCurrentPage >= props.length) {
					startPage = props.length - props.totalVisible + 1;
					endPage = props.length;
				} else {
					startPage = props.value - pagesBeforeCurrentPage;
					endPage = props.value + pagesAfterCurrentPage;
				}
			}

			return Array.from(Array(endPage + 1 - startPage).keys()).map((i) => startPage + i);
		});

		return { toPage, toPrev, toNext, visiblePages };

		function toPrev() {
			toPage(props.value - 1);
		}

		function toNext() {
			toPage(props.value + 1);
		}

		function toPage(page: number) {
			emit('input', page);
		}
	},
});
</script>

<style>
body {
	--v-pagination-active-color: var(--primary);
}
</style>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.v-pagination {
	display: flex;

	.gap {
		display: none;
		margin: 0 4px;
		color: var(--foreground-subdued);
		line-height: 2em;

		@include breakpoint(small) {
			display: inline;
		}
	}

	.v-button {
		--v-button-background-color-hover: var(--background-normal);
		--v-button-background-color: var(--background-subdued);
		--v-button-color: var(--foreground-normal);

		margin: 0 2px;
		vertical-align: middle;

		&.page:not(.active) {
			display: none;

			@include breakpoint(small) {
				display: inline;
			}
		}

		& ::v-deep {
			.small {
				--v-button-min-width: 32px;
			}
		}

		&:first-child {
			margin-left: 0;
		}

		&:last-child {
			margin-right: 0;
		}

		&.active {
			--v-button-background-color-hover: var(--primary);
			--v-button-color-hover: var(--foreground-inverted);
			--v-button-background-color: var(--primary);
			--v-button-color: var(--foreground-inverted);
		}
	}
}
</style>
