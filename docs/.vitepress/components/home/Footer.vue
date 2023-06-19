<script lang="ts" setup>
import Logo from './icons/Logo.vue';
import SocialIcon from './SocialIcon.vue';
</script>

<script lang="ts">
export default {
	data() {
		return {
			currentYear: new Date().getFullYear(),
		};
	},
	components: { SocialIcon },
};
</script>

<template>
	<footer>
		<div class="footer footer-container flex">
			<div>
				<ul class="footer-links m-20">
					<li><a href="#">License</a></li>
					<li><a href="#">Terms</a></li>
					<li><a href="#">Privacy</a></li>
				</ul>
			</div>
			<div class="m-20">
				<Logo />
			</div>
			<div>
				<ul class="social-links m-20">
					<li>
						<SocialIcon url="#" icon="linkedin" />
					</li>
					<li>
						<SocialIcon url="#" icon="docker" />
					</li>
					<li>
						<SocialIcon url="#" icon="npm" />
					</li>
					<li>
						<SocialIcon url="#" icon="youtube" />
					</li>
					<li>
						<SocialIcon url="#" icon="discord" />
					</li>
					<li>
						<SocialIcon url="#" icon="twitter" />
					</li>
					<li>
						<SocialIcon url="#" icon="github" />
					</li>
				</ul>
			</div>
		</div>

		<Divider />

		<p class="footer-copyright">&copy; {{ currentYear }} Monospace Inc</p>
	</footer>
</template>

<style scoped>
footer {
	padding-bottom: 60px;
	background: linear-gradient(66.35deg, #0b081a 28.05%, #150e34 97.17%);
}
hr {
	border-color: gray;
}
.footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.footer-container {
	padding: 60px 80px;
}

.footer-links {
	display: flex;
	list-style: none;
	justify-content: space-between;
}

.footer-links li {
	color: white;
	margin-right: 20px;
}

.footer-copyright {
	text-align: center;
	color: white;
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
