<script setup>
import { onMounted } from 'vue';

onMounted(() => {
	const script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'https://js.hsforms.net/forms/embed/v2.js';

	script.onload = () => {
		// @ts-ignore - HubSpot is not typed
		hbspt.forms.create({
			region: 'na1',
			portalId: '20534155',
			formId: 'd57a69e4-6f43-4768-a600-5f7d30306260',
			target: '#nl-form',
		});
	};

	document.body.appendChild(script);
});
</script>

<template>
	<div id="nl">
		<h2>Newsletter</h2>
		<p>Get insights, releases, and updates delivered directly to your inbox once a month.</p>
		<div id="nl-form"></div>
	</div>
</template>

<style scoped>
#nl {
	background-color: var(--vp-c-purple-dimm-3);
	border-radius: var(--rounded-lg);
	padding: 1rem;
	border: 1px solid var(--vp-c-purple-dimm-1);
}

h2 {
	color: var(--vp-c-purple);
	font-size: 1.125rem;
	text-wrap: balance;
	font-weight: bold;
}

p {
	font-size: 0.75rem;
	line-height: 1.125rem;
	margin: 0.75rem 0;
	font-weight: 500;
}

:deep(input) {
	border-radius: var(--rounded-md);
	background-color: var(--vp-c-bg);
	display: block;
	width: 100%;
	padding: 0.5em 1em;
	border: 1px solid var(--vp-c-divider);
}

:deep(input.invalid) {
	border-color: var(--vp-c-red);
}

:deep(input::placeholder) {
	color: var(--vp-c-gray-light-2);
}

:deep(input:focus) {
	border-color: var(--vp-c-purple);
}

:deep(input[type='submit']) {
	background-color: var(--vp-c-brand);
	font-weight: 600;
	color: white;
	border-radius: var(--rounded-full);
	border: none;
	display: block;
	width: 100%;
	padding: 0.5em;
	margin-top: 1em;
	cursor: pointer;
}

:deep(input[type='submit']:hover) {
	background-color: var(--vp-c-brand-light);
}

:deep(.hs_recaptcha .input .grecaptcha-badge) {
	box-shadow: none !important;
	height: 44px !important;
	transform: scale(0.735);
	transform-origin: top left;
	margin-top: 0.5rem;
}

:deep(.hs-error-msgs) {
	margin: 0;
	padding: 0;
	list-style: none;
	color: var(--vp-c-red);
	font-style: italic;
	margin-block-start: var(--space-1);
}

:deep(.hs-error-msgs li) {
	line-height: 1rem;
	font-size: 0.75rem;
	margin-top: 0.5rem;
}

/* Hide main error message if mail field already has one */
:deep(form:has(.hs-form-field .hs-error-msgs) .hs_error_rollup) {
	display: none;
}
</style>
