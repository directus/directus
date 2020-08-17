<template>
	<drawer-detail icon="info_outline" :title="$t('information')" close>
		<dl v-if="project">
			<div>
				<dt>{{ $t('directus_version') }}</dt>
				<dd>{{ version }}</dd>
			</div>
			<div>
				<dt>{{ $t('installed_on') }}</dt>
				<dd>August 15, 2020</dd>
			</div>
			<div>
				<dt>{{ $t('operating_system') }}</dt>
				<dd>Ubuntu 8.0</dd>
			</div>
			<div>
				<dt>{{ $t('server_stack') }}</dt>
				<dd>Node.js 10.2</dd>
			</div>
			<div>
				<dt>{{ $t('database_client') }}</dt>
				<dd>MySQL 5.7</dd>
			</div>
			<div>
				<dt>{{ $t('database_host') }}</dt>
				<dd>Localhost</dd>
			</div>
			<div>
				<dt>{{ $t('database_port') }}</dt>
				<dd>3306</dd>
			</div>
		</dl>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import i18n from '@/lang';
import { version } from '../../../../../../package.json';

import bytes from 'bytes';

/**
 * @TODO
 * retrieve server info somewhere separate
 */

export default defineComponent({
	setup() {
		return { version, project: {}, bytes };
	},
});
</script>
