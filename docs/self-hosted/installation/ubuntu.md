# Ubuntu

DigitalOcean provides a great tutorial on how to run a Node.js based app in production. See
[How To Set Up a Node.js Application for Production on Ubuntu 20.04](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04).

Instead of starting the app using `pm2 start hello.js`, add the line `"start": "directus start"` in the "scripts" part
of the _package.json_ and start Directus using the command `pm2 start npm -- start`

_Example:_

```json
{
  "name": "directus",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "directus start"
  },
...
}
```
