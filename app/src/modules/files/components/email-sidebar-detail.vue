<template>
	<sidebar-detail icon="mail" title="Send Email">
		<div class="fields">
            <div class="field full">
                <dt>To</dt>
                <interface-tags
                    :value="emails"
                    @input="updateEmails"
                />
			</div>
			<div class="field full">
                <dt>Subject</dt>
                <v-input
                    v-model="subject"
                    label="Subject"
                    trim
                />
			</div>
            <div class="field full">
                <dt>Body</dt>
                <v-textarea v-model="body" />
			</div>
		</div>
        <div class="actions">
            <v-button @click="sendEmail" :loading="sending">Send</v-button>
        </div>

        <v-divider />

        <div class="page-description">
            <p>
                The current file will be attached to your email.
                You can use variables such as \{\{ file.title }} in your email.
            </p>
        </div>
	</sidebar-detail>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	collection?: string;
    primaryKey?: string | number;
}>();

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const subject = ref<string | null>(null);
const emails = ref<string[] | null>(null);
const body = ref<string | null>(null);
const sending = ref<boolean>(false);

function updateEmails(val: string[] | null) {
    if (val === null) {
        emails.value = null;
        return;
    }
    const validEmails = val.filter((email) => {
        console.log('Email', email, emailRegex.test(email));
        return emailRegex.test(email);
    });
    emails.value = validEmails;
}

async function sendEmail() {
    sending.value = true;
    setTimeout(() => {
        sending.value = false;
    }, 2000);
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}
.actions {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
}

.page-description {
    margin-top: 24px;
}
</style>
