<template>
	<div
		class="search-input"
		:class="{ active, 'has-content': !!value }"
		v-click-outside="disable"
		@click="active = true"
		v-tooltip.bottom="active ? null : $t('search')"
	>
		<v-icon name="search" />
		<input ref="input" :value="value" @input="emitValue" @paste="emitValue" :placeholder="$t('search_items')" />
		<v-icon v-if="value" class="empty" name="close" @click.stop="emptyAndClose" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const input = ref<HTMLInputElement | null>(null);

		const active = ref(props.value !== null);

		watch(active, (newActive: boolean) => {
			if (newActive === true && input.value !== null) {
				input.value.focus();
			}
		});

		return { active, disable, input, emptyAndClose, emitValue };

		function disable() {
			active.value = false;
		}

		function emptyAndClose() {
			emit('input', null);
			active.value = false;
		}

		function emitValue() {
			if (!input.value) return;
			const value = input.value?.value;
			emit('input', value);
		}
	},
});
</script>

<style lang="scss" scoped>
.search-input {
	display: flex;
	align-items: center;
	width: 44px;
	height: 44px;
	overflow: hidden;
	border: 2px solid var(--border-normal);
	border-radius: calc(44px / 2);
	cursor: pointer;
	transition: width var(--slow) var(--transition);

	.empty {
		--v-icon-color: var(--foreground-subdued);

		display: none;

		&:hover {
			--v-icon-color: var(--danger);
		}
	}

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&:focus,
	&:focus-within {
		border-color: var(--primary);
	}

	&.active {
		width: 300px;

		.empty {
			display: block;
		}
	}

	&.has-content {
		width: 140px;

		&:focus,
		&:focus-within {
			width: 300px;
		}

		.empty {
			display: block;
		}
	}
}

input {
	flex-grow: 1;
	width: 0px;
	height: 100%;
	margin: 0;
	padding: 0;
	color: var(--foreground-normal);
	background-color: var(--background-page);
	border: none;
	border-radius: 0;

	&::placeholder {
		color: var(--foreground-subdued);
	}
}

.value {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.v-icon {
	margin: 0 8px;
	cursor: pointer;
}
</style>
