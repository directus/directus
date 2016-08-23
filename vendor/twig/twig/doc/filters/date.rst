``date``
========

.. versionadded:: 1.1
    The timezone support has been added in Twig 1.1.

.. versionadded:: 1.5
    The default date format support has been added in Twig 1.5.

.. versionadded:: 1.6.1
    The default timezone support has been added in Twig 1.6.1.

.. versionadded:: 1.11.0
    The introduction of the false value for the timezone was introduced in Twig 1.11.0

The ``date`` filter formats a date to a given format:

.. code-block:: jinja

    {{ post.published_at|date("m/d/Y") }}

The format specifier is the same as supported by `date`_,
except when the filtered data is of type `DateInterval`_, when the format must conform to
`DateInterval::format`_ instead.

The ``date`` filter accepts strings (it must be in a format supported by the
`strtotime`_ function), `DateTime`_ instances, or `DateInterval`_ instances. For
instance, to display the current date, filter the word "now":

.. code-block:: jinja

    {{ "now"|date("m/d/Y") }}

To escape words and characters in the date format use ``\\`` in front of each
character:

.. code-block:: jinja

    {{ post.published_at|date("F jS \\a\\t g:ia") }}

If the value passed to the ``date`` filter is ``null``, it will return the
current date by default. If an empty string is desired instead of the current
date, use a ternary operator:

.. code-block:: jinja

    {{ post.published_at is empty ? "" : post.published_at|date("m/d/Y") }}

If no format is provided, Twig will use the default one: ``F j, Y H:i``. This
default can be easily changed by calling the ``setDateFormat()`` method on the
``core`` extension instance. The first argument is the default format for
dates and the second one is the default format for date intervals:

.. code-block:: php

    $twig = new Twig_Environment($loader);
    $twig->getExtension('core')->setDateFormat('d/m/Y', '%d days');

Timezone
--------

By default, the date is displayed by applying the default timezone (the one
specified in php.ini or declared in Twig -- see below), but you can override
it by explicitly specifying a timezone:

.. code-block:: jinja

    {{ post.published_at|date("m/d/Y", "Europe/Paris") }}

If the date is already a DateTime object, and if you want to keep its current
timezone, pass ``false`` as the timezone value:

.. code-block:: jinja

    {{ post.published_at|date("m/d/Y", false) }}

The default timezone can also be set globally by calling ``setTimezone()``:

.. code-block:: php

    $twig = new Twig_Environment($loader);
    $twig->getExtension('core')->setTimezone('Europe/Paris');

Arguments
---------

* ``format``:   The date format
* ``timezone``: The date timezone

.. _`strtotime`:            http://www.php.net/strtotime
.. _`DateTime`:             http://www.php.net/DateTime
.. _`DateInterval`:         http://www.php.net/DateInterval
.. _`date`:                 http://www.php.net/date
.. _`DateInterval::format`: http://www.php.net/DateInterval.format
