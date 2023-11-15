<script setup>
import { onMounted } from 'vue';

onMounted(() => {
	const script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'https://js.hsforms.net/forms/embed/v2.js';

	script.onload = () => {
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
		<h2>Follow the White Rabbit 🐇</h2>
		<p>Get insights, releases, and product updates delivered directly to your inbox once a month.</p>
		<div id="nl-form"></div>
	</div>
</template>

<style scoped>
#nl {
	background-color: var(--vp-c-purple-lightest);
	border-radius: var(--rounded-lg);
	padding: 1rem;
	border: 1px solid var(--vp-c-purple-lighter);
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
	font-weight: bold;
}
</style>

<style>
#email-d57a69e4-6f43-4768-a600-5f7d30306260 {
	border-radius: var(--rounded-md);
	background: white;
	display: block;
	width: 100%;
	padding: 0.5em 1em;
	border: 1px solid var(--vp-c-gray-light-4);
}
#email-d57a69e4-6f43-4768-a600-5f7d30306260:focus {
	border-color: var(--vp-c-gray-light-2);
}
[data-form-id='d57a69e4-6f43-4768-a600-5f7d30306260'] .hs-error-msgs li {
	line-height: 1rem;
	font-size: 0.75rem;
	margin-top: 0.5rem;
}
[data-form-id='d57a69e4-6f43-4768-a600-5f7d30306260'] input[type='submit'] {
	background-color: var(--vp-c-purple);
	color: white;
	border-radius: var(--rounded-full);
	display: block;
	width: 100%;
	padding: 0.25em;
	margin-top: 1em;
	cursor: pointer;
}
</style>
