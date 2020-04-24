<template>
	<div
		class="search-input"
		:class="{ active }"
		v-click-outside="closeIfNoContent"
		@click="active = true"
	>
		<v-icon name="search" />
		<input ref="input" :value="value" @input="emitValue" />
		<v-icon class="empty" name="close" @click="$emit('input', null)" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import { debounce } from 'lodash';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const input = ref<HTMLInputElement>(null);

		const active = ref(props.value !== null);

		watch(active, (newActive: boolean) => {
			if (newActive === true && input.value !== null) {
				input.value.focus();
			}
		});

		const emitValue = debounce(
			(event: InputEvent) => emit('input', (event.target as HTMLInputElement).value),
			850
		);

		return { active, closeIfNoContent, input, emitValue };

		function closeIfNoContent() {
			if (props.value === null || props.value.length === 0) active.value = false;
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
	border: 2px solid var(--border-normal);
	border-radius: calc(44px / 2);
	transition: width var(--slow) var(--transition);

	&:hover {
		border-color: var(--border-normal-alt);
	}

	&:focus,
	&:focus-within {
		border-color: var(--primary);
	}
}

input {
	display: none;
	flex-grow: 1;
	width: 0px;
	height: 100%;
	margin: 0;
	padding: 0;
	border: none;
	border-radius: 0;
}

.v-icon {
	margin: 0 8px;
	cursor: pointer;
}

.empty {
	--v-icon-color: var(--foreground-subdued);

	display: none;

	&:hover {
		--v-icon-color: var(--danger);
	}
}

.search-input.active {
	width: 300px;

	input,
	.empty {
		display: block;
	}
}
</style>
