<script setup lang="ts">
import api from '@/api';
import { formatFilesize } from '@/utils/format-filesize';
import { getAssetUrl } from '@/utils/get-asset-url';
import { localizedFormat } from '@/utils/localized-format';
import { readableMimeType } from '@/utils/readable-mime-type';
import { userName } from '@/utils/user-name';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { File } from '@directus/types';
import { useClipboard } from '@/composables/use-clipboard';

const props = defineProps<{
	file: File | null;
	isNew: boolean;
}>();

const { t, n, d } = useI18n();
const { userCreated, userModified } = useUser();
const { folder, folderLink } = useFolder();

const size = computed(() => {
	if (props.isNew) return;
	if (!props.file?.filesize) return;

	return formatFilesize(props.file.filesize);
});

const fileLink = computed(() => {
	if (!props.file?.id) return;

	return getAssetUrl(props.file.id);
});

const creationDate = computed(() => ({
	short: localizedFormat(new Date(props.file.created_on), String(t('date-fns_date_short'))),
	long: d(props.file.created_on, 'long'),
}));

const uploadDate = computed(() => {
	if (!props.file?.uploaded_on) return;

	return {
		short: localizedFormat(new Date(props.file.uploaded_on), String(t('date-fns_date_short'))),
		long: d(props.file.uploaded_on, 'long'),
	};
});

const modificationDate = computed(() => {
	if (!props.file?.modified_on) return;

	return {
		short: localizedFormat(new Date(props.file.modified_on), String(t('date-fns_date_short'))),
		long: d(props.file.modified_on, 'long'),
	};
});

const imageMetadata = computed(() => {
	const metadata = props.file?.metadata;

	if (!metadata) return;

	const { ifd0, exif } = metadata;

	return {
		Make: ifd0?.Make,
		Model: ifd0?.Model,
		FNumber: exif?.FNumber,
		ExposureTime: exif?.ExposureTime,
		FocalLength: exif?.FocalLength,
		ISO: exif?.ISO ?? exif?.ISOSpeedRatings,
	};
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

const { copyToClipboard } = useClipboard();

async function copyFileId() {
	if (!props.file?.id) return;

	await copyToClipboard(props.file.id, {
		success: t('copy_id_success'),
		fail: t('copy_id_fail'),
	});
}
</script>

<template>
	<sidebar-detail id="file-info" icon="info" :title="t('file_details')" close>
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
				<dd>
					<span v-tooltip="creationDate.long">{{ creationDate.short }}</span>
				</dd>
			</div>

			<div v-if="userCreated">
				<dt>{{ t('owner') }}</dt>
				<dd>
					<user-popover :user="userCreated.id">
						<router-link :to="userCreated.link">{{ userCreated.name }}</router-link>
					</user-popover>
				</dd>
			</div>

			<div v-if="uploadDate">
				<dt>{{ t('uploaded') }}</dt>
				<dd>
					<span v-tooltip="uploadDate.long">{{ uploadDate.short }}</span>
				</dd>
			</div>

			<div v-if="modificationDate">
				<dt>{{ t('modified') }}</dt>
				<dd>
					<span v-tooltip="modificationDate.long">{{ modificationDate.short }}</span>
				</dd>
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

			<div v-if="file?.id" class="copy-id">
				<dt>{{ t('copy_id') }}</dt>
				<dd>
					<v-button icon secondary small class="copy-id-button" @click="copyFileId">
						<v-icon small name="content_copy" outline />
					</v-button>
				</dd>
			</div>

			<template v-if="imageMetadata">
				<v-divider />

				<div v-if="imageMetadata.Make && imageMetadata.Model">
					<dt>{{ t('camera') }}</dt>
					<dd>{{ imageMetadata.Make }} {{ imageMetadata.Model }}</dd>
				</div>

				<div v-if="imageMetadata.FNumber">
					<dt>{{ t('exposure') }}</dt>
					<dd>ƒ/{{ imageMetadata.FNumber }}</dd>
				</div>

				<div v-if="imageMetadata.ExposureTime">
					<dt>{{ t('shutter') }}</dt>
					<dd>1/{{ Math.round(1 / +imageMetadata.ExposureTime) }} {{ t('second') }}</dd>
				</div>

				<div v-if="imageMetadata.FocalLength">
					<dt>{{ t('focal_length') }}</dt>
					<dd>{{ imageMetadata.FocalLength }}mm</dd>
				</div>

				<div v-if="imageMetadata.ISO">
					<dt>{{ t('iso') }}</dt>
					<dd>{{ imageMetadata.ISO }}</dd>
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

.copy-id {
	display: flex;
	align-items: flex-start;

	:deep(.button) {
		block-size: auto;
		inline-size: auto;
	}
}
</style>
