Introduction
============

This library provides a way of avoiding usage of constructors when instantiating PHP classes.

Installation
============

The suggested installation method is via `composer`_:

.. code-block:: console

   $ composer require doctrine/instantiator

Usage
=====

The instantiator is able to create new instances of any class without
using the constructor or any API of the class itself:

.. code-block:: php

    <?php

    use Doctrine\Instantiator\Instantiator;
    use App\Entities\User;

    $instantiator = new Instantiator();

    $user = $instantiator->instantiate(User::class);

Contributing
============

-  Follow the `Doctrine Coding Standard`_
-  The project will follow strict `object calisthenics`_
-  Any contribution must provide tests for additional introduced
   conditions
-  Any un-confirmed issue needs a failing test case before being
   accepted
-  Pull requests must be sent from a new hotfix/feature branch, not from
   ``master``.

Testing
=======

The PHPUnit version to be used is the one installed as a dev- dependency
via composer:

.. code-block:: console

   $ ./vendor/bin/phpunit

Accepted coverage for new contributions is 80%. Any contribution not
satisfying this requirement won’t be merged.

Credits
=======

This library was migrated from `ocramius/instantiator`_, which has been
donated to the doctrine organization, and which is now deprecated in
favour of this package.

.. _composer: https://getcomposer.org/
.. _CONTRIBUTING.md: CONTRIBUTING.md
.. _ocramius/instantiator: https://github.com/Ocramius/Instantiator
.. _Doctrine Coding Standard: https://github.com/doctrine/coding-standard
.. _object calisthenics: http://www.slideshare.net/guilhermeblanco/object-calisthenics-applied-to-php
