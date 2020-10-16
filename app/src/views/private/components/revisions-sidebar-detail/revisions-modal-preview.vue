<template>
	<div>
		<v-modal-heading :heading="$t('revision_post_update')" :subheading="$t('no_relational_data')" />
		<v-form
			disabled
			:collection="revision.collection"
			:primary-key="revision.item"
			:initial-values="revision.data"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Revision } from './types';

export default defineComponent({
	props: {
		revision: {
			type: Object as PropType<Revision>,
			required: true,
		},
	},
});
</script>
