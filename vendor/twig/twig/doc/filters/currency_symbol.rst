``currency_symbol``
===================

The ``currency_symbol`` filter returns the currency symbol given its three-letter
code:

.. code-block:: twig

    {# € #}
    {{ 'EUR'|currency_symbol }}

    {# ¥ #}
    {{ 'JPY'|currency_symbol }}

By default, the filter uses the current locale. You can pass it explicitly:

.. code-block:: twig

    {# ¥ #}
    {{ 'JPY'|currency_symbol('fr') }}

.. note::

    The ``currency_symbol`` filter is part of the ``IntlExtension`` which is not
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
