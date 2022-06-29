# Installing Manually

::: tip Automation

We've created a little CLI tool you can run that does this process automatically. For more info, check the doc on
[installing through the CLI](/self-hosted/installation/cli/).

:::

## 1. Setup a Project Folder

Create a new directory, and add a `package.json` by running the following command.

```bash
npm init -y
```

We recommend aliasing the `start` script to Directus' start for easier deployments to services like
[AWS](/self-hosted/installation/aws/), [Google Cloud Platform](/self-hosted/installation/gcp) or
[DigitalOcean App Platform](/self-hosted/installation/digitalocean-app-platform/).

```json
{
	...
	"scripts": {
		"start": "directus start"
	}
	...
}
```

## 2. Install Directus

```bash
npm install directus
```

## 3. Setup a Configuration File

Finally, you'll need to setup your `.env` file, or configure the environment variables through other means, such as
Docker, etc.

**Don't forget to fill your database information before continuing to next step**

See [Environment Variables](/self-hosted/config-options/#general) for all available variables.

## 4. Bootstrap It

```bash
npx directus bootstrap
```

## 5. Start Server

```bash
npm run start
```
