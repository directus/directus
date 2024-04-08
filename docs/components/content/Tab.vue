<!-- This is an convenience component to use <Tab> as a passthrough for <div> when using <Tabs> />-->
<template>
	<div>
		<ContentSlot :use="$slots.default" />
	</div>
</template>
