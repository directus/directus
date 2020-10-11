# Installing Manually

## 1. Setup a Project

Add a `package.json` by running the following command.

```bash
npm init
```

## 2. Install Directus

```bash
npm install directus
```

## 3. Install Database Driver

Choose the [database vendor](#) you will be working with, and install its driver.

```bash
npm install pg
```

## 4. Install Optional Dependencies

At this point you have the option of installing other dependencies, such as Redis.

## 5. Setup a Configuration File

Finally, you'll need to setup your `.env` file, or configure the environment variables through other means, such as Docker, etc.
