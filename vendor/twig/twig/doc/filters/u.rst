``u``
=====

The ``u`` filter wraps a text in a Unicode object (a `Symfony UnicodeString
instance <https://symfony.com/doc/current/components/string.html>`_) that
exposes methods to "manipulate" the string.

Let's see some common use cases.

Wrapping a text to a given number of characters:

.. code-block:: twig

    {{ 'Symfony String + Twig = <3'|u.wordwrap(5) }}
    Symfony
    String
    +
    Twig
    = <3

Truncating a string:

.. code-block:: twig

    {{ 'Lorem ipsum'|u.truncate(8) }}
    Lorem ip

    {{ 'Lorem ipsum'|u.truncate(8, '...') }}
    Lorem...

Converting a string to *snake* case or *camelCase*:

.. code-block:: twig

    {{ 'SymfonyStringWithTwig'|u.snake }}
    symfony_string_with_twig

    {{ 'symfony_string with twig'|u.camel.title }}
    SymfonyStringWithTwig

You can also chain methods:

.. code-block:: twig

    {{ 'Symfony String + Twig = <3'|u.wordwrap(5).upper }}
    SYMFONY
    STRING
    +
    TWIG
    = <3

For large strings manipulation, use the ``apply`` tag:

.. code-block:: twig

    {% apply u.wordwrap(5) %}
        Some large amount of text...
    {% endapply %}

.. note::

    The ``u`` filter is part of the ``StringExtension`` which is not installed
    by default. Install it first:

    .. code-block:: bash

        $ composer req twig/string-extra

    Then, use the ``twig/extra-bundle`` on Symfony projects or add the extension
    explicitly on the Twig environment::

        use Twig\Extra\String\StringExtension;

        $twig = new \Twig\Environment(...);
        $twig->addExtension(new StringExtension());
