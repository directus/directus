<template>
	<div class="v-sheet">
		<slot />
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-sheet-background-color  [var(--theme--form--field--input--background-subdued)]
		--v-sheet-height            [auto]
		--v-sheet-min-height        [var(--theme--form--field--input--height)]
		--v-sheet-max-height        [none]
		--v-sheet-width             [auto]
		--v-sheet-min-width         [none]
		--v-sheet-max-width         [none]
		--v-sheet-padding           [8px]

*/

.v-sheet {
	inline-size: var(--v-sheet-width, auto);
	min-inline-size: var(--v-sheet-min-width, none);
	max-inline-size: var(--v-sheet-max-width, none);
	block-size: var(--v-sheet-height, auto);
	min-block-size: var(--v-sheet-min-height, var(--theme--form--field--input--height));
	max-block-size: var(--v-sheet-max-height, none);
	padding: var(--v-sheet-padding, 8px);
	overflow: auto;
	background-color: var(--v-sheet-background-color, var(--theme--form--field--input--background-subdued));
	border-radius: var(--theme--border-radius);
}
</style>
