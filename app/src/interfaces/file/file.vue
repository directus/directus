<template>
	<div class="file">
		<v-menu attached :disabled="loading">
			<template #activator="{ toggle }">
				<div>
					<v-skeleton-loader v-if="loading" type="input" />
					<v-input
						v-else
						clickable
						readonly
						:placeholder="t('no_file_selected')"
						:model-value="file && file.title"
						@click="toggle"
					>
						<template #prepend>
							<div
								class="preview"
								:class="{
									'has-file': file,
									'is-svg': file?.type?.includes('svg'),
								}"
							>
								<img v-if="imageThumbnail" :src="imageThumbnail" :alt="file.title" />
								<span v-else-if="fileExtension" class="extension">
									{{ fileExtension }}
								</span>
								<v-icon v-else name="folder_open" />
							</div>
						</template>
						<template #append>
							<template v-if="file">
								<v-icon v-tooltip="t('edit')" name="open_in_new" class="edit" @click.stop="editDrawerActive = true" />
								<v-icon
									v-if="!disabled"
									v-tooltip="t('deselect')"
									class="deselect"
									name="close"
									@click.stop="$emit('input', null)"
								/>
							</template>
							<v-icon v-else name="attach_file" />
						</template>
					</v-input>
				</div>
			</template>

			<v-list>
				<template v-if="file">
					<v-list-item :download="file.filename_download" :href="assetURL">
						<v-list-item-icon><v-icon name="get_app" /></v-list-item-icon>
						<v-list-item-content>{{ t('download_file') }}</v-list-item-content>
					</v-list-item>

					<v-divider v-if="!disabled" />
				</template>
				<template v-if="!disabled">
					<v-list-item clickable @click="activeDialog = 'upload'">
						<v-list-item-icon><v-icon name="phonelink" /></v-list-item-icon>
						<v-list-item-content>
							{{ t(file ? 'replace_from_device' : 'upload_from_device') }}
						</v-list-item-content>
					</v-list-item>

					<v-list-item clickable @click="activeDialog = 'choose'">
						<v-list-item-icon><v-icon name="folder_open" /></v-list-item-icon>
						<v-list-item-content>
							{{ t(file ? 'replace_from_library' : 'choose_from_library') }}
						</v-list-item-content>
					</v-list-item>

					<v-list-item clickable @click="activeDialog = 'url'">
						<v-list-item-icon><v-icon name="link" /></v-list-item-icon>
						<v-list-item-content>
							{{ t(file ? 'replace_from_url' : 'import_from_url') }}
						</v-list-item-content>
					</v-list-item>
				</template>
			</v-list>
		</v-menu>

		<drawer-item
			v-if="file"
			v-model:active="editDrawerActive"
			collection="directus_files"
			:primary-key="file.id"
			:edits="edits"
			@input="stageEdits"
		/>

		<v-dialog
			:model-value="activeDialog === 'upload'"
			@esc="activeDialog = null"
			@update:model-value="activeDialog = null"
		>
			<v-card>
				<v-card-title>{{ t('upload_from_device') }}</v-card-title>
				<v-card-text>
					<v-upload from-url :folder="folder" @input="onUpload" />
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="activeDialog = null">{{ t('cancel') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<drawer-collection
			v-if="activeDialog === 'choose'"
			collection="directus_files"
			:active="activeDialog === 'choose'"
			@update:active="activeDialog = null"
			@input="setSelection"
		/>

		<v-dialog
			:model-value="activeDialog === 'url'"
			:persistent="urlLoading"
			@update:model-value="activeDialog = null"
			@esc="activeDialog = null"
		>
			<v-card>
				<v-card-title>{{ t('import_from_url') }}</v-card-title>
				<v-card-text>
					<v-input v-model="url" autofocus :placeholder="t('url')" :nullable="false" :disabled="urlLoading" />
				</v-card-text>
				<v-card-actions>
					<v-button :disabled="urlLoading" secondary @click="activeDialog = null">
						{{ t('cancel') }}
					</v-button>
					<v-button :loading="urlLoading" :disabled="isValidURL === false" @click="importFromURL">
						{{ t('import_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, watch, computed, PropType } from 'vue';
import DrawerCollection from '@/views/private/components/drawer-collection';
import api from '@/api';
import readableMimeType from '@/utils/readable-mime-type';
import { getRootPath } from '@/utils/get-root-path';
import { unexpectedError } from '@/utils/unexpected-error';
import { addTokenToURL } from '@/api';
import DrawerItem from '@/views/private/components/drawer-item';
import { addQueryToPath } from '@/utils/add-query-to-path';

type FileInfo = {
	id: string;
	title: string;
	type: string;
};

export default defineComponent({
	components: { DrawerCollection, DrawerItem },
	props: {
		value: {
			type: [String, Object] as PropType<string | Record<string, any>>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		folder: {
			type: String,
			default: undefined,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const activeDialog = ref<'upload' | 'choose' | 'url' | null>(null);
		const { loading, file, fetchFile } = useFile();

		watch(() => props.value, fetchFile, { immediate: true });

		const fileExtension = computed(() => {
			if (file.value === null) return null;
			return readableMimeType(file.value.type, true);
		});

		const assetURL = computed(() => {
			const id = typeof props.value === 'string' ? props.value : props.value?.id;
			return addTokenToURL(getRootPath() + `assets/${id}`);
		});

		const imageThumbnail = computed(() => {
			if (file.value === null || props.value === null) return null;
			if (file.value.type.includes('svg')) return assetURL.value;
			if (file.value.type.includes('image') === false) return null;
			return addQueryToPath(assetURL.value, { key: 'system-small-cover' });
		});

		const { edits, stageEdits } = useEdits();
		const { url, isValidURL, loading: urlLoading, importFromURL } = useURLImport();

		const editDrawerActive = ref(false);

		return {
			t,
			activeDialog,
			setSelection,
			loading,
			file,
			fileExtension,
			imageThumbnail,
			onUpload,
			url,
			urlLoading,
			importFromURL,
			isValidURL,
			assetURL,
			editDrawerActive,
			edits,
			stageEdits,
		};

		function useFile() {
			const loading = ref(false);
			const file = ref<FileInfo | null>(null);

			return { loading, file, fetchFile };

			async function fetchFile() {
				if (props.value === null) {
					file.value = null;
					loading.value = false;
					return;
				}

				loading.value = true;

				try {
					const id = typeof props.value === 'string' ? props.value : (props.value as Record<string, any>)?.id;

					const response = await api.get(`/files/${id}`, {
						params: {
							fields: ['id', 'title', 'type', 'filename_download'],
						},
					});

					if (props.value !== null && typeof props.value === 'object') {
						file.value = {
							...response.data.data,
							...props.value,
						};
					} else {
						file.value = response.data.data;
					}
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function setSelection(selection: number[]) {
			if (selection[0]) {
				emit('input', selection[0]);
			} else {
				emit('input', null);
			}
		}

		function onUpload(fileInfo: FileInfo) {
			file.value = fileInfo;
			activeDialog.value = null;
			emit('input', fileInfo.id);
		}

		function useURLImport() {
			const url = ref('');
			const loading = ref(false);

			const isValidURL = computed(() => {
				try {
					new URL(url.value);
					return true;
				} catch {
					return false;
				}
			});

			return { url, loading, isValidURL, importFromURL };

			async function importFromURL() {
				loading.value = true;

				try {
					const response = await api.post(`/files/import`, {
						url: url.value,
						data: {
							folder: props.folder,
						},
					});

					file.value = response.data.data;

					activeDialog.value = null;
					url.value = '';
					emit('input', file.value?.id);
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useEdits() {
			const edits = computed(() => {
				// If the current value isn't a primitive, it means we've already staged some changes
				// This ensures we continue on those changes instead of starting over
				if (props.value && typeof props.value === 'object') {
					return props.value;
				}

				return {};
			});

			return { edits, stageEdits };

			function stageEdits(newEdits: Record<string, any>) {
				if (!file.value) return;

				emit('input', {
					id: file.value.id,
					...newEdits,
				});
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.preview {
	--v-icon-color: var(--foreground-subdued);

	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	margin-left: -8px;
	overflow: hidden;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	&.has-file {
		background-color: var(--primary-alt);
	}

	&.is-svg {
		padding: 4px;
		background-color: var(--background-normal-alt);

		img {
			object-fit: contain;
			filter: drop-shadow(0px 0px 8px rgb(0 0 0 / 0.25));
		}
	}
}

.extension {
	color: var(--primary);
	font-weight: 600;
	font-size: 11px;
	text-transform: uppercase;
}

.deselect:hover {
	--v-icon-color: var(--danger);
}

.edit {
	margin-right: 4px;

	&:hover {
		--v-icon-color: var(--foreground-normal);
	}
}
</style>
