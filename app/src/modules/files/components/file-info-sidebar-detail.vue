<template>
	<sidebar-detail icon="info_outline" :title="$t('file_details')" close>
		<dl v-if="file">
			<div v-if="file.type">
				<dt>{{ $t('type') }}</dt>
				<dd>{{ readableMimeType(file.type) || file.type }}</dd>
			</div>

			<div v-if="file.width && file.height">
				<dt>{{ $t('dimensions') }}</dt>
				<dd>{{ $n(file.width) }} × {{ $n(file.height) }}</dd>
			</div>

			<div v-if="file.duration">
				<dt>{{ $t('duration') }}</dt>
				<dd>{{ $n(file.duration) }}</dd>
			</div>

			<div v-if="file.filesize">
				<dt>{{ $t('size') }}</dt>
				<dd>{{ size }}</dd>
			</div>

			<div v-if="file.charset">
				<dt>{{ $t('charset') }}</dt>
				<dd>{{ charset }}</dd>
			</div>

			<div v-if="file.embed">
				<dt>{{ $t('embed') }}</dt>
				<dd>{{ embed }}</dd>
			</div>

			<div v-if="creationDate">
				<dt>{{ $t('created') }}</dt>
				<dd>{{ creationDate }}</dd>
			</div>

			<div v-if="file.checksum" class="checksum">
				<dt>{{ $t('checksum') }}</dt>
				<dd>{{ file.checksum }}</dd>
			</div>

			<div v-if="userCreated">
				<dt>{{ $t('owner') }}</dt>
				<dd>
					<user-popover :user="userCreated.id">
						<router-link :to="userCreated.link">{{ userCreated.name }}</router-link>
					</user-popover>
				</dd>
			</div>

			<div v-if="modificationDate">
				<dt>{{ $t('modified') }}</dt>
				<dd>{{ modificationDate }}</dd>
			</div>

			<div v-if="userModified">
				<dt>{{ $t('edited_by') }}</dt>
				<dd>
					<user-popover :user="userModified.id">
						<router-link :to="userModified.link">{{ userModified.name }}</router-link>
					</user-popover>
				</dd>
			</div>

			<div>
				<dt>{{ $t('file') }}</dt>
				<dd>
					<a :href="fileLink" target="_blank">{{ $t('open_in_new_window') }}</a>
				</dd>
			</div>

			<div>
				<dt>{{ $t('folder') }}</dt>
				<dd>
					<router-link :to="folderLink">
						{{ $t('open') }} "{{ folder ? folder.name : $t('file_library') }}" {{ $t('folder') }}
					</router-link>
				</dd>
			</div>

			<template v-if="file.metadata && file.metadata.exif && file.metadata.exif.exif && file.metadata.exif.image">
				<v-divider />

				<div v-if="file.metadata.exif.image.Make && file.metadata.exif.image.Model">
					<dt>{{ $t('camera') }}</dt>
					<dd>{{ file.metadata.exif.image.Make }} {{ file.metadata.exif.image.Model }}</dd>
				</div>

				<div v-if="file.metadata.exif.exif.FNumber">
					<dt>{{ $t('exposure') }}</dt>
					<dd>ƒ/{{ file.metadata.exif.exif.FNumber }}</dd>
				</div>

				<div v-if="file.metadata.exif.exif.ExposureTime">
					<dt>{{ $t('shutter') }}</dt>
					<dd>1/{{ Math.round(1 / +file.metadata.exif.exif.ExposureTime) }} {{ $t('second') }}</dd>
				</div>

				<div v-if="file.metadata.exif.exif.FocalLength">
					<dt>{{ $t('focal_length') }}</dt>
					<dd>{{ file.metadata.exif.exif.FocalLength }}mm</dd>
				</div>

				<div v-if="file.metadata.exif.exif.ISO">
					<dt>{{ $t('iso') }}</dt>
					<dd>{{ file.metadata.exif.exif.ISO }}</dd>
				</div>
			</template>
		</dl>

		<v-divider />

		<div class="page-description" v-html="marked($t('page_help_files_item'))" />
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from '@vue/composition-api';
import readableMimeType from '../../../utils/readable-mime-type';
import bytes from 'bytes';
import i18n from '../../../lang';
import marked from 'marked';
import localizedFormat from '../../../utils/localized-format';
import api, { addTokenToURL } from '../../../api';
import { getRootPath } from '../../../utils/get-root-path';
import { userName } from '../../../utils/user-name';

