<template>
	<drawer-detail icon="info_outline" :title="$t('file_details')" close>
		<dl>
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

			<div v-if="creationDate">
				<dt>{{ $t('created') }}</dt>
				<dd>{{ creationDate }}</dd>
			</div>

			<div v-if="file.checksum" class="checksum">
				<dt>{{ $t('checksum') }}</dt>
				<dd>{{ file.checksum }}</dd>
			</div>

			<div v-if="user">
				<dt>{{ $t('user') }}</dt>
				<dd>
					<router-link :to="user.link">{{ user.name }}</router-link>
				</dd>
			</div>

			<div v-if="folder">
				<dt>{{ $t('folder') }}</dt>
				<dd>{{ folder.name }}</dd>
			</div>
		</dl>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from '@vue/composition-api';
import readableMimeType from '@/utils/readable-mime-type';
import bytes from 'bytes';
import i18n from '@/lang';
import localizedFormat from '@/utils/localized-format';
import useProjectsStore from '@/stores/projects';
import api from '@/api';

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
		const projectsStore = useProjectsStore();

		const size = computed(() => {
			if (props.isNew) return null;
			if (!props.file) return null;
			if (!props.file.filesize) return null;

			return bytes(props.file.filesize, { decimalPlaces: 2, unitSeparator: ' ' }); // { locale: i18n.locale.split('-')[0] }
		});

		const { creationDate } = useCreationDate();
		const { user } = useUser();
		const { folder } = useFolder();

		return { readableMimeType, size, creationDate, user, folder };

		function useCreationDate() {
			const creationDate = ref<string | null>(null);

			watch(
				() => props.file,
				async () => {
					creationDate.value = await localizedFormat(
						new Date(props.file.uploaded_on),
						String(i18n.t('date-fns_date_short'))
					);
				},
				{ immediate: true }
			);

			return { creationDate };
		}

		function useUser() {
			type User = {
				id: number;
				name: string;
				link: string;
			};

			const loading = ref(false);
			const user = ref<User | null>(null);

			watch(() => props.file, fetchUser, { immediate: true });

			return { user };

			async function fetchUser() {
				loading.value = true;
				const { currentProjectKey } = projectsStore.state;

				try {
					const response = await api.get(`/${currentProjectKey}/users/${props.file.uploaded_by}`, {
						params: {
							fields: ['id', 'first_name', 'last_name', 'role'],
						},
					});

					const { id, first_name, last_name, role } = response.data.data;

					user.value = {
						id: props.file.uploaded_by,
						name: first_name + ' ' + last_name,
						link: `/${currentProjectKey}/users/${role}/${id}`,
					};
				} finally {
					loading.value = false;
				}
			}
		}

		function useFolder() {
			type Folder = {
				id: number;
				name: string;
			};

			const loading = ref(false);
			const folder = ref<Folder | null>(null);

			watch(() => props.file, fetchFolder, { immediate: true });

			return { folder };

			async function fetchFolder() {
				loading.value = true;
				const { currentProjectKey } = projectsStore.state;

				try {
					const response = await api.get(`/${currentProjectKey}/folders/${props.file.folder}`, {
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
dl > div {
	display: flex;
	margin-bottom: 12px;
}

dt,
dd {
	display: inline-block;
}

dt {
	margin-right: 8px;
	font-weight: 600;
}

dd {
	flex-grow: 1;
	overflow: hidden;
	color: var(--foreground-subdued);
	white-space: nowrap;
	text-overflow: ellipsis;
}

dd a {
	color: var(--primary-key);
}

.checksum {
	dd {
		font-family: var(--family-monospace);
	}
}
</style>
