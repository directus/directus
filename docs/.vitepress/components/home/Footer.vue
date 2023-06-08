<script lang="ts" setup>
import Logo from './icons/Logo.vue';
import LinkedIn from './icons/LinkedIn.vue';
import Docker from './icons/Docker.vue';
import NPM from './icons/NPM.vue';
import YouTube from './icons/YouTube.vue';
import Discord from './icons/Discord.vue';
import Twitter from './icons/Twitter.vue';
import GitHub2 from './icons/GitHub2.vue';
</script>

<script lang="ts">
export default {
	data() {
		return {
			currentYear: new Date().getFullYear(),
		};
	},
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
						<a href="#"><LinkedIn /></a>
					</li>
					<li>
						<a href="#"><Docker /></a>
					</li>
					<li>
						<a href="#"><NPM /></a>
					</li>
					<li>
						<a href="#"><YouTube /></a>
					</li>
					<li>
						<a href="#"><Discord /></a>
					</li>
					<li>
						<a href="#"><Twitter /></a>
					</li>
					<li>
						<a href="#"><GitHub2 /></a>
					</li>
				</ul>
			</div>
		</div>
		<hr />

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
