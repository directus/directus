<script setup lang="ts">
import Divider from '../Divider.vue';
import SocialIcon from './SocialIcon.vue';
import Logo from './icons/Logo.vue';

const currentYear = new Date().getFullYear();
</script>

<template>
	<footer>
		<div class="footer footer-container flex">
			<div>
				<ul class="footer-links m-20">
					<li>
						<a href="https://github.com/directus/directus/blob/main/license" target="_blank" rel="noreferrer noopener">
							License
						</a>
					</li>
					<li><a href="https://directus.io/terms/" target="_blank" rel="noreferrer noopener">Terms</a></li>
					<li><a href="https://directus.io/privacy/" target="_blank" rel="noreferrer noopener">Privacy</a></li>
				</ul>
			</div>
			<div class="m-20">
				<Logo />
			</div>
			<div>
				<ul class="social-links m-20">
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
			</div>
		</div>

		<div class="section-container dark">
			<Divider />
		</div>
		<div class="footer-copyright">
			<a href="https://monospace.io/" target="_blank" rel="noreferrer noopener">
				&copy; {{ currentYear }} Monospace Inc
			</a>
		</div>
	</footer>
</template>

<style scoped>
footer {
	padding-bottom: 60px;
	background: var(--vp-docs-section-bg);
}

hr {
	border-color: gray;
}

a {
	color: var(--vp-c-text-dark-2);
}

.footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.footer-container {
	padding: 24px 120px;
}

.footer-links {
	display: flex;
	list-style: none;
	font-weight: 600;
	justify-content: space-between;
	gap: 24px;
}

.footer-links li {
	color: white;
	margin-right: 20px;
}

.footer-copyright {
	text-align: center;
	color: var(--vp-c-text-dark-2);
	font-weight: 500;
	margin-top: 32px;
}

.social-links {
	display: flex;
	justify-content: space-between;
	list-style: none;
}

.social-links li {
	margin-left: 20px;
}
</style>
