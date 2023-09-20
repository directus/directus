import './style.css'
import { WebContainer } from '@webcontainer/api';
import { files } from 'directus-files';

document.querySelector('#app')!.innerHTML = `
  <div class="container">
    <div class="preview">
      <iframe src="loading.html"></iframe>
    </div>
  </div>
`

const iframeEl = document.querySelector('iframe');

let webcontainerInstance;

window.addEventListener('load', async () => {
	// Call only once
	webcontainerInstance = await WebContainer.boot();
	await webcontainerInstance.mount(files);

	const exitCode = await installDependencies();

	if (exitCode !== 0) {
		throw new Error('Installation failed');
	}

	startDevServer()
});

async function installDependencies() {
	// Install dependencies
	const installProcess = await webcontainerInstance!.spawn('pnpm', ['install']);

	installProcess.output.pipeTo(new WritableStream({
		write(data) {
			console.log(data);
		}
	}));

	// Wait for install command to exit
	return installProcess.exit;
}

async function startDevServer() {
	// Run `npm run start` to start the Express app
	await webcontainerInstance!.spawn('pnpm', ['run', 'start']);

	// Wait for `server-ready` event
	webcontainerInstance!.on('server-ready', (port, url) => {
		iframeEl!.src = url;
	});
}
