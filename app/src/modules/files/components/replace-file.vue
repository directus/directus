<template>
	<v-dialog
		:modelValue="modelValue"
		@update:modelValue="$emit('update:modelValue', false)"
		@esc="$emit('update:modelValue', false)"
	>
		<v-card v-if="file">
			<v-card-title>{{ $t('replace_file') }}</v-card-title>
			<v-card-text>
				<v-upload :preset="preset" :file-id="file.id" @input="uploaded" from-url />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="$emit('update:modelValue', false)">{{ $t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	emits: ['update:modelValue', 'replaced'],
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		file: {
			type: Object,
			default: () => ({}),
		},
		preset: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(_props, { emit }) {
		return { uploaded };
		function uploaded() {
			emit('update:modelValue', false);
			emit('replaced');
		}
	},
});
</script>

<style lang="scss" scoped>
.add-new {
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}
</style>
