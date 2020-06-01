<template>
	<div class="requirements">
		<div class="pane-title type-title">{{ $t('requirements') }}</div>
		<div class="pane-content">
			<div class="loader" v-if="loading">
				<v-skeleton-loader v-for="n in 5" :key="n" />
			</div>
			<v-notice
				v-else
				v-for="requirement in requirements"
				:key="requirement.key"
				:type="requirement.success ? 'success' : 'warning'"
			>
				{{ requirement.value }}
			</v-notice>
		</div>
		<div class="pane-buttons">
			<v-button secondary @click="$emit('prev')">{{ $t('back') }}</v-button>
			<v-button @click="$emit('next')">{{ $t('next') }}</v-button>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import api from '@/api';
import { satisfies } from 'semver';
import i18n from '@/lang';

type ServerInfo = {
	server: {
		type: string;
	};
	php: {
		version: string;
		extensions: { [extension: string]: boolean };
	};
	permissions: { [folder: string]: string };
	directus: string;
};

export default defineComponent({
	props: {
		token: {
			type: String,
			default: undefined,
		},
	},
	setup(props) {
		const loading = ref(false);
		const error = ref(null);
		const serverInfo = ref<ServerInfo>(null);
		const lastTag = ref<string>(null);

		const requirements = computed(() => {
			if (serverInfo.value === null) return null;

			const phpVersion = serverInfo.value.php.version.split('-')[0];

			const extensions = Object.keys(serverInfo.value.php.extensions).map((key) => ({
				key,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				enabled: serverInfo.value!.php.extensions[key],
			}));

			const permissions = Object.keys(serverInfo.value?.permissions).map((key) => ({
				key,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				permission: serverInfo.value!.permissions[key],
			}));

			const failedPermissions = permissions.filter((p) => +p.permission[1] !== 7);

			return [
				{
					key: 'server',
					success: serverInfo.value?.server.type.toLowerCase().includes('apache'),
					value: serverInfo.value?.server.type,
				},
				{
					key: 'php',
					success: satisfies(phpVersion, '>=7.2.0'),
					value: `PHP ${phpVersion}`,
				},
				{
					key: 'extensions',
					success: extensions.every((e) => e.enabled),
					value: extensions.every((e) => e.enabled)
						? i18n.t('php_extensions')
						: i18n.t('missing_value', {
								value: extensions.filter((e) => e.enabled === false).map((e) => e.key),
						  }),
				},
				{
					key: 'permissions',
					success: failedPermissions.length === 0,
					value:
						failedPermissions.length === 0
							? i18n.t('write_access')
							: i18n.t('value_not_writeable', {
									value: failedPermissions.map((f) => `/${f.key}`).join(', '),
							  }),
				},
				{
					key: 'version',
					success: 'v' + serverInfo.value.directus === lastTag.value,
					value: i18n.t('directus_version') + ': v' + serverInfo.value.directus,
				},
			];
		});

		getServerInfo();

		return { loading, error, requirements };

		async function getServerInfo() {
			loading.value = true;

			try {
				const infoResponse = await api.get('/server/info', {
					params: props.token
						? {
								super_admin_token: props.token,
						  }
						: null,
				});

				const ghResponse = await api.get('https://api.github.com/repos/directus/directus/tags');

				serverInfo.value = infoResponse.data.data;
				lastTag.value = ghResponse.data[0].name;
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
.v-notice,
.v-skeleton-loader {
	margin-bottom: 12px;
}
</style>
