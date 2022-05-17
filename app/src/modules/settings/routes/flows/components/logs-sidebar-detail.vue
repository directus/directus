<template>
	<sidebar-detail :title="t('logs')" icon="fact_check" :badge="5">
		{{ revisions }}
	</sidebar-detail>
</template>

<script lang="ts" setup>
import { useRevisions } from '@/composables/use-revisions';
import { Action, FlowRaw } from '@directus/shared/types';
import { computed, ref, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
	flow: FlowRaw;
}

const props = defineProps<Props>();

const { flow } = toRefs(props);

const { revisions } = useRevisions(
	ref('directus_flows'),
	computed(() => unref(flow).id),
	{
		action: Action.RUN,
	}
);
</script>

<style lang="scss" scoped></style>
