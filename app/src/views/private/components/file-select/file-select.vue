<template>
	<div class="file">
		<v-input readonly :placeholder="t('no_file_selected')" :disabled="disabled" v-model="fileName">
			<template #append>
				<template v-if="file">
					<v-icon class="deselect" name="close" @click="clearSelection()" v-tooltip="t('deselect')" />
				</template>
				<v-icon v-else class="select" name="attach_file" @click="$refs.import_file.click()" />
			</template>
		</v-input>
		<input :disabled="disabled" v-show="false" type="file" ref="import_file" :accept="accept" @change="fileSelected" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		accept: {
			type: String,
			default: null,
		},
	},
	methods: {
		fileSelected(event: Event) {
			const files = (event.target as HTMLInputElement).files;
			this.file = files && files?.length > 0 ? files?.item(0) : null;
			if (this.file) {
				this.fileName = this.file.name;
			}
			this.$emit('select', this.file);
		},
		clearSelection() {
			this.file = null;
			this.fileName = null;
			(this.$refs.import_file as HTMLInputElement).value = '';
			this.$emit('select', this.file);
		},
	},
	mounted() {
		this.$emit('load', { clear: this.clearSelection });
	},
	setup() {
		const { t } = useI18n();
		const file = ref<File | null>(null);
		const fileName = ref<string | null>(null);
		return { t, file, fileName };
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
