<template>
	<div class="v-pagination">
		<v-button :disabled="disabled || value === 1" secondary outlined icon small @click="toPrev">
			<v-icon name="chevron_left" />
		</v-button>

		<v-button
			icon
			small
			v-for="page in visiblePages"
			:key="page"
			:class="{ active: value === page }"
			@click="toPage(page)"
			secondary
			:disabled="disabled"
		>
			{{ page }}
		</v-button>

		<v-button
			:disabled="disabled || value === length"
			secondary
			outlined
			icon
			small
			@click="toNext"
		>
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
			default: false
		},
		length: {
			type: Number,
			default: null,
			required: true,
			validator: (val: number) => val % 1 === 0
		},
		totalVisible: {
			type: Number,
			default: undefined,
			validator: (val: number) => val >= 0
		},
		value: {
			type: Number,
			default: null
		}
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

			return Array.from(Array(endPage + 1 - startPage).keys()).map(i => startPage + i);
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
	}
});
</script>

<style lang="scss" scoped>
.v-pagination {
	--v-pagination-active-color: var(--accent);

	.v-button {
		vertical-align: middle;

		&:not(:first-child):not(:last-child) {
			margin: 0 2px;
		}
	}

	.v-button.active {
		--v-button-background-color: var(--v-pagination-active-color);
	}
}
</style>
