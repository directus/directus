<template>
    <v-drawer
        v-model="open"
        :title="'Change the Trigger'"
        :subtitle="t('panel_options')"
        :icon="'insert_chart'"
        persistent
        @cancel="$emit('update:open', false)"
    >
        <template #actions>
			<v-button v-tooltip.bottom="t('done')" icon rounded @click="saveTrigger">
				<v-icon name="check" />
			</v-button>
		</template>

        <div class="content">
            <v-fancy-select v-model="flowEdits.trigger" class="select" :items="triggerTypes" />

            <v-form
                v-if="flowEdits.trigger"
                v-model="flowEdits.options"
                class="extension-options"
                :fields="triggerFields[flowEdits.trigger]"
                primary-key="+"
            />
        </div>
    </v-drawer>
</template>

<script setup lang="ts">import { DeepPartial, Field, FlowRaw, TriggerType } from '@directus/shared/types';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
    open: boolean,
    flow?: FlowRaw
}>()
const emit = defineEmits(['update:open', 'update:flow'])

const flowEdits = ref<{
    trigger?: TriggerType,
    options?: Record<string, any>
}>({})

function saveTrigger() {
    emit('update:flow', {
        ...props.flow ?? {},
        ...flowEdits.value
    })
    emit('update:open', false)
}

const triggerTypes = ref<{ text: string, value: TriggerType, icon: string, description: string }[]>([
    {
        text: t('triggers.filter.name'),
        value: 'filter',
        icon: 'add',
        description: t('triggers.filter.description')
    },
    {
        text: t('triggers.action.name'),
        value: 'action',
        icon: 'add',
        description: t('triggers.action.description')
    },
    {
        text: t('triggers.init.name'),
        value: 'init',
        icon: 'add',
        description: t('triggers.init.description')
    },
    {
        text: t('triggers.operation.name'),
        value: 'operation',
        icon: 'add',
        description: t('triggers.operation.description')
    },
    {
        text: t('triggers.schedule.name'),
        value: 'schedule',
        icon: 'add',
        description: t('triggers.schedule.description')
    },
    {
        text: t('triggers.webhook.name'),
        value: 'webhook',
        icon: 'add',
        description: t('triggers.webhook.description')
    }
])

const triggerFields = ref<Record<TriggerType, DeepPartial<Field>[]>>({
    filter: [
        {
            field: 'event',
            name: t('triggers.filter.event'),
            type: 'string',
            meta: {
                width: 'full',
                interface: 'input'
            }
        }
    ],
    action: [
        {
            field: 'event',
            name: t('triggers.action.event'),
            type: 'string',
            meta: {
                width: 'full',
                interface: 'input'
            }
        }
    ],
    init: [
        {
            field: 'event',
            name: t('triggers.init.event'),
            type: 'string',
            meta: {
                width: 'full',
                interface: 'input'
            }
        }
    ],
    schedule: [
        {
            field: 'cron',
            name: t('triggers.schedule.cron'),
            type: 'string',
            meta: {
                width: 'full',
                interface: 'input'
            }
        }
    ],
    operation: [],
    webhook: [],
})
</script>

<style scoped lang="scss">
@import '@/styles/mixins/form-grid';

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);

	.grid {
		@include form-grid;
	}
}

.v-divider {
	margin: 52px 0;
}
.type-label {
	margin-bottom: 8px;
}

.type-title,
.select {
	margin-bottom: 32px;
}

.not-found {
	.spacer {
		flex-grow: 1;
	}

	button {
		text-decoration: underline;
	}
}

.v-notice {
	margin-bottom: 36px;
}
</style>