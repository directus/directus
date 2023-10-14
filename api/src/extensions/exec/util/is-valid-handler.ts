import { handlers } from '../handlers/index.js';

export const isValidHandler = (type: string): type is keyof typeof handlers => {
	const handlerTypes = Object.keys(handlers);
	return handlerTypes.includes(type);
};
