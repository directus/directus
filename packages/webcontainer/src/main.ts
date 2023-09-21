import './style.css'
import { WebContainer } from '@webcontainer/api';
import { files } from 'directus-files';
import { Terminal } from 'xterm'
import 'xterm/css/xterm.css';

document.querySelector('#app')!.innerHTML = `
  <div class="container">
  	<iframe src="http://localhost:8055/"></iframe>
	<div class="terminal"></div>
  </div>
`

const iframeEl = document.querySelector('iframe');
const terminalEl: HTMLElement | null = document.querySelector('.terminal');

let webcontainerInstance;

window.addEventListener('load', async () => {

	files['data.db']['file']['contents'] = bufferToUint8Array(files['data.db']['file']['contents'].data)
	// files['api']['directory']['data.db']['file']['contents'] = bufferToUint8Array(files['api']['directory']['data.db']['file']['contents'].data)


	const terminal = new Terminal({
		convertEol: true,
	});

	terminal.resize(200, 55);

	terminal.open(terminalEl!);

	// Call only once
	webcontainerInstance = await WebContainer.boot();
	await webcontainerInstance.mount(files);

	const exitCode = await installDependencies(terminal);

	if (exitCode !== 0) {
		throw new Error('Installation failed');
	}

	startDevServer(terminal)
});

function bufferToUint8Array(buffer) {
	const uint8Array = new Uint8Array(buffer.length);

	for (let i = 0; i < buffer.length; i++) {
		uint8Array[i] = buffer[i]
	}

	return uint8Array
}

async function installDependencies(terminal: Terminal) {
	// Install dependencies
	const installProcess = await webcontainerInstance!.spawn('pnpm', ['install']);

	installProcess.output.pipeTo(new WritableStream({
		write(data) {
			terminal.write(data);
		}
	}));

	// Wait for install command to exit
	return installProcess.exit;
}

async function startDevServer(terminal: Terminal) {
	// Run `npm run start` to start the Express app

	// const serverProcess = await webcontainerInstance!.spawn('node', ['./api/dist/cli/run.js', 'start']);

	// const initProcess = await webcontainerInstance!.spawn('pnpm', ['run', 'init']);

	// initProcess.output.pipeTo(
	// 	new WritableStream({
	// 		write(data) {
	// 			terminal.write(data);
	// 		},
	// 	})
	// );

	// await initProcess.exit

	const serverProcess = await webcontainerInstance!.spawn('pnpm', ['run', 'dev']);

	serverProcess.output.pipeTo(
		new WritableStream({
			write(data) {
				terminal.write(data);
			},
		})
	);

	// Wait for `server-ready` event
	webcontainerInstance!.on('server-ready', (port, url) => {
		iframeEl!.src = url + '/admin/';
	});
}
