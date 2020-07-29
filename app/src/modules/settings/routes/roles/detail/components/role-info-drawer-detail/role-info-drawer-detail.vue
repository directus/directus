<template>
	<drawer-detail icon="info_outline" :title="$t('information')" close>
		<dl v-if="!isNew && role">
			<div>
				<dt>{{ $t('primary_key') }}</dt>
				<dd>{{ role.id }}</dd>
			</div>
		</dl>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		isNew: {
			type: Boolean,
			default: false,
		},
		role: {
			type: Object as PropType<any>,
			default: null,
		},
	},
});
</script>
