// @ts-nocheck

const ivm = $0;
const makeOperation = $1;

function defineOperationApi({ id, handler }) {
	makeOperation.apply(null, [
		id,
		new ivm.Reference((...args) => {
			try {
				return new ivm.ExternalCopy(handler(...args)).copyInto();
			} catch (error) {
				return new ivm.ExternalCopy(error).copyInto();
			}
		}),
	]);
}

globalThis.defineOperationApi = defineOperationApi;
