<template>
	<v-dialog :active="true" @toggle="close">
		<v-card>
			<v-card-title>{{ $t('add_new_file') }}</v-card-title>
			<v-card-text>
				<v-upload multiple @upload="close" />
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
		return { close };

		function close() {
			router.push('/files');
		}
	},
});
</script>
