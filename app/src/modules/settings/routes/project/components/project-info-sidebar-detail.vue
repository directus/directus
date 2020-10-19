<template>
	<sidebar-detail icon="info_outline" :title="$t('information')" close>
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
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import i18n from '@/lang';
import marked from 'marked';
import { version } from '../../../../../../package.json';
import bytes from 'bytes';
import prettyMS from 'pretty-ms';
import api from '@/api';
import { useProjectInfo } from '../../../composables/use-project-info';

export default defineComponent({
	setup() {
		const { parsedInfo } = useProjectInfo();

		return { parsedInfo, marked };
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}
</style>
