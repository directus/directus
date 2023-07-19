<template>
	<div class="snippet-toggler" :class="{ dark: alwaysDark }">
		<div class="snippet-toggler-header">
			<span class="snippet-toggler-header-label">{{ label }}</span>

			<span class="spacer" />

			<div class="snippet-toggler-header-lang-container">
				<select v-model="selected" class="snippet-toggler-header-lang">
					<option v-for="choice in choices" :key="choice" :value="choice">
						{{ choice }}
					</option>
				</select>
				<svg
					class="snippet-toggler-header-lang-arrow"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 48 48"
					height="18"
					width="18"
				>
					<path d="m24 30.75-12-12 2.15-2.15L24 26.5l9.85-9.85L36 18.8Z" />
				</svg>
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
	alwaysDark?: {
		type: boolean,
		default: false
	}
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

	selected.value = value || props.choices[0];

	watch(selected, (value) => {
		setStorageValue(value);
	});
});
</script>

<style scoped>
.snippet-toggler {
	overflow: hidden;
	background: linear-gradient(172.36deg, rgba(228, 234, 241, 0.1) -5.49%, rgba(228, 234, 241, 0) 123.05%);
	border: 1px solid var(--vp-snippet-toggler-border);
}

.snippet-toggler-header {
	background: linear-gradient(172.36deg, rgba(228, 234, 241, 0.1) -5.49%, rgba(228, 234, 241, 0) 123.05%);
	color: var(--vp-c-gray-light-2);
	border-bottom: 1px solid var(--vp-snippet-toggler-border);
	height: 40px;
	display: flex;
	align-items: center;
	padding: 0 24px;
}

.spacer {
	flex-grow: 1;
}

.snippet-toggler-header-label {
	text-transform: uppercase;
	font-size: 12px;
	font-weight: 600;
}

.snippet-toggler-header-lang-container {
	display: flex;
	align-items: center;
}

.snippet-toggler-header-lang-container:hover {
	color: var(--vp-c-gray-light-5);
}

.snippet-toggler-header-lang {
	background-color: transparent;
	text-align: right;
	border: 0;
	border-color: transparent;
	padding: 0;
	font-family: inherit;
	color: inherit;
	appearance: none;
	line-height: inherit;
	position: relative;
	font-size: 12px;
	padding-inline-end: 20px;
}
.snippet-toggler-header-lang option {
	color: var(--vp-c-black);
}

.snippet-toggler-header-lang:focus {
	outline: none;
}

.snippet-toggler-header-lang-arrow {
	position: absolute;
	right: 24px;
	fill: currentColor;
	user-select: none;
	pointer-events: none;
}

.snippet-toggler .content-area [class^='language-'] {
	margin: 0;
	border-radius: 0;
	display: none;
}

.snippet-toggler .content-area :global(.lang) {
	display: none;
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
	/* padding-bottom: 32px; */
	scrollbar-width: none;
	overflow-y: auto;
	tab-size: 2;
}
</style>
