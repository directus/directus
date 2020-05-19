import prettyBytes from 'pretty-bytes';

export default function handler(value: number) {
	return prettyBytes(value);
}
