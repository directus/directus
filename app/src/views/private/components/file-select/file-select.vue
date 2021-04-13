<template>
	<div class="file">
		<v-input readonly :placeholder="$t('no_file_selected')" :disabled="disabled" :value="file && file.name">
			<template #append>
				<template v-if="file">
					<v-icon class="deselect" name="close" @click="clearSelection()" v-tooltip="$t('deselect')" />
				</template>
				<v-icon v-else class="select" name="attach_file" @click="$refs.import_file.click()" />
			</template>
		</v-input>
		<input
			:disabled="disabled"
			v-show="false"
			type="file"
			ref="import_file"
			accept=".xlf, application/xliff+xml"
			@change="fileSelected"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	methods: {
		fileSelected(event: Event) {
			const files = (event.target as HTMLInputElement).files;
			this.file = files && files?.length > 0 ? files?.item(0) : null;
			this.$emit('change', this.file);
		},
		clearSelection() {
			this.file = null;
			(this.$refs.import_file as HTMLInputElement).value = '';
			this.$emit('change', this.file);
		},
	},
	mounted() {
		this.$emit('load', { clear: this.clearSelection });
	},
	setup(props) {
		const file = ref<File | null>(null);
		return { file };
	},
});
</script>

<style lang="scss" scoped>
.deselect:hover {
	--v-icon-color: var(--danger);
}

.select {
	cursor: pointer;
}
</style>
