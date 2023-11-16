<script setup lang="ts">
import api, { addTokenToURL } from '@/api';
import { formatFilesize } from '@/utils/format-filesize';
import { getRootPath } from '@/utils/get-root-path';
import { localizedFormat } from '@/utils/localized-format';
import { readableMimeType } from '@/utils/readable-mime-type';
import { userName } from '@/utils/user-name';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { File } from '@directus/types';

const props = defineProps<{
	file: File | null;
	isNew: boolean;
}>();

const { t, n } = useI18n();
const { userCreated, userModified } = useUser();
const { folder, folderLink } = useFolder();

const size = computed(() => {
	if (props.isNew) return;
	if (!props.file?.filesize) return;

	return formatFilesize(props.file.filesize);
});

const fileLink = computed(() => {
	if (!props.file?.id) return;

	return addTokenToURL(`${getRootPath()}assets/${props.file.id}`);
});

const creationDate = computed(() => {
	if (!props.file?.uploaded_on) return;

	return localizedFormat(new Date(props.file.uploaded_on), String(t('date-fns_date_short')));
});

const modificationDate = computed(() => {
	if (!props.file?.modified_on) return;

	return localizedFormat(new Date(props.file.modified_on), String(t('date-fns_date_short')));
});

function useUser() {
	type User = {
		id: string;
		name: string;
		link: string;
	};

	const loading = ref(false);
	const userCreated = ref<User>();
	const userModified = ref<User>();

	watch(() => props.file, fetchUser, { immediate: true });

	return { userCreated, userModified };

	async function fetchUser() {
		if (!props.file) return;
		if (!props.file.uploaded_by) return;

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

		return `/files/folders/${folder.value.id}`;
	});

	watch(() => props.file, fetchFolder, { immediate: true });

	return { folder, folderLink };

	async function fetchFolder() {
		if (!props.file) return;
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
</script>

<template>
	<sidebar-detail icon="info" :title="t('file_details')" close>
		<dl v-if="file">
			<div v-if="file.type">
				<dt>{{ t('type') }}</dt>
				<dd>{{ readableMimeType(file.type) || file.type }}</dd>
			</div>

			<div v-if="file.width && file.height">
				<dt>{{ t('dimensions') }}</dt>
				<dd>{{ n(file.width) }} × {{ n(file.height) }}</dd>
			</div>

			<div v-if="file.duration">
				<dt>{{ t('duration') }}</dt>
				<dd>{{ n(file.duration) }}</dd>
			</div>

			<div v-if="file.filesize">
				<dt>{{ t('size') }}</dt>
				<dd>{{ size }}</dd>
			</div>

			<div v-if="file.charset">
				<dt>{{ t('charset') }}</dt>
				<dd>{{ file.charset }}</dd>
			</div>

			<div v-if="file.embed">
				<dt>{{ t('embed') }}</dt>
				<dd>{{ file.embed }}</dd>
			</div>

			<div v-if="creationDate">
				<dt>{{ t('created') }}</dt>
				<dd>{{ creationDate }}</dd>
			</div>

			<div v-if="userCreated">
				<dt>{{ t('owner') }}</dt>
				<dd>
					<user-popover :user="userCreated.id">
						<router-link :to="userCreated.link">{{ userCreated.name }}</router-link>
					</user-popover>
				</dd>
			</div>

			<div v-if="modificationDate">
				<dt>{{ t('modified') }}</dt>
				<dd>{{ modificationDate }}</dd>
			</div>

			<div v-if="userModified">
				<dt>{{ t('edited_by') }}</dt>
				<dd>
					<user-popover :user="userModified.id">
						<router-link :to="userModified.link">{{ userModified.name }}</router-link>
					</user-popover>
				</dd>
			</div>

			<div v-if="fileLink">
				<dt>{{ t('file') }}</dt>
				<dd>
					<a :href="fileLink" target="_blank">{{ t('open_in_new_window') }}</a>
				</dd>
			</div>

			<div>
				<dt>{{ t('folder') }}</dt>
				<dd>
					<router-link :to="folderLink">
						{{ t('open_folder', { folder: folder ? folder.name : t('file_library') }) }}
					</router-link>
				</dd>
			</div>

			<template
				v-if="
					file.metadata?.ifd0?.Make ||
					file.metadata?.ifd0?.Model ||
					file.metadata?.exif?.FNumber ||
					file.metadata?.exif?.ExposureTime ||
					file.metadata?.exif?.FocalLength ||
					file.metadata?.exif?.ISO
				"
			>
				<v-divider />

				<div v-if="file.metadata.ifd0?.Make && file.metadata.ifd0?.Model">
					<dt>{{ t('camera') }}</dt>
					<dd>{{ file.metadata.ifd0.Make }} {{ file.metadata.ifd0.Model }}</dd>
				</div>

				<div v-if="file.metadata.exif?.FNumber">
					<dt>{{ t('exposure') }}</dt>
					<dd>ƒ/{{ file.metadata.exif.FNumber }}</dd>
				</div>

				<div v-if="file.metadata.exif?.ExposureTime">
					<dt>{{ t('shutter') }}</dt>
					<dd>1/{{ Math.round(1 / +file.metadata.exif.ExposureTime) }} {{ t('second') }}</dd>
				</div>

				<div v-if="file.metadata.exif?.FocalLength">
					<dt>{{ t('focal_length') }}</dt>
					<dd>{{ file.metadata.exif.FocalLength }}mm</dd>
				</div>

				<div v-if="file.metadata.exif?.ISO">
					<dt>{{ t('iso') }}</dt>
					<dd>{{ file.metadata.exif.ISO }}</dd>
				</div>
			</template>
		</dl>

		<v-divider />

		<div v-md="t('page_help_files_item')" class="page-description" />
	</sidebar-detail>
</template>

<style lang="scss" scoped>
button {
	color: var(--theme--primary);
}

.v-divider {
	margin: 20px 0;
}
</style>
