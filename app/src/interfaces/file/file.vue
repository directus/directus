<template>
	<div class="file">
		<v-menu attached :disabled="disabled || loading">
			<template #activator="{ toggle }">
				<div>
					<v-skeleton-loader type="input" v-if="loading" />
					<v-input
						v-else
						@click="toggle"
						readonly
						:placeholder="$t('no_file_selected')"
						:disabled="disabled"
						:value="file && file.title"
					>
						<template #prepend>
							<div
								class="preview"
								:class="{
									'has-file': file,
									'is-svg': file && file.type.includes('svg'),
								}"
							>
								<img v-if="imageThumbnail" :src="imageThumbnail" :alt="file.title" />
								<span class="extension" v-else-if="fileExtension">
									{{ fileExtension }}
								</span>
								<v-icon v-else name="folder_open" />
							</div>
						</template>
						<template #append>
							<template v-if="file">
								<v-icon name="open_in_new" class="edit" v-tooltip="$t('edit')" @click.stop="editDrawerActive = true" />
								<v-icon class="deselect" name="close" @click.stop="$emit('input', null)" v-tooltip="$t('deselect')" />
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
						<v-list-item-content>{{ $t('download_file') }}</v-list-item-content>
					</v-list-item>

					<v-divider />
				</template>
				<v-list-item @click="activeDialog = 'upload'">
					<v-list-item-icon><v-icon name="phonelink" /></v-list-item-icon>
					<v-list-item-content>
						{{ $t(file ? 'replace_from_device' : 'upload_from_device') }}
					</v-list-item-content>
				</v-list-item>

				<v-list-item @click="activeDialog = 'choose'">
					<v-list-item-icon><v-icon name="folder_open" /></v-list-item-icon>
					<v-list-item-content>
						{{ $t(file ? 'replace_from_library' : 'choose_from_library') }}
					</v-list-item-content>
				</v-list-item>

				<v-list-item @click="activeDialog = 'url'">
					<v-list-item-icon><v-icon name="link" /></v-list-item-icon>
					<v-list-item-content>
						{{ $t(file ? 'replace_from_url' : 'import_from_url') }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>

		<drawer-item
			v-if="!disabled && file"
			:active.sync="editDrawerActive"
			collection="directus_files"
			:primary-key="file.id"
			:edits="edits"
			@input="stageEdits"
		/>

		<v-dialog :active="activeDialog === 'upload'" @esc="activeDialog = null" @toggle="activeDialog = null">
			<v-card>
				<v-card-title>{{ $t('upload_from_device') }}</v-card-title>
				<v-card-text>
					<v-upload @input="onUpload" from-url />
				</v-card-text>
				<v-card-actions>
					<v-button @click="activeDialog = null" secondary>{{ $t('cancel') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<drawer-collection
			collection="directus_files"
			:active="activeDialog === 'choose'"
			@update:active="activeDialog = null"
			@input="setSelection"
		/>

		<v-dialog
			:active="activeDialog === 'url'"
			@toggle="activeDialog = null"
			@esc="activeDialog = null"
			:persistent="urlLoading"
		>
			<v-card>
				<v-card-title>{{ $t('import_from_url') }}</v-card-title>
				<v-card-text>
					<v-input :placeholder="$t('url')" v-model="url" :nullable="false" :disabled="urlLoading" />
				</v-card-text>
				<v-card-actions>
					<v-button :disabled="urlLoading" @click="activeDialog = null" secondary>
						{{ $t('cancel') }}
					</v-button>
					<v-button :loading="urlLoading" @click="importFromURL" :disabled="isValidURL === false">
						{{ $t('import') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from '@vue/composition-api';
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
			type: [String, Object],
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const activeDialog = ref<'upload' | 'choose' | 'url' | null>(null);
		const { loading, file, fetchFile } = useFile();

		watch(() => props.value, fetchFile, { immediate: true });

		const fileExtension = computed(() => {
			if (file.value === null) return null;
			return readableMimeType(file.value.type, true);
		});

		const assetURL = computed(() => {
			const id = typeof props.value === 'string' ? props.value : (props.value as Record<string, any>)?.id;
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
				} catch (err) {
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
					});

					file.value = response.data.data;

					activeDialog.value = null;
					url.value = '';
					emit('input', file.value?.id);
				} catch (err) {
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
			filter: drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.25));
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
