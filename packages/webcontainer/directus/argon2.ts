function validate() {
	console.log('validate called!!!')
	return true
}

function verify() {
	console.log('verify called!!!')
	return true
}

export {
	validate, verify
}

export default {
	validate, verify,
	default: {
		validate, verify
	}
}
