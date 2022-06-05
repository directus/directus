import { defineOperationApi } from '@directus/shared/utils'

export default defineOperationApi({
	id: 'custom',

	handler: async ({ customParameter }) => {
		console.log(customParameter)
	}
})
