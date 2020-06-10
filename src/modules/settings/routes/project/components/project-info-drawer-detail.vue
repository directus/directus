<template>
	<drawer-detail icon="info_outline" :title="$t('information')" close>
		<dl v-if="project">
			<div>
				<dt>{{ $t('php_api') }}</dt>
				<dd>{{ project.server.general.php_api }}</dd>
			</div>
			<div>
				<dt>{{ $t('php_version') }}</dt>
				<dd>{{ project.server.general.php_version.split('-')[0] }}</dd>
			</div>
			<div>
				<dt>{{ $t('max_upload_size') }}</dt>
				<dd>{{ bytes(project.server.max_upload_size) }}</dd>
			</div>
		</dl>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import bytes from 'bytes';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();

		return { project: projectsStore.currentProject, bytes };
	},
});
</script>
