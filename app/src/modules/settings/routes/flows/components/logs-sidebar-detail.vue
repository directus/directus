<template>
	<sidebar-detail :title="t('logs')" icon="fact_check" :badge="revisionsCount">
		<v-detail
			v-for="group in revisionsByDate"
			:key="group.dateFormatted"
			:label="group.dateFormatted"
			class="revisions-date-group"
			start-open
		>
			<div class="scroll-container">
				<p v-for="revision in group.revisions" :key="revision.id" @click="previewing = revision">
					{{ getTime(revision.activity.timestamp) }}
				</p>
			</div>
		</v-detail>
	</sidebar-detail>

	<v-drawer
		:model-value="!!previewing"
		:title="previewing?.timestamp ?? t('logs')"
		@cancel="previewing = null"
		@esc="previewing = null"
	>
		<div class="content">
			<div v-for="[key, value] of valuePreviews" :key="key" class="operation-data">
				<p class="key type-label">{{ key }}</p>
				<pre class="json selectable">{{ value }}</pre>
			</div>
		</div>
	</v-drawer>
</template>

<script lang="ts" setup>
import { useRevisions } from '@/composables/use-revisions';
import { Action, FlowRaw } from '@directus/shared/types';
import { computed, ref, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';

const { t } = useI18n();

interface Props {
	flow: FlowRaw;
}

const props = defineProps<Props>();

const { flow } = toRefs(props);

const { revisionsByDate, revisionsCount } = useRevisions(
	ref('directus_flows'),
	computed(() => unref(flow).id),
	{
		action: Action.RUN,
	}
);

const previewing = ref();

const valuePreviews = computed(() => {
	if (!unref(previewing)) return [];

	return Object.entries(unref(previewing).data).filter(([key, value]) => key.startsWith('$') === false && value);
});

function getTime(timestamp: string) {
	return format(new Date(timestamp), String(t('date-fns_time')));
}
</script>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
}

.operation-data + .operation-data {
	border-top: var(--border-width) solid var(--border-normal);
	margin-top: 20px;
	padding-top: 20px;
}

.json {
	background-color: var(--background-subdued);
	font-family: var(--family-monospace);
	border-radius: var(--border-radius);
	padding: 20px;
	margin-top: 20px;
}
</style>
