<template>
	<Tabs>
		<Tab label="REST">
			<slot name="rest" />
		</Tab>
		<Tab label="GraphQL">
			<slot name="graphql" />
		</Tab>
		<Tab label="SDK">
			<slot name="sdk" />
		</Tab>
	</Tabs>
</template>
