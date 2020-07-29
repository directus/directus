<template>
	<drawer-detail icon="info_outline" :title="$t('information')" close>
		<dl v-if="project">
			<!-- @todo -->
		</dl>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import bytes from 'bytes';

/**
 * @TODO
 * retrieve server info somewhere separate
 */

export default defineComponent({
	setup() {
		return { project: {}, bytes };
	},
});
</script>
