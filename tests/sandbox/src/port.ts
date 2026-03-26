import requestPort, { portNumbers } from 'get-port';

export type Port = string | number;
export type PortRange = { min: Port; max: Port };

export async function getPort(port: Port | PortRange) {
	if (typeof port !== 'object') {
		return requestPort({ port: Number(port) });
	} else {
		return requestPort({ port: portNumbers(Number(port.min), Number(port.max)) });
	}
}
