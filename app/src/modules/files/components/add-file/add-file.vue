<template>
	<v-dialog v-model="dialogActive">
		<template #activator="{ on }">
			<v-button rounded icon class="add-new" @click="on">
				<v-icon name="add" />
			</v-button>
		</template>

		<v-card>
			<v-card-title>{{ $t('add_new_file') }}</v-card-title>
			<v-card-text>
				<v-upload @upload="onUpload" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="dialogActive = false">{{ $t('cancel') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
	props: {
		parent: {
			type: Number,
			default: null,
		},
	},
	setup(props, { emit }) {
		const dialogActive = ref(false);

		return { dialogActive, onUpload };

		function onUpload() {
			dialogActive.value = false;
			emit('upload');
		}
	},
});
</script>
