<p align="center">
  <a href="https://directus.io" target="_blank" rel="noopener noreferrer">
    <img src="https://user-images.githubusercontent.com/522079/43096167-3a1b1118-8e86-11e8-9fb2-7b4e3b1368bc.png" width="140" alt="Directus Logo"/>
  </a>
</p>

<p>&nbsp;</p>

<h1 align="center">
  The All-New Directus 7<br>Future-Proof Headless CMS
</h1>

<h3 align="center">
  <a href="https://directus.io">Website</a> • 
  <a href="https://docs.directus.io">Docs</a> • 
  <a href="https://docs.directus.io/api/reference.html">API Reference</a> • 
  <a href="https://docs.directus.io/guides/user-guide.html">User Guide</a> • 
  <a href="https://directus.app">Demo</a> • 
  <a href="https://docs.directus.io/getting-started/supporting-directus.html">Contribute</a> • 
  <a href="https://twitter.com/directus">Twitter</a>
</h3>

<p>&nbsp;</p>

> _The Directus 7 App has been rebuilt from the ground-up in Vue.js and decoupled from our new "versionless" API. Both can easily be customized and extended to suit your project's needs._

<p>&nbsp;</p>

## 🐰 Introduction

Directus is an open-source suite of software that provides an instant API wrapper for SQL databases and an intuitive Admin App for non-technical users to manage that content. It's like a safe, friendly, and super-powered "database client" (eg: _PHP-my-Admin_ or _Sequel Pro_). Created in 2004, our premium platform powers hundreds-of-thousands of data-driven applications around the world. With our JSON API, webhooks, and complete control over where and how your content is used — what will you build with Directus?

