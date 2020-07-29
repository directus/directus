import formatTitle from '@directus/format-title';
import { DisplayHandlerFunction } from '@/displays/types';

const handler: DisplayHandlerFunction = (value) => (value ? formatTitle(value) : null);
export default handler;
