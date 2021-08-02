# Extensions

> In addition to being highly customizable, Directus has also been built with many modular extension points throughout
> the App, API and CLI.

## App Extensions

Directus has been architected as completely modular and extensible, with four keystone App component types.
Out-of-the-box components are configurable, or altogether new components can be created as extensions.

- [Modules](/concepts/modules/)
- [Layouts](/concepts/layouts/)
- [Interfaces](/concepts/interfaces/)
- [Displays](/concepts/displays/)

## API Extensions

- [Endpoints](/guides/api-endpoints)
- [Hooks](/guides/api-hooks)


## Usefull tips and tricks

Nodemon

Nodemon can be used for automatic reloading.
Basicly whenever you change a hook or another extension, your directus instance will automaticly restart.

Setup

	1. install nodemon: npm i -g nodemon kill-port
	2. go to the package.json of your directus project.
	3. Add the following configuration:
	
  "nodemonConfig": {
    "ignore": [
      "node_modules/*"
    ],
    "watch": [
      "extensions/"
    ],
    "events": {
      "restart": "kill-port 8055",
      "crash": "kill-port 8055"
    },
    "delay": 1500
  }
	
	4. run nodemon --exec npx directus start and use this in development

<!-- ## CLI Extensions

TBD

- Commands
- Extensions -->
