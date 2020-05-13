<template>
	<v-dialog v-model="_active">
		<template #activator="activatorBinding">
			<slot name="activator" v-bind="activatorBinding" />
		</template>

		<v-progress-circular indeterminate v-if="loading" />

		<file-preview
			v-else-if="file"
			:src="`${file.data.full_url}?cache-buster=${cacheBuster}`"
			:mime="file.type"
			:width="file.width"
			:height="file.height"
			:title="file.title"
			@click="_active = false"
		/>

		<v-button class="close" @click="_active = false" icon rounded>
			<v-icon name="close" />
		</v-button>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from '@vue/composition-api';
import api from '@/api';
import { useProjectsStore } from '@/stores/projects';
import { nanoid } from 'nanoid';
import FilePreview from '@/views/private/components/file-preview';

type File = {
	data: {
		full_url: string;
	};
	type: string;
	width: number | null;
	height: number | null;
	title: string;
};

export default defineComponent({
	components: { FilePreview },
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		id: {
			type: Number,
			required: true,
		},
		active: {
			type: Boolean,
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const projectsStore = useProjectsStore();

		const localActive = ref(false);

		const _active = computed({
			get() {
				return props.active === undefined ? localActive.value : props.active;
			},
			set(newActive: boolean) {
				localActive.value = newActive;
				emit('toggle', newActive);
			},
		});

		const loading = ref(false);
		const error = ref(null);
		const file = ref<File>(null);
		const cacheBuster = ref(nanoid());

		watch(
			() => props.id,
			(newID, oldID) => {
				if (newID && newID !== oldID) {
					fetchFile();
				}
			}
		);

		return { _active, cacheBuster, loading, error, file };

		async function fetchFile() {
			const { currentProjectKey } = projectsStore.state;
			cacheBuster.value = nanoid();

			loading.value = true;

			try {
				const response = await api.get(`/${currentProjectKey}/files/${props.id}`, {
					params: {
						fields: ['data', 'type', 'width', 'height', 'title'],
					},
				});

				file.value = response.data.data;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.file-preview {
	width: 90%;
	height: 90%;
}

.close {
	--v-button-background-color: var(--white);
	--v-button-color: var(--foreground-subdued);
	--v-button-background-color-hover: var(--white);
	--v-button-color-hover: var(--foreground-normal);

	position: absolute;
	top: 32px;
	right: 32px;
}
</style>
