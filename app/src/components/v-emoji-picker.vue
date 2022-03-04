<template>
	<v-menu full-height :close-on-content-click="false" @update:modelValue="update">
		<template #activator="{ toggle }">
			<v-button class="emoji-button" x-small secondary icon @click="toggle">
				<v-icon name="insert_emoticon" />
			</v-button>
		</template>

		<div ref="picker" class="picker"></div>
	</v-menu>
</template>

<script setup lang="ts">
import { Picker } from 'emoji-picker-element';
import { ref, nextTick } from 'vue';

const emit = defineEmits(['emoji-selected']);

const picker = ref<HTMLElement | null>(null);
const emojiPicker = new Picker();

emojiPicker.addEventListener('emoji-click', (event) => {
	emit('emoji-selected', event.detail);
});

function update(active: boolean) {
	if (active === false) return;

	nextTick(() => {
		picker.value?.appendChild(emojiPicker);
	});
}
</script>

<style scoped lang="scss">
.emoji-button .v-icon {
	color: var(--foreground-subdued);
}

.picker ::v-deep emoji-picker {
	--background: transparent;
	--border-color: transparent;
	--button-active-background: var(--background-normal-alt);
	--button-hover-background: var(--background-normal-alt);
	--input-border-color: var(--border-normal);
	--input-border-size: var(--border-width);
	--outline-color: var(--border-normal-alt);
	--input-font-color: var(--foreground-normal);
	--input-placeholder-color: var(--foreground-subdued);
	--input-border-radius: var(--border-radius);
	--indicator-color: var(--primary);
	--indicator-height: 2px;
}
</style>
