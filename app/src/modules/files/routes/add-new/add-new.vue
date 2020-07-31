<template>
	<v-dialog :active="dialogActive" @toggle="close">
		<v-card>
			<v-card-title>{{ $t('add_new_file') }}</v-card-title>
			<v-card-text>
				<v-upload @upload="onUpload" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">{{ $t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import router from '@/router';

export default defineComponent({
	props: {
		parent: {
			type: Number,
			default: null,
		},
	},
	setup(props, { emit }) {
		const dialogActive = ref(false);

		onMounted(() => dialogActive.value = true);

		return { onUpload, close, dialogActive };

		function close() {
			dialogActive.value = false;
			router.push('/files');
		}

		function onUpload() {
			emit('upload');
		}
	},
});
</script>
