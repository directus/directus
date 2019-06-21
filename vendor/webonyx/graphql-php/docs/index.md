[![GitHub stars](https://img.shields.io/github/stars/webonyx/graphql-php.svg?style=social&label=Star)](https://github.com/webonyx/graphql-php)
[![Build Status](https://travis-ci.org/webonyx/graphql-php.svg?branch=master)](https://travis-ci.org/webonyx/graphql-php)
[![Coverage Status](https://coveralls.io/repos/github/webonyx/graphql-php/badge.svg)](https://coveralls.io/github/webonyx/graphql-php)
[![Latest Stable Version](https://poser.pugx.org/webonyx/graphql-php/version)](https://packagist.org/packages/webonyx/graphql-php)
[![License](https://poser.pugx.org/webonyx/graphql-php/license)](https://packagist.org/packages/webonyx/graphql-php)

# About GraphQL

GraphQL is a modern way to build HTTP APIs consumed by the web and mobile clients.
It is intended to be an alternative to REST and SOAP APIs (even for **existing applications**).

GraphQL itself is a [specification](https://github.com/facebook/graphql) designed by Facebook
engineers. Various implementations of this specification were written 
[in different languages and environments](http://graphql.org/code/).

Great overview of GraphQL features and benefits is presented on [the official website](http://graphql.org/). 
All of them equally apply to this PHP implementation. 


# About graphql-php

**graphql-php** is a feature-complete implementation of GraphQL specification in PHP (5.5+, 7.0+). 
It was originally inspired by [reference JavaScript implementation](https://github.com/graphql/graphql-js) 
published by Facebook.

This library is a thin wrapper around your existing data layer and business logic. 
It doesn't dictate how these layers are implemented or which storage engines 
are used. Instead, it provides tools for creating rich API for your existing app.
 
Library features include:

 - Primitives to express your app as a [Type System](type-system/index.md)
 - Validation and introspection of this Type System (for compatibility with tools like [GraphiQL](complementary-tools.md#tools))
 - Parsing, validating and [executing GraphQL queries](executing-queries.md) against this Type System
 - Rich [error reporting](error-handling.md), including query validation and execution errors
 - Optional tools for [parsing GraphQL Type language](type-system/type-language.md)
 - Tools for [batching requests](data-fetching.md#solving-n1-problem) to backend storage
 - [Async PHP platforms support](data-fetching.md#async-php) via promises
 - [Standard HTTP server](executing-queries.md#using-server)

Also, several [complementary tools](complementary-tools.md) are available which provide integrations with 
existing PHP frameworks, add support for Relay, etc.

## Current Status
The first version of this library (v0.1) was released on August 10th 2015.

The current version supports all features described by GraphQL specification 
as well as some experimental features like 
[Schema Language parser](type-system/type-language.md) and 
[Schema printer](reference.md#graphqlutilsschemaprinter).

Ready for real-world usage. 

## GitHub
Project source code is [hosted on GitHub](https://github.com/webonyx/graphql-php).