export default defineComponent({
	inheritAttrs: false,
	props: {
		file: {
			type: Object,
			default: () => ({}),
		},
		isNew: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const size = computed(() => {
			if (props.isNew) return null;
			if (!props.file) return null;
			if (!props.file.filesize) return null;

			return bytes(props.file.filesize, { decimalPlaces: 2, unitSeparator: ' ' }); // { locale: i18n.locale.split('-')[0] }
		});

		const { creationDate, modificationDate } = useDates();
		const { userCreated, userModified } = useUser();
		const { folder, folderLink } = useFolder();

		const fileLink = computed(() => {
			return addTokenToURL(`${getRootPath()}assets/${props.file.id}`);
		});

		return {
			readableMimeType,
			size,
			creationDate,
			modificationDate,
			userCreated,
			userModified,
			folder,
			marked,
			folderLink,
			getRootPath,
			fileLink,
		};

		function useDates() {
			const creationDate = ref<string | null>(null);
			const modificationDate = ref<string | null>(null);

			watch(
				() => props.file,
				async () => {
					if (!props.file) return null;

					creationDate.value = await localizedFormat(
						new Date(props.file.uploaded_on),
						String(i18n.t('date-fns_date_short'))
					);

					if (props.file.modified_on) {
						modificationDate.value = await localizedFormat(
							new Date(props.file.modified_on),
							String(i18n.t('date-fns_date_short'))
						);
					}
				},
				{ immediate: true }
			);

			return { creationDate, modificationDate };
		}

		function useUser() {
			type User = {
				id: number;
				name: string;
				link: string;
			};

			const loading = ref(false);
			const userCreated = ref<User | null>(null);
			const userModified = ref<User | null>(null);

			watch(() => props.file, fetchUser, { immediate: true });

			return { userCreated, userModified };

			async function fetchUser() {
				if (!props.file) return null;
				if (!props.file.uploaded_by) return null;

				loading.value = true;

				try {
					const response = await api.get(`/users/${props.file.uploaded_by}`, {
						params: {
							fields: ['id', 'email', 'first_name', 'last_name', 'role'],
						},
					});

					const user = response.data.data;

					userCreated.value = {
						id: props.file.uploaded_by,
						name: userName(user),
						link: `/users/${user.id}`,
					};

					if (props.file.modified_by) {
						const response = await api.get(`/users/${props.file.modified_by}`, {
							params: {
								fields: ['id', 'email', 'first_name', 'last_name', 'role'],
							},
						});

						const user = response.data.data;

						userModified.value = {
							id: props.file.modified_by,
							name: userName(user),
							link: `/users/${user.id}`,
						};
					}
				} finally {
					loading.value = false;
				}
			}
		}

		function useFolder() {
			type Folder = {
				id: string;
				name: string;
			};

			const loading = ref(false);
			const folder = ref<Folder | null>(null);

			const folderLink = computed(() => {
				if (folder.value === null) {
					return `/files`;
				}
				return `/files/?folder=${folder.value.id}`;
			});

			watch(() => props.file, fetchFolder, { immediate: true });

			return { folder, folderLink };

			async function fetchFolder() {
				if (!props.file) return null;
				if (!props.file.folder) return;
				loading.value = true;
				try {
					const response = await api.get(`/folders/${props.file.folder}`, {
						params: {
							fields: ['id', 'name'],
						},
					});

					const { name } = response.data.data;

					folder.value = {
						id: props.file.folder,
						name: name,
					};
				} finally {
					loading.value = false;
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.checksum {
	dd {
		font-family: var(--family-monospace);
	}
}

button {
	color: var(--primary);
}

.v-divider {
	margin: 20px 0;
}
</style>
