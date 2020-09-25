# Troubleshooting

> Directus is offered completely free and open-source for anyone wishing to self-host the platform.

## Community Support

[Github Discussions](#) is great first place to reach out for help. Our community and core developers often check this platform and answer posts. It has the added benefit of being an archival resource for others developers with similar questions.

Our [Discord](https://discord.gg/directus) community is another great way to get assisstance. Please keep all questions on the `#help` channel, be considerate, and remember that you are getting free help for a free product.

## Premium Support

Premium support is included with our Enterprise Cloud service. On-Demand Cloud customers and On-Premise users interested in learning more about our monthly retainer agreements should contact us at [support@directus.io](mailto:support@directus.io).

## Frequently Asked Questions

### Does Directus handle deploying or migrating projects?

Directus includes [export](#) and [backup](#) tools to assist in deploying data changes between environments (eg: from _development_ to _production_), however there is no formal migration workflow.

Additionally, since Directus stores all of your data in pure SQL, you can use almost any preexisting workflow or toolkit for this process.

### Does Directus support Mongo/NoSQL?

Not currently. Directus has been built specifically for wrapping _relational_ databases. While we could force Mongo to use tables, columns, and rows via Mongoose object modeling, that approach to non-structured doesn't make a lot of sense. We realize many users are interested in this feature, and will continue to explore its possibility.

### Why haven't you added X feature, or fixed Y issue yet?

Directus is primarily a free and open-source project, maintained by a small core team and community contributors who donate their time and resources.

Our platform is feature-rich, however we strictly adhere to our [80/20 Rule](#) to avoid a messy/bloated codebase. Directus is also quite stable, however new issues still arise, some of which may be triaged with a lower prioritization.

If you require more expeditious updates, you can contact us regarding [sponsoring expedited fixes](#) or [commissioning new features](#). You can also [submit a pull request](#) — after all, it is open-source!
