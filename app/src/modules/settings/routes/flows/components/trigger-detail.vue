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
        text: t('triggers.filter'),
        value: 'filter',
        icon: 'add',
        description: t('triggers.filter_description')
    },
    {
        text: t('triggers.action'),
        value: 'action',
        icon: 'add',
        description: t('triggers.action_description')
    },
    {
        text: t('triggers.init'),
        value: 'init',
        icon: 'add',
        description: t('triggers.init_description')
    },
    {
        text: t('triggers.operation'),
        value: 'operation',
        icon: 'add',
        description: t('triggers.operation_description')
    },
    {
        text: t('triggers.schedule'),
        value: 'schedule',
        icon: 'add',
        description: t('triggers.schedule_description')
    },
    {
        text: t('triggers.webhook'),
        value: 'webhook',
        icon: 'add',
        description: t('triggers.webhook_description')
    }
])

const triggerFields = ref<Record<TriggerType, DeepPartial<Field>[]>>({
    filter: [
        {
            field: 'event',
            name: t('event'),
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
            name: t('event'),
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
            name: t('event'),
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
            name: t('cron'),
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