<template>
	<drawer-detail icon="info_outline" :title="$t('information')" close>
		<dl v-if="parsedInfo">
			<div>
				<dt>{{ $t('directus_version') }}</dt>
				<dd>{{ parsedInfo.directus.version }}</dd>
			</div>
			<div>
				<dt>{{ $t('node_version') }}</dt>
				<dd>{{ parsedInfo.node.version }}</dd>
			</div>
			<div>
				<dt>{{ $t('node_uptime') }}</dt>
				<dd>{{ parsedInfo.node.uptime }}</dd>
			</div>
			<div>
				<dt>{{ $t('os_type') }}</dt>
				<dd>{{ parsedInfo.os.type }}</dd>
			</div>
			<div>
				<dt>{{ $t('os_version') }}</dt>
				<dd>{{ parsedInfo.os.version }}</dd>
			</div>
			<div>
				<dt>{{ $t('os_uptime') }}</dt>
				<dd>{{ parsedInfo.os.uptime }}</dd>
			</div>
			<div>
				<dt>{{ $t('os_totalmem') }}</dt>
				<dd>{{ parsedInfo.os.totalmem }}</dd>
			</div>
		</dl>

		<v-divider />

		<div class="page-description" v-html="marked($t('page_help_settings_project'))" />
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import i18n from '@/lang';
import marked from 'marked';
import { version } from '../../../../../../package.json';
import bytes from 'bytes';
import prettyMS from 'pretty-ms';
import api from '@/api';

type ServerInfo = {
	directus: {
		version: string;
	};
	node: {
		version: string;
		uptime: number;
	};
	os: {
		type: string;
		version: string;
		uptime: number;
		totalmem: number;
	};
};

export default defineComponent({
	setup() {
		const info = ref<ServerInfo>();
		const loading = ref(false);
		const error = ref<any>();

		const parsedInfo = computed(() => {
			if (!info.value) return null;

			return {
				directus: {
					version: info.value.directus.version,
				},
				node: {
					version: info.value.node.version,
					uptime: prettyMS(info.value.node.uptime * 1000),
				},
				os: {
					type: info.value.os.type,
					version: info.value.os.version,
					uptime: prettyMS(info.value.os.uptime * 1000),
					totalmem: bytes(info.value.os.totalmem),
				},
			};
		});

		fetchInfo();

		return { parsedInfo, loading, error, marked };

		async function fetchInfo() {
			loading.value = true;
			error.value = null;

			try {
				const response = await api.get('/server/info');
				info.value = response.data.data;
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
.v-divider {
	margin: 20px 0;
}
</style>
