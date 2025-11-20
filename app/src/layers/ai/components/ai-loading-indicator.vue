<template>
	<div class="loading-indicator">
		<span />
		<span />
		<span />
	</div>
</template>

<style scoped>
.loading-indicator {
	display: flex;
	gap: 0.375rem;
	padding-inline: 3px;
	align-items: center;
	block-size: 32px;

	span {
		--delay: 0;
		--duration: 800ms;

		inline-size: 0.5rem;
		block-size: 0.5rem;
		background-color: var(--theme--foreground);
		border-radius: 50%;
		animation: loading-bounce;
		animation-timing-function: var(--transition);
		animation-iteration-count: infinite;
		animation-fill-mode: both;
		animation-duration: 800ms;
		animation-delay: var(--delay);

		&:nth-child(1) {
			--delay: var(--slow);
		}

		&:nth-child(2) {
			--delay: calc(var(--slow) + 200ms);
		}

		&:nth-child(3) {
			--delay: calc(var(--slow) + 400ms);
		}
	}
}

@keyframes loading-bounce {
	0%,
	80%,
	100% {
		opacity: 0.5;
	}
	40% {
		transform: scale(1);
		opacity: 1;
	}
}
</style>
