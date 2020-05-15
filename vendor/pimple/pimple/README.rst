Pimple
======

.. caution::

    This is the documentation for Pimple 3.x. If you are using Pimple 1.x, read
    the `Pimple 1.x documentation`_. Reading the Pimple 1.x code is also a good
    way to learn more about how to create a simple Dependency Injection
    Container (recent versions of Pimple are more focused on performance).

Pimple is a small Dependency Injection Container for PHP.

Installation
------------

Before using Pimple in your project, add it to your ``composer.json`` file:

.. code-block:: bash

    $ ./composer.phar require pimple/pimple "^3.0"

Usage
-----

Creating a container is a matter of creating a ``Container`` instance:

.. code-block:: php

    use Pimple\Container;

    $container = new Container();

As many other dependency injection containers, Pimple manages two different
kind of data: **services** and **parameters**.

Defining Services
~~~~~~~~~~~~~~~~~

A service is an object that does something as part of a larger system. Examples
of services: a database connection, a templating engine, or a mailer. Almost
any **global** object can be a service.

Services are defined by **anonymous functions** that return an instance of an
object:

.. code-block:: php

    // define some services
    $container['session_storage'] = function ($c) {
        return new SessionStorage('SESSION_ID');
    };

    $container['session'] = function ($c) {
        return new Session($c['session_storage']);
    };

Notice that the anonymous function has access to the current container
instance, allowing references to other services or parameters.

As objects are only created when you get them, the order of the definitions
does not matter.

Using the defined services is also very easy:

.. code-block:: php

    // get the session object
    $session = $container['session'];

    // the above call is roughly equivalent to the following code:
    // $storage = new SessionStorage('SESSION_ID');
    // $session = new Session($storage);

Defining Factory Services
~~~~~~~~~~~~~~~~~~~~~~~~~

By default, each time you get a service, Pimple returns the **same instance**
of it. If you want a different instance to be returned for all calls, wrap your
anonymous function with the ``factory()`` method

.. code-block:: php

    $container['session'] = $container->factory(function ($c) {
        return new Session($c['session_storage']);
    });

Now, each call to ``$container['session']`` returns a new instance of the
session.

Defining Parameters
~~~~~~~~~~~~~~~~~~~

Defining a parameter allows to ease the configuration of your container from
the outside and to store global values:

.. code-block:: php

    // define some parameters
    $container['cookie_name'] = 'SESSION_ID';
    $container['session_storage_class'] = 'SessionStorage';

If you change the ``session_storage`` service definition like below:

.. code-block:: php

    $container['session_storage'] = function ($c) {
        return new $c['session_storage_class']($c['cookie_name']);
    };

You can now easily change the cookie name by overriding the
``cookie_name`` parameter instead of redefining the service
definition.

Protecting Parameters
~~~~~~~~~~~~~~~~~~~~~

Because Pimple sees anonymous functions as service definitions, you need to
wrap anonymous functions with the ``protect()`` method to store them as
parameters:

.. code-block:: php

    $container['random_func'] = $container->protect(function () {
        return rand();
    });

Modifying Services after Definition
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In some cases you may want to modify a service definition after it has been
defined. You can use the ``extend()`` method to define additional code to be
run on your service just after it is created:

.. code-block:: php

    $container['session_storage'] = function ($c) {
        return new $c['session_storage_class']($c['cookie_name']);
    };

    $container->extend('session_storage', function ($storage, $c) {
        $storage->...();

        return $storage;
    });

The first argument is the name of the service to extend, the second a function
that gets access to the object instance and the container.

Extending a Container
~~~~~~~~~~~~~~~~~~~~~

If you use the same libraries over and over, you might want to reuse some
services from one project to the next one; package your services into a
**provider** by implementing ``Pimple\ServiceProviderInterface``:

.. code-block:: php

    use Pimple\Container;

    class FooProvider implements Pimple\ServiceProviderInterface
    {
        public function register(Container $pimple)
        {
            // register some services and parameters
            // on $pimple
        }
    }

