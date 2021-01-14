<template>
	<div class="interface-markdown">
		<div class="toolbar">
			<v-button icon @click="edit('bold')"><v-icon name="format_bold" /></v-button>
			<v-button icon @click="edit('italic')"><v-icon name="format_italic" /></v-button>
			<v-button icon @click="edit('strikethrough')"><v-icon name="format_strikethrough" /></v-button>
		</div>

		<textarea ref="codemirrorEl" :value="value || ''" />

		<div class="preview"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted } from '@vue/composition-api';

import CodeMirror from 'codemirror';
import 'codemirror/mode/markdown/markdown';

import { useEdit } from './composables/use-edit';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const codemirrorEl = ref<HTMLTextAreaElement | null>(null);
		const codemirror = ref<CodeMirror.EditorFromTextArea | null>(null);

		onMounted(async () => {
			if (codemirrorEl.value) {
				codemirror.value = CodeMirror.fromTextArea(codemirrorEl.value, {
					mode: 'markdown'
				});

				codemirror.value.setValue(props.value || '');
			}
		});

		onUnmounted(() => {
			codemirror.value?.toTextArea();
		});

		const { edit } = useEdit(codemirror);

		return { codemirrorEl, edit };
	},
});
</script>

<style lang="scss" scoped>
</style>
