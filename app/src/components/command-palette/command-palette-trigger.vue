<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const isMacOS = navigator.platform.toUpperCase().includes('MAC');

function openCommandPalette() {
	window.dispatchEvent(new CustomEvent('open-command-palette'));
}
</script>

<template>
	<button class="command-palette-trigger" type="button" @click="openCommandPalette">
		<span>{{ t('search') }}...</span>
		<span class="keys">
			<kbd>{{ isMacOS ? '⌘' : 'Ctrl+' }}</kbd>
			<kbd>K</kbd>
		</span>
	</button>
</template>

<style lang="scss" scoped>
.command-palette-trigger {
	cursor: pointer;
	display: flex;
	inline-size: calc(100% - 1.5rem);
	background-color: var(--theme--background);
	gap: 0.5rem;
	justify-content: center;
	align-items: center;
	border: 0.0625rem solid var(--theme--border-color);
	padding: 0.375rem 0.75rem;
	border-radius: var(--theme--border-radius);
	color: var(--theme--foreground-subdued);
	margin: 0.75rem 0.75rem 0;
	transition: all var(--fast) var(--transition);
	font: inherit;

	&:hover {
		border-color: var(--theme--primary);
		color: var(--theme--foreground-accent);
	}

	.keys {
		border: 0.0625rem solid var(--theme--border-color);
		padding: 0 0.375rem;
		border-radius: 0.25rem;
		font-size: 87.5%;
	}
}
</style>