Then, register the provider on a Container:

.. code-block:: php

    $pimple->register(new FooProvider());

Fetching the Service Creation Function
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When you access an object, Pimple automatically calls the anonymous function
that you defined, which creates the service object for you. If you want to get
raw access to this function, you can use the ``raw()`` method:

.. code-block:: php

    $container['session'] = function ($c) {
        return new Session($c['session_storage']);
    };

    $sessionFunction = $container->raw('session');

PSR-11 compatibility
--------------------

For historical reasons, the ``Container`` class does not implement the PSR-11
``ContainerInterface``. However, Pimple provides a helper class that will let
you decouple your code from the Pimple container class.

The PSR-11 container class
~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``Pimple\Psr11\Container`` class lets you access the content of an
underlying Pimple container using ``Psr\Container\ContainerInterface``
methods:

.. code-block:: php

    use Pimple\Container;
    use Pimple\Psr11\Container as PsrContainer;

    $container = new Container();
    $container['service'] = function ($c) {
        return new Service();
    };
    $psr11 = new PsrContainer($container);

    $controller = function (PsrContainer $container) {
        $service = $container->get('service');
    };
    $controller($psr11);

Using the PSR-11 ServiceLocator
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sometimes, a service needs access to several other services without being sure
that all of them will actually be used. In those cases, you may want the
instantiation of the services to be lazy.

The traditional solution is to inject the entire service container to get only
the services really needed. However, this is not recommended because it gives
services a too broad access to the rest of the application and it hides their
actual dependencies.

The ``ServiceLocator`` is intended to solve this problem by giving access to a
set of predefined services while instantiating them only when actually needed.

It also allows you to make your services available under a different name than
the one used to register them. For instance, you may want to use an object
that expects an instance of ``EventDispatcherInterface`` to be available under
the name ``event_dispatcher`` while your event dispatcher has been
registered under the name ``dispatcher``:

.. code-block:: php

    use Monolog\Logger;
    use Pimple\Psr11\ServiceLocator;
    use Psr\Container\ContainerInterface;
    use Symfony\Component\EventDispatcher\EventDispatcher;

    class MyService
    {
        /**
         * "logger" must be an instance of Psr\Log\LoggerInterface
         * "event_dispatcher" must be an instance of Symfony\Component\EventDispatcher\EventDispatcherInterface
         */
        private $services;

        public function __construct(ContainerInterface $services)
        {
            $this->services = $services;
        }
    }

    $container['logger'] = function ($c) {
        return new Monolog\Logger();
    };
    $container['dispatcher'] = function () {
        return new EventDispatcher();
    };

    $container['service'] = function ($c) {
        $locator = new ServiceLocator($c, array('logger', 'event_dispatcher' => 'dispatcher'));

        return new MyService($locator);
    };

Referencing a Collection of Services Lazily
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Passing a collection of services instances in an array may prove inefficient
if the class that consumes the collection only needs to iterate over it at a
later stage, when one of its method is called. It can also lead to problems
if there is a circular dependency between one of the services stored in the
collection and the class that consumes it.

The ``ServiceIterator`` class helps you solve these issues. It receives a
list of service names during instantiation and will retrieve the services
when iterated over:

.. code-block:: php

    use Pimple\Container;
    use Pimple\ServiceIterator;

    class AuthorizationService
    {
        private $voters;

        public function __construct($voters)
        {
            $this->voters = $voters;
        }

        public function canAccess($resource)
        {
            foreach ($this->voters as $voter) {
                if (true === $voter->canAccess($resource) {
                    return true;
                }
            }

            return false;
        }
    }

    $container = new Container();

    $container['voter1'] = function ($c) {
        return new SomeVoter();
    }
    $container['voter2'] = function ($c) {
        return new SomeOtherVoter($c['auth']);
    }
    $container['auth'] = function ($c) {
        return new AuthorizationService(new ServiceIterator($c, array('voter1', 'voter2'));
    }

.. _Pimple 1.x documentation: https://github.com/silexphp/Pimple/tree/1.1
