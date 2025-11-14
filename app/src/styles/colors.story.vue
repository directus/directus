<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import Color from 'color';
import { sortBy } from 'lodash';
import { computed, ref } from 'vue';

type CssVar = {
	name: string;
	hex: string;
};

const search = ref('');

const style = computed(() => {
	return getComputedStyle(document.body);
});

const COLORS = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'pink'] as const;

const grids = computed(() => {
	const vars: [CssVar[], CssVar[], CssVar[]] = [[], [], []];
	if (!style.value) return vars;

	for (let i = 0; i < style.value.length; i++) {
		const name = style.value[i]!;

		if (name.startsWith('--')) {
			const hex = getHexColor(name);

			if (search.value && !name.includes(search.value) && !hex.startsWith(search.value)) continue;

			if (COLORS.some((color) => name.startsWith(`--${color}`))) {
				vars[2].push({ name, hex });
			} else if (name.startsWith(`--theme`)) {
				vars[1].push({ name, hex });
			} else {
				vars[0].push({ name, hex });
			}
		}
	}

	return [sortBy(vars[0], 'name'), sortBy(vars[1], 'name'), sortBy(vars[2], 'name')];
});

const { copy } = useClipboard();

function getHexColor(name: string) {
	const color = style.value.getPropertyValue(name);

	const el = document.createElement('div');
	el.style.backgroundColor = color;
	document.body.appendChild(el);
	const colorString = getComputedStyle(el).backgroundColor;
	document.body.removeChild(el);
	console.log('color', color, 'colorString', colorString);
	const colorMatch = /rgb\((.+)\)/.exec(colorString)!;

	if (!colorMatch) return '';

	const parts = colorMatch[1]?.split(',').map(Number) ?? [];

	const hex = Color.rgb(...parts).hex();

	return hex;
}

async function copyColor(hex: string) {
	await copy(hex);
}
</script>

<template>
	<Story title="Colors" auto-props-disabled responsive-disabled>
		<v-input ref="element" v-model="search" placeholder="Search for a color..." :full-width="false">
			<template #append>
				<v-icon name="search" />
			</template>
		</v-input>

		<div class="grids">
			<div v-for="(grid, i) in grids" :key="i" class="grid">
				<div v-for="cssVar in grid" :key="cssVar.name" class="block">
					<span>{{ cssVar.name }}</span>
					<button
						v-tooltip="'Copy Hex color'"
						class="color"
						:style="{ backgroundColor: `var(${cssVar.name})` }"
						@click="copyColor(cssVar.hex)"
					/>
				</div>
			</div>
		</div>
		<template #controls></template>
	</Story>
</template>

<style scoped>
.v-input {
	position: fixed;
	inset-block-start: 20px;
	inset-inline-start: 20px;
	inline-size: calc(100% - 40px);
}

.grids {
	margin-block-start: 80px;
	display: flex;
	align-items: flex-start;
	flex-wrap: wrap;
}

.grid {
	display: grid;
	gap: 12px;
}

.block {
	display: flex;
	gap: 8px;
}

.color {
	inline-size: 24px;
	block-size: 24px;
	border-radius: 50%;
	border: 1px solid var(--black);
}
</style>
