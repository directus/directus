<script setup lang="ts">
import Divider from '../Divider.vue';
import SocialIcon from './SocialIcon.vue';
import Logo from './icons/Logo.vue';

const currentYear = new Date().getFullYear();
</script>

<template>
	<footer>
		<div class="container">
			<div class="content">
				<Logo class="logo" />

				<ul class="social">
					<li>
						<SocialIcon url="https://www.linkedin.com/company/directus-io" icon="linkedin" />
					</li>
					<li>
						<SocialIcon url="https://hub.docker.com/r/directus/directus" icon="docker" />
					</li>
					<li>
						<SocialIcon url="https://www.npmjs.com/package/directus" icon="npm" />
					</li>
					<li>
						<SocialIcon url="https://www.youtube.com/c/DirectusVideos" icon="youtube" />
					</li>
					<li>
						<SocialIcon url="https://directus.chat" icon="discord" />
					</li>
					<li>
						<SocialIcon url="https://twitter.com/directus" icon="twitter" />
					</li>
					<li>
						<SocialIcon url="https://github.com/directus" icon="github" />
					</li>
				</ul>

				<ul class="links">
					<li>
						<a href="https://github.com/directus/directus/blob/main/license" target="_blank" rel="noreferrer noopener">
							License
						</a>
					</li>
					<li><a href="https://directus.io/terms/" target="_blank" rel="noreferrer noopener">Terms</a></li>
					<li><a href="https://directus.io/privacy/" target="_blank" rel="noreferrer noopener">Privacy</a></li>
				</ul>
			</div>

			<Divider />

			<small>
				<a href="https://monospace.io/" target="_blank" rel="noreferrer noopener">
					&copy; {{ currentYear }} Monospace Inc
				</a>
			</small>
		</div>
	</footer>
</template>

<style scoped>
footer {
	padding-bottom: 60px;
	padding: 24px 32px;
}

.container {
	max-width: 1000px;
	margin-inline: auto;
}

a {
	color: var(--footer-link-color);
}

.content ul {
	display: flex;
	list-style: none;
	font-weight: 600;
	justify-content: space-between;
	gap: 12px;
	max-width: 500px;
}

.content .logo,
.content ul {
	margin-inline: auto;
	margin-block-end: 24px;
}

.content:deep(.logo) {
	margin: 0 auto 2em;
}

@media screen and (min-width: 1400px) {
	.content {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		align-items: center;
	}

	.content ul {
		margin: 0;
		width: 100%;
		gap: 24px;
	}

	.content .links {
		order: 1;
	}

	.content:deep(.logo) {
		order: 2;
		margin: 0 auto;
	}

	.content .social {
		order: 3;
	}

	.divider {
		margin-top: 24px;
	}
}

small {
	text-align: center;
	color: var(--footer-link-color);
	font-weight: 500;
	margin-block-start: 24px;
	display: block;
}
</style>
