const sdk = require('./dist');

const directus = new sdk.Directus('url');

directus.items('contatos').read({}).then(console.log).catch(console.error);
