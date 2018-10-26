# Container Interoperability

[![Latest Stable Version](https://poser.pugx.org/container-interop/container-interop/v/stable.png)](https://packagist.org/packages/container-interop/container-interop)
[![Total Downloads](https://poser.pugx.org/container-interop/container-interop/downloads.svg)](https://packagist.org/packages/container-interop/container-interop)

## Deprecation warning!

Starting Feb. 13th 2017, container-interop is officially deprecated in favor of [PSR-11](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-11-container.md).
Container-interop has been the test-bed of PSR-11. From v1.2, container-interop directly extends PSR-11 interfaces.
Therefore, all containers implementing container-interop are now *de-facto* compatible with PSR-11.

- Projects implementing container-interop interfaces are encouraged to directly implement PSR-11 interfaces instead.
- Projects consuming container-interop interfaces are very strongly encouraged to directly type-hint on PSR-11 interfaces, in order to be compatible with PSR-11 containers that are not compatible with container-interop.

Regarding the delegate lookup feature, that is present in container-interop and not in PSR-11, the feature is actually a design pattern. It is therefore not deprecated. Documentation regarding this design pattern will be migrated from this repository into a separate website in the future.

## About

*container-interop* tries to identify and standardize features in *container* objects (service locators,
dependency injection containers, etc.) to achieve interoperability.

Through discussions and trials, we try to create a standard, made of common interfaces but also recommendations.

If PHP projects that provide container implementations begin to adopt these common standards, then PHP
applications and projects that use containers can depend on the common interfaces instead of specific
implementations. This facilitates a high-level of interoperability and flexibility that allows users to consume
*any* container implementation that can be adapted to these interfaces.

The work done in this project is not officially endorsed by the [PHP-FIG](http://www.php-fig.org/), but it is being
worked on by members of PHP-FIG and other good developers. We adhere to the spirit and ideals of PHP-FIG, and hope
this project will pave the way for one or more future PSRs.


## Installation

You can install this package through Composer:

```json
composer require container-interop/container-interop
```

The packages adheres to the [SemVer](http://semver.org/) specification, and there will be full backward compatibility
between minor versions.

## Standards

### Available

- [`ContainerInterface`](src/Interop/Container/ContainerInterface.php).
[Description](docs/ContainerInterface.md) [Meta Document](docs/ContainerInterface-meta.md).
Describes the interface of a container that exposes methods to read its entries.
- [*Delegate lookup feature*](docs/Delegate-lookup.md).
[Meta Document](docs/Delegate-lookup-meta.md).
Describes the ability for a container to delegate the lookup of its dependencies to a third-party container. This
feature lets several containers work together in a single application.

### Proposed

View open [request for comments](https://github.com/container-interop/container-interop/labels/RFC)

## Compatible projects

### Projects implementing `ContainerInterface`

- [Acclimate](https://github.com/jeremeamia/acclimate-container): Adapters for
  Aura.Di, Laravel, Nette DI, Pimple, Symfony DI, ZF2 Service manager, ZF2
  Dependency injection and any container using `ArrayAccess`
- [Aura.Di](https://github.com/auraphp/Aura.Di)
- [auryn-container-interop](https://github.com/elazar/auryn-container-interop)
- [Burlap](https://github.com/codeeverything/burlap)
- [Chernozem](https://github.com/pyrsmk/Chernozem)
- [Data Manager](https://github.com/chrismichaels84/data-manager)
- [Disco](https://github.com/bitexpert/disco)
- [InDI](https://github.com/idealogica/indi)
- [League/Container](http://container.thephpleague.com/)
- [Mouf](http://mouf-php.com)
- [Njasm Container](https://github.com/njasm/container)
- [PHP-DI](http://php-di.org)
- [Picotainer](https://github.com/thecodingmachine/picotainer)
- [PimpleInterop](https://github.com/moufmouf/pimple-interop)
- [Pimple3-ContainerInterop](https://github.com/Sam-Burns/pimple3-containerinterop) (using Pimple v3)
- [SitePoint Container](https://github.com/sitepoint/Container)
- [Thruster Container](https://github.com/ThrusterIO/container) (PHP7 only)
- [Ultra-Lite Container](https://github.com/ultra-lite/container)
- [Unbox](https://github.com/mindplay-dk/unbox)
- [XStatic](https://github.com/jeremeamia/xstatic)
- [Zend\ServiceManager](https://github.com/zendframework/zend-servicemanager)
- [Zit](https://github.com/inxilpro/Zit)

### Projects implementing the *delegate lookup* feature

- [Aura.Di](https://github.com/auraphp/Aura.Di)
- [Burlap](https://github.com/codeeverything/burlap)
- [Chernozem](https://github.com/pyrsmk/Chernozem)
- [InDI](https://github.com/idealogica/indi)
- [League/Container](http://container.thephpleague.com/)
- [Mouf](http://mouf-php.com)
- [Picotainer](https://github.com/thecodingmachine/picotainer)
- [PHP-DI](http://php-di.org)
- [PimpleInterop](https://github.com/moufmouf/pimple-interop)
- [Ultra-Lite Container](https://github.com/ultra-lite/container)

### Middlewares implementing `ContainerInterface`

- [Alias-Container](https://github.com/thecodingmachine/alias-container): add
  aliases support to any container
- [Prefixer-Container](https://github.com/thecodingmachine/prefixer-container):
  dynamically prefix identifiers
- [Lazy-Container](https://github.com/snapshotpl/lazy-container): lazy services

### Projects using `ContainerInterface`

The list below contains only a sample of all the projects consuming `ContainerInterface`. For a more complete list have a look [here](http://packanalyst.com/class?q=Interop%5CContainer%5CContainerInterface).

| | Downloads |
| --- | --- |
| [Adroit](https://github.com/bitexpert/adroit) | ![](https://img.shields.io/packagist/dt/bitexpert/adroit.svg) |
| [Behat](https://github.com/Behat/Behat/pull/974) | ![](https://img.shields.io/packagist/dt/behat/behat.svg) |
| [blast-facades](https://github.com/phpthinktank/blast-facades): Minimize complexity and represent dependencies as facades. | ![](https://img.shields.io/packagist/dt/blast/facades.svg) |
| [interop.silex.di](https://github.com/thecodingmachine/interop.silex.di): an extension to [Silex](http://silex.sensiolabs.org/) that adds support for any *container-interop* compatible container | ![](https://img.shields.io/packagist/dt/mouf/interop.silex.di.svg) |
| [mindplay/walkway](https://github.com/mindplay-dk/walkway): a modular request router | ![](https://img.shields.io/packagist/dt/mindplay/walkway.svg) |
| [mindplay/middleman](https://github.com/mindplay-dk/middleman): minimalist PSR-7 middleware dispatcher | ![](https://img.shields.io/packagist/dt/mindplay/middleman.svg) |
| [PHP-DI/Invoker](https://github.com/PHP-DI/Invoker): extensible and configurable invoker/dispatcher | ![](https://img.shields.io/packagist/dt/php-di/invoker.svg) |
| [Prophiler](https://github.com/fabfuel/prophiler) | ![](https://img.shields.io/packagist/dt/fabfuel/prophiler.svg) |
| [Silly](https://github.com/mnapoli/silly): CLI micro-framework | ![](https://img.shields.io/packagist/dt/mnapoli/silly.svg) |
| [Slim v3](https://github.com/slimphp/Slim) | ![](https://img.shields.io/packagist/dt/slim/slim.svg) |
| [Splash](http://mouf-php.com/packages/mouf/mvc.splash-common/version/8.0-dev/README.md) | ![](https://img.shields.io/packagist/dt/mouf/mvc.splash-common.svg) |
| [Woohoo Labs. Harmony](https://github.com/woohoolabs/harmony): a flexible micro-framework | ![](https://img.shields.io/packagist/dt/woohoolabs/harmony.svg) |
| [zend-expressive](https://github.com/zendframework/zend-expressive) | ![](https://img.shields.io/packagist/dt/zendframework/zend-expressive.svg) |


## Workflow

Everyone is welcome to join and contribute.

The general workflow looks like this:

1. Someone opens a discussion (GitHub issue) to suggest an interface
1. Feedback is gathered
1. The interface is added to a development branch
1. We release alpha versions so that the interface can be experimented with
1. Discussions and edits ensue until the interface is deemed stable by a general consensus
1. A new minor version of the package is released

We try to not break BC by creating new interfaces instead of editing existing ones.

While we currently work on interfaces, we are open to anything that might help towards interoperability, may that
be code, best practices, etc.
