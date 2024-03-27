---
description: Learn the terms and concepts you need to know about Headless CMS.
author: Bryant Gillespie
---

# Headless CMS Concepts

> {{ $frontmatter.description }}

If you’re new to using a Headless CMS, it can be hard to wrap your head around the terminology at first. Here’s some
helpful definitions of terms you’ll likely see again.

## What is a frontend?

**Frontend = presentation layer**

A frontend is the part of a website or web application that the user sees and interacts with. It typically consists of
HTML, CSS, and JavaScript, and is responsible for the look and feel of the website.

In the context of a Headless CMS, the frontend is the part of the website or application that displays the content from
the CMS.

## What is a backend?

**Backend = Headless CMS + Database + APIs**

A backend is the part of a website or web application that stores data and runs the code to make things work. It
typically consists of a database and a set of APIs that make it easy for the frontend to access and display the content.

In the context of a Headless CMS, the backend is the part of the website or application that stores and manages the
content from the CMS.

## What are APIs?

APIs, or Application Programming Interfaces, are like the glue between two systems. For example, in a Headless CMS, the
API is what connects the content stored in the CMS to the frontend of the website or app.

It's like a messenger that takes a request from the frontend (like 'give me the content for this page') and then
responds with the right content from the backend (like the text, images, and other content stored in the CMS).

APIs provide a set of instructions on what data can be accessed and created - with a set of pre-defined options. It acts
as a promise that, if you make a specific request, you get a known behavior and response - not dissimilar to a
restaurant menu.

## What is data fetching?

Data fetching is a process used to retrieve data from a server or database. In the context of a Headless CMS and
frontend frameworks, data fetching is used to get the content from the Headless CMS and display it on the page.

This process is typically done using an API, which is a set of instructions that tells the server what data to return
and how to format it. Data fetching makes it possible to create dynamic, content-rich websites and applications without
having to manually manage the content.

## What is server side rendering (SSR)?

Server Side Rendering (SSR) is a method of serving content on a website or web application that involves running
server-side code to generate the HTML for a page.

With SSR, the HTML is generated on the fly (at the time of a web request), allowing for dynamic content and more complex
content types.

In the context of Headless CMS, SSR allows for content from the CMS to be dynamically served on the page without having
to manually compile the HTML.

## What is static site generation (SSG)?

Static site generation (SSG) is a method of building websites and web applications where the content is compiled into
HTML, CSS, and Javascript files at build time. These files are then served directly to the browser, with no server-side
code.

This makes the website or application faster, more secure, and easier to manage. It also allows the content to be stored
and managed in a separate system, like a Headless CMS.

## What are builds / deployments? What does it mean to trigger a build?

Builds and deployments are the processes of taking the content from a Headless CMS and combining it with a static site
generator to create a fully functioning website or web application.

The build process compiles all the code and content together and creates the HTML, CSS, and JavaScript needed for the
website or application.

The deployment process then takes the build and deploys it to a hosting provider or other web service.

## What is Jamstack?

The “JAM” in Jamstack stands for Javascript, API, and Markup. A stack is the combination of technologies and tools that
you use to build and run applications or projects.

Here’s the official definition from [Jamstack.org](https://jamstack.org/).

> Jamstack is an architectural approach that decouples the web experience layer from data and business logic, improving
> flexibility, scalability, performance, and maintainability.
>
> Jamstack removes the need for business logic to dictate the web experience.
>
> It enables a composable architecture for the web where custom logic and 3rd party services are consumed through APIs.
