<template>
	<v-dialog :active="true" @toggle="close" @esc="close">
		<v-card>
			<v-card-title>{{ $t('add_file') }}</v-card-title>
			<v-card-text>
				<v-upload :preset="preset" multiple @input="close" from-url />
				<v-select v-model="storage" :items="providers" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">{{ $t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import router from '@/router';

export default defineComponent({
	props: {
		preset: {
			type: Object,
			default: () => ({}),
		},
		providers: {
			type: Array,
			default: () => [
				{
					text: 'Local',
					value: 'local',
				},
				{
					text: 'AWS S3',
					value: 's3',
				},
				{
					text: 'Azure Blob',
					value: 'azure',
				},
				{
					text: 'Google Cloud Storage',
					value: 'gcs',
				},
			],
		},
	},
	setup(props) {
		let storage = ref('local');

		function close() {
			const query = { storage: storage.value, ...props.preset };
			router.push({ path: '/files', query });
		}

		return { close, storage };
	},
});
</script>
