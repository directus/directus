<template>
	<v-dialog :active="true" @toggle="close" @esc="close">
		<v-card>
			<v-card-title>{{ $t('add_file') }}</v-card-title>
			<v-card-text>
				<v-upload :preset="preset" multiple @input="close" from-url />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">{{ $t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import router from '@/router';

export default defineComponent({
	props: {
		preset: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(props) {
		return { close };

		function close() {
			router.push({ path: '/files', query: props.preset });
		}
	},
});
</script>
