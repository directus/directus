<template>
	<div class="doc-card">
		<a :href="url">
			<div class="flex">
				<div class="icon-bg">
					<slot name="icon" />
				</div>
				<div class="doc-card-text">
					<h3>{{ title }}</h3>
					<p>{{ desc }}</p>
				</div>
			</div>
		</a>
	</div>
</template>

<script>
export default {
	name: 'DocCard',
	props: {
		title: { type: String, required: true },
		desc: { type: String, required: true },
		url: { type: String, required: true },
	},
};
</script>

<style scoped>
.doc-card {
	border-radius: 8px;
	cursor: pointer;
	color: inherit;
	display: inline-block;
	padding: 16px;
	border: 2px solid var(--vp-c-brand-light);
	transition: border-color 0.25s, background-color 0.25s;
	margin-top: 1em;
	margin-bottom: 1em;
}
.doc-card:hover {
	box-shadow: 0px 20px 40px rgba(162, 181, 205, 0.3);
}
.doc-card h3 {
	color: #464e59;
	font-size: 16px;
}

.doc-card-text p {
	color: #747a82;
}

.doc-card-text {
	padding-left: 24px;
}
.flex {
	display: flex;
	align-items: start;
	justify-content: space-between;
}
.icon-bg {
	background: #6644ff1a;
	border-radius: 12px;
	padding: 16px;
}
</style>
