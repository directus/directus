<template>
	<div class="snippet-toggler" :class="{ dark: alwaysDark }">
		<div class="snippet-toggler-header">
			<div class="buttons">
				<button
					v-for="choice in choices"
					:key="choice"
					class="button"
					:class="{ active: selected == choice }"
					@click="selected = choice"
				>
					{{ choice }}
				</button>
			</div>
		</div>

		<div class="content-area">
			<template v-for="choice in choices" :key="choice">
				<div v-if="choice === selected">
					<slot :name="choice.toLowerCase()"></slot>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue';

const props = defineProps<{
	choices: string[];
	label?: string;
	alwaysDark?: boolean;
}>();

const selected = ref();

const useStorage = (key: string) => {
	const getStorageValue = () => {
		return localStorage.getItem(key);
	};

	const setStorageValue = (value: string) => localStorage.setItem(key, value);

	return { getStorageValue, setStorageValue };
};

const { getStorageValue, setStorageValue } = useStorage('toggler-value');

onBeforeMount(() => {
	const value = getStorageValue();

	if (value && props.choices.includes(value)) {
		selected.value = value;
	} else {
		selected.value = props.choices[0];
	}

	watch(selected, (value) => {
		setStorageValue(value);
	});
});
</script>

<style scoped>
.snippet-toggler {
	--snippet-toggler-border-color: var(--vp-c-gray-light-4);
}

html.dark .snippet-toggler,
.snippet-toggler.dark {
	--snippet-toggler-border-color: transparent;
}

.snippet-toggler {
	overflow: hidden;
	background: linear-gradient(172.36deg, rgba(228, 234, 241, 0.1) -5.49%, rgba(228, 234, 241, 0) 123.05%);
	border: 1px solid var(--snippet-toggler-border-color);
}

.snippet-toggler-header {
	background: linear-gradient(172.36deg, rgba(228, 234, 241, 0.1) -5.49%, rgba(228, 234, 241, 0) 123.05%);
	color: var(--vp-c-gray-light-2);
	border-bottom: 1px solid var(--snippet-toggler-border-color);
	height: 40px;
	display: flex;
	align-items: center;
	padding: 24px;
}

.buttons {
	display: flex;
	gap: 0.5em;
}

.button {
	padding: 0.25em 0.75em;
	color: var(--vp-c-gray);
}

.button.active {
	color: var(--vp-c-black);
	background: var(--vp-c-mute);
	border-radius: var(--rounded-lg);
}

html.dark .snippet-toggler .button,
.snippet-toggler.dark .button {
	color: var(--vp-c-gray-light-2);
}

html.dark .snippet-toggler .button.active,
.snippet-toggler.dark .button.active {
	color: var(--vp-c-gray-light-4);
}

.snippet-toggler .content-area :deep(.lang) {
	display: none;
}

.snippet-toggler.dark .content-area :deep(.vp-code-dark) {
	display: block;
}

@media (min-width: 640px) {
	.snippet-toggler {
		border-radius: 12px;
	}
}

.content-area {
	padding-inline: 24px;
	padding-top: 8px;
	padding-bottom: 8px;
	scrollbar-width: none;
	overflow-y: auto;
	tab-size: 2;
}
</style>
