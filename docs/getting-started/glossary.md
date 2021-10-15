# Glossary

> This is list of Directus terminology, and their meanings. Most are simply more approachable names for technical
> database terms.

[[toc]]

## Admin

## Alias

## API

## App

An intuitive no-code application for managing database content. Powered by the API, the modular and highly extensible
App is written in [Vue.js](https://vuejs.org).

## Activity

## Collections

Collections are containers for specific groupings of Items. Each collection represents a **table** in your database.

## Dashboards

## Database

## Displays

## Extensions

## Fields

Fields are a specific type of value within a Collection, storing the data of your item's content. Each field represents
a **column** in your database.

## Files & Assets

## Interfaces

## Items

Item are objects within a Collection which contain values for one or more fields. Each collection represents a
**record** in your database.

## Junction Collections

## Layouts

## Modules

## Panels

## Permissions

Permissions are attached directly to a Role, defining what Users can create, read, update, and delete within the
platform

## Projects

## Relationships

## Revisions

## Roles

Roles define a specific set of access permissions, and are the primary organizational structure for Users within the
platform.

## Title Formatter

Special Casing — If you are trying to update the specific casing (uppercase/lowercase) for a word (eg: `Dna` to `DNA`)
you will want to add the edge-case to the
[Format Title package](https://github.com/directus/directus/tree/main/packages/format-title/src). If you feel the case
passes our [80/20 rule](https://docs.directus.io/contributing/introduction/#feature-requests) you should submit a Pull
Request to the codebase, otherwise you can update this in your instance.

## Translations

## Types

## Users

An active User is required to access a project. Each user is assigned to a [Role](/concepts/roles/) that determines what
they have access to see and do. This means that the experience of users may vary significantly depending on their role's
permissions.