* **[Directus API](https://github.com/directus/api)** — Wraps any new or existing SQL database with RESTful JSON endpoints for connecting content anywhere: websites, native apps, wearables, IoT devices, kiosks, or anything else!
* **[Directus Admin App](https://github.com/directus/app)** — A friendly admin interface built with Vue.js that works in conjunction with our API to allow non-technical users to manage database content and digital assets.
* **[Directus Suite](https://github.com/directus/directus)** A package that combines our API, Admin App, and all dependencies for quick and easy installation on most servers.

<p>&nbsp;</p>

## ✨ Key Concepts

### Database-First

Directus follows a database-first approach, storing all of your data _unaltered_ in pure SQL databases with that can be completely customized.

#### Access and Optimization

Directus mirrors _your_ actual database so it will automatically stay in sync with any changes made directly to the database! With the full power of SQL unlocked, you can:

1. Architect your actual database with meaningful table and column names
2. Infinitely optimize with indexing, datatypes, lengths, defaults, keys, encoding, etc
3. Update your database schema at any point and Directus will instantly reflect changes
4. Create, update, and delete content directly from the database

#### Direct Access

This database-first approach means that you have the option to completely bypass Directus if needed. Connecting your application _directly_ to the database means Directus is completely bypassed, removing even the slightest possiblility of a bottleneck, and giving you the unbridled power of complex SQL queries.

#### Portability and Transparency

Directus is _not_ a black-box system. There is nothing proprietary or opinionated about how Directus stores your content so you're never locked-in or locked out. Import existing SQL to get started quickly, and rest assured that you can also export your unaltered content as vanilla SQL at any point. You can also self-host the entire suite on your own servers if needed or use our hosted Cloud service.

#### Complex Relationships

Whether you need many-to-one, one-to-many, many-to-many, or something completely different... Directus has you covered. You can interrelate database fields, then fetch deeply nested data using our robust dot-notation parameters.

### Simple, Modular and Extensible

We've intentionally kept our codebase as simple and lightweight as possible. Every aspect of Directus has been modularized, with many options for extending, overriding, or even bypassing the core system. Choose your auth providers, storage adapters, content interfaces, data presentation, and more. We also have webhooks, event hooks, API response filters, custom endpoints, CSS/JS override files, and much more.

Furthermore, because the codebase has been internally decoupled, Directus supports full multitenancy. You can use a single Directus App to manage multiple Directus API instances, and each API instance can manage multiple databases (projects or environments).

### Internationalization and Accessibility

Directus allows you to manage multilingual content in as many languages as your project needs. And no matter what language(s) your organization requires, our Admin App supports a growing number of locales. We've also paid close attention to our Admin App's interface to ensure it is as clear and accessible as possible for all users.

<p>&nbsp;</p>

## 📖 Documentation

* [What is Directus?](https://docs.directus.io/getting-started/introduction.html#what-is-directus)
* [Installing the Directus Suite](https://docs.directus.io/getting-started/installation.html)
* [Extending Directus](https://docs.directus.io/extensions/)
* Directus App
  * [App Docs](https://docs.directus.io/advanced/app/standalone.html)
  * [User Guide](https://docs.directus.io/guides/user-guide.html)
  * [Install the App](https://docs.directus.io/advanced/app/standalone.html#installation)
* Directus API
  * [API Docs](https://docs.directus.io/advanced/api/standalone.html)
  * [API Reference](https://docs.directus.io/api/reference.html)
  * [Install the API](https://docs.directus.io/advanced/api/standalone.html#installation)
* Tutorials
  * [Tutorials](https://medium.com/directus)
  * [Videos](https://www.youtube.com/playlist?list=PLD--x9rY3ZL31stRPkA4FdGC4idIM-8-d)

<p>&nbsp;</p>

## 🤲 Help & Resources

### Technical Support

* **Community Support** — For help with open-source instances please post questions with the `directus` tag on [Stack Overflow](https://stackoverflow.com/questions/tagged/directus) or chat with members of our online community.
* **Premium Support** — Directus Cloud customers, Patreon Sponsors, and those paying for hourly support all have access to our Live support over our [Live Chat](https://directus.io) or [Email](mailto:support@directus.io).

### Community

* **[Slack](https://directus.chat)** — Come join over a thousand members discussing the future of Directus. Our helpful members are also quick to offer advice for simple questions you may have while getting started.
* **[Twitter](https://twitter.com/directus)** — Follow us on Twitter to be the first to hear about product updates, see sneak peeks of new features, and vote on polls regarding the future of our platform.

### GitHub Tickets

* **Reporting Bugs** — If you believe you've found a bug in the Directus Core codebase, please submit new tickets to either the [App](https://github.com/directus/app/issues/new?template=Bug_report.md) or the [API](https://github.com/directus/api/issues/new?template=Bug_report.md). **For all security related issues, please chat with us directly through [directus.io](https://directus.io/).**
* **Requesting Features** — Feature requests are managed as GitHub issues within the appropriate Directus repository. Before making a new submission, first [browse existing feature requests](https://github.com/directus/app/issues?q=is%3Aissue+is%3Aopen+sort%3Areactions-%2B1-desc+label%3Aenhancement) using the `enhancement` label. If you find a similar request, simply vote for it using the :+1: or :-1: reactions and add any additional context in the comments. If _not_, [add a new feature request](https://github.com/directus/app/issues/new?template=Feature_request.md) by completing the provided template.

### Online Demos

We have two online demos available so you can easily check out Directus in action. These demos are public and is therefore susceptible to trolls who think it's funny to write offensive things or change the master user password. The entire database is reset each hour to mitigate this. The login credentials for both demos: `admin@example.com` and `password`

* **[Stable](https://directus.app)** — This demo showcases the [latest release](https://github.com/directus/directus/releases/latest) of the Directus suite.
* **[Nightly](https://nightly.directus.app)** — This demo uses the [latest commits](https://github.com/directus/directus/commits/master) from the `master` branch.

<p>&nbsp;</p>

## ❤️ Supporting Directus

Directus is a GPLv3-licensed open source project with development made possible by support from our core team, contributors, and sponsors. It's not easy building premium open-source software; if you would like to help ensure Directus stays free, please consider becoming a sponsor.

* [Become a backer or sponsor through Patreon](https://www.patreon.com/directus)
* [One-time donation through PayPal](https://www.paypal.me/supportdirectus)
* [Other ways to help](https://docs.directus.io/getting-started/supporting-directus.html)


### Contributing

We love pull-requests! To work on Directus you'll need to install it locally from source by following the instructions below. Submit all pull-requests to the `master` branch of our `api` and `app` repositories.

* [Setup API Development Environment](https://docs.directus.io/advanced/source.html#api-source)
* [Setup App Development Environment](https://docs.directus.io/advanced/source.html#application-source)

### Sponsors

[RANGER Studio](http://rangerstudio.com), Bas Jansen

### Core Team

<table>
   <tr>
      <td>
         <a href="https://github.com/benhaynes"><img width="160px" src="https://user-images.githubusercontent.com/522079/42234532-dfa61084-7ec2-11e8-96df-23aa48c6d450.jpg"><br>
         Ben Haynes</a><br>
         <i>Project Lead</i>
      </td>
      <td>
         <a href="https://github.com/rijkvanzanten"><img width="160px" src="https://user-images.githubusercontent.com/522079/42234533-dfb6039a-7ec2-11e8-950c-04b34d47d6e4.jpg"><br>
         Rijk van Zanten</a><br>
         <i>App Lead</i>
      </td>
   </tr>
</table>

**[Advisors, Sponsors, Partners, and Key Contributors](https://directus.io/organization.html#the-team)**

<p>&nbsp;</p>

----

<p align="center">
  Directus is released under the <a href="http://www.gnu.org/copyleft/gpl.html">GPLv3</a> license. <a href="http://rangerstudio.com">RANGER Studio LLC</a> owns all Directus trademarks and logos on behalf of our project's community. Copyright © 2006-2018, <a href="http://rangerstudio.com">RANGER Studio LLC</a>.
</p>
