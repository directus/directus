<template>
	<v-dialog :model-value="true" @update:model-value="close" @esc="close">
		<v-card>
			<v-card-title>{{ t('add_file') }}</v-card-title>
			<v-card-text>
				<v-upload :preset="preset" multiple @input="close" from-url />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">{{ t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
	props: {
		preset: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		return { t, close };

		function close() {
			router.push({ path: '/files', query: props.preset });
		}
	},
});
</script>
