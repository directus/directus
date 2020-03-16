``language_name``
=================

.. versionadded:: 2.12
    The ``language_name`` filter was added in Twig 2.12.

The ``language_name`` filter returns the language name given its two-letter
code:

.. code-block:: twig

    {# German #}
    {{ 'de'|language_name }}

By default, the filter uses the current locale. You can pass it explicitly:

.. code-block:: twig

    {# allemand #}
    {{ 'de'|language_name('fr') }}

    {# français canadien #}
    {{ 'fr_CA'|language_name('fr_FR') }}

.. note::

    The ``language_name`` filter is part of the ``IntlExtension`` which is not
    installed by default. Install it first:

    .. code-block:: bash

        $ composer req twig/intl-extra

    Then, use the ``twig/extra-bundle`` on Symfony projects or add the extension
    explictly on the Twig environment::

        use Twig\Extra\Intl\IntlExtension;

        $twig = new \Twig\Environment(...);
        $twig->addExtension(new IntlExtension());

Arguments
---------

* ``locale``: The locale
