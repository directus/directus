<script setup lang="ts">
const { className = '' } = defineProps<{ className?: string }>();

const colorMode = useColorMode();
const isDark = computed(
	() => colorMode.preference === 'dark' || (colorMode.preference === 'system' && colorMode.value === 'dark'),
);

const toggleTheme = () => {
	colorMode.preference = isDark.value ? 'light' : 'dark';
};
</script>

<template>
	<button
		aria-label="Toggle Dark Mode"
		:class="[
			'transition-colors p-1 rounded-full border',
			isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100',
			className,
		]"
		@click="toggleTheme"
	>
		<svg
			v-if="isDark"
			xmlns="http://www.w3.org/2000/svg"
			class="size-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z" />
		</svg>
		<svg
			v-else
			xmlns="http://www.w3.org/2000/svg"
			class="size-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path
				d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0m-5 0h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7l-.7.7m0 11.4l.7.7m-12.1-.7l-.7.7"
			/>
		</svg>
	</button>
</template>
