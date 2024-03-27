<script setup lang="ts">
import { nextTick, onMounted, ref, watch, type Ref } from 'vue';
import { useLocalStorage } from '../composables/useLocalStorage';

const props = defineProps<{
	choices: string[];
	group?: string;
	maintainHeight?: boolean;
}>();

const selected = ref<string>();
let storage: Ref<string | null> | undefined;

// Get local storage on client side (preventing SSR <-> Client mismatch & initial flash)
onMounted(() => {
	const defaultValue = props.choices[0];

	if (props.group) {
		storage = useLocalStorage(`toggler-${props.group}`);

		const initialValue = storage.value;

		selected.value = initialValue && props.choices.includes(initialValue) ? initialValue : defaultValue;

		watch(storage, (value) => {
			if (!value || !props.choices.includes(value)) return;

			selected.value = value;
		});
	} else {
		selected.value = defaultValue;
	}
});

const changeSelected = async (choice: string, el: HTMLElement) => {
	const previousRelativeOffset = el.offsetTop - document.documentElement.scrollTop;

	(storage ?? selected).value = choice;

	if (props.group) {
		await nextTick();

		const newRelativeOffset = el.offsetTop - document.documentElement.scrollTop;
		document.documentElement.scrollTop += newRelativeOffset - previousRelativeOffset;
	}
};
</script>

<template>
	<div class="snippet-toggler">
		<div class="header">
			<div class="buttons">
				<button
					v-for="choice in choices"
					:key="choice"
					class="button"
					:class="{ active: choice === selected }"
					@click="changeSelected(choice, $el)"
				>
					{{ choice }}
				</button>
			</div>
		</div>

		<div class="content-area">
			<template v-for="choice in choices" :key="choice">
				<div
					v-if="maintainHeight || choice === selected"
					:class="['content', { 'maintain-height': maintainHeight, active: maintainHeight && choice === selected }]"
				>
					<slot :name="choice.toLowerCase().split(' ').join('-')"></slot>
				</div>
			</template>
		</div>
	</div>
</template>

<style scoped lang="scss">
.snippet-toggler {
	--snippet-toggler-border-color: var(--vp-c-gray-light-4);
	--snippet-toggler-button-color: var(--vp-c-gray);
	--snippet-toggler-button-active-color: var(--vp-c-black);
}

html.dark .snippet-toggler {
	--snippet-toggler-border-color: transparent;
	--snippet-toggler-button-color: var(--vp-c-gray-light-2);
	--snippet-toggler-button-active-color: var(--vp-c-gray-light-4);
}

.snippet-toggler {
	overflow: hidden;
	background: linear-gradient(172.36deg, rgba(228, 234, 241, 0.1) -5.49%, rgba(228, 234, 241, 0) 123.05%);
	border: 1px solid var(--snippet-toggler-border-color);

	.header {
		background: linear-gradient(172.36deg, rgba(228, 234, 241, 0.1) -5.49%, rgba(228, 234, 241, 0) 123.05%);
		color: var(--vp-c-gray-light-2);
		border-bottom: 1px solid var(--snippet-toggler-border-color);
		height: 40px;
		display: flex;
		align-items: center;
		padding: 24px;

		.buttons {
			display: flex;
			gap: 0.5em;

			.button {
				padding: 0.25em 0.75em;
				color: var(--snippet-toggler-button-color);

				&.active {
					color: var(--snippet-toggler-button-active-color);
					background: var(--vp-c-mute);
					border-radius: var(--rounded-lg);
				}
			}
		}
	}

	.content-area {
		scrollbar-width: thin;
		overflow-y: auto;
		tab-size: 2;
		display: grid;
		grid-template-columns: 100%;

		:deep(.lang) {
			display: none;
		}
	}

	.content {
		--padding-y: 24px;
		--padding-x: 8px;

		padding-top: var(--padding-x);
		padding-bottom: var(--padding-x);

		&:not(.maintain-height) {
			padding-inline: var(--padding-y);
		}

		&.maintain-height {
			overflow: hidden;
			grid-row-start: 1;
			grid-column-start: 1;
			visibility: hidden;
			width: 0;
			mask-image: linear-gradient(
					to right,
					transparent,
					black var(--padding-y),
					black calc(100% - var(--padding-y)),
					transparent
				),
				linear-gradient(
					to top,
					black,
					black calc(2 * var(--padding-x)),
					transparent calc(2 * var(--padding-x)),
					transparent
				);

			&.active {
				visibility: visible;
				width: 100%;
				overflow: auto;
			}

			:deep(.line) {
				padding-inline: var(--padding-y);
			}
		}
	}
}

@media (min-width: 640px) {
	.snippet-toggler {
		border-radius: 12px;
	}
}
</style>
