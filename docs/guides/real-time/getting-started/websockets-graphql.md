# Getting Started With WebSockets using GraphQL

You can connect to a Directus project using a WebSocket interface and get updates on data held in a collection in
real-time.

This guide will show you how to get started with Directus' WebSockets interface, by subscribing to data using GraphQL.

We'll be using a React.js project for demonstration purposes, however, WebSockets are language-agnostic, so you can
apply the same set of steps in your stack of choice.

> It's important to note that GraphQL will only use WebSockets for subscriptions. This means that regular GraphQL
> queries and mutations will still use HTTP requests and responses, even if you have established a WebSocket connection.
