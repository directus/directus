``format_number``
=================

The ``format_number`` filter formats a number:

.. code-block:: twig

    {{ '12.345'|format_number }}

You can pass attributes to tweak the output:

.. code-block:: twig

    {# 12.34 #}
    {{ '12.345'|format_number({rounding_mode: 'floor'}) }}

    {# 1000000.0000 #}
    {{ '1000000'|format_number({fraction_digit: 4}) }}

The list of supported options:

* ``grouping_used``;
* ``decimal_always_shown``;
* ``max_integer_digit``;
* ``min_integer_digit``;
* ``integer_digit``;
* ``max_fraction_digit``;
* ``min_fraction_digit``;
* ``fraction_digit``;
* ``multiplier``;
* ``grouping_size``;
* ``rounding_mode``;
* ``rounding_increment``;
* ``format_width``;
* ``padding_position``;
* ``secondary_grouping_size``;
* ``significant_digits_used``;
* ``min_significant_digits_used``;
* ``max_significant_digits_used``;
* ``lenient_parse``.

Besides plain numbers, the filter can also format numbers in various styles:

.. code-block:: twig

    {# 1,234% #}
    {{ '12.345'|format_number(style='percent') }}

    {# twelve point three four five #}
    {{ '12.345'|format_number(style='spellout') }}

    {# 12 sec. #}
    {{ '12'|format_duration_number }}

The list of supported styles:

* ``decimal``;
* ``currency``;
* ``percent``;
* ``scientific``;
* ``spellout``;
* ``ordinal``;
* ``duration``.

As a shortcut, you can use the ``format_*_number`` filters by replacing `*` with
a style:

.. code-block:: twig

    {# 1,234% #}
    {{ '12.345'|format_percent_number }}

    {# twelve point three four five #}
    {{ '12.345'|format_spellout_number }}

You can pass attributes to tweak the output:

.. code-block:: twig

    {# €12.34 #}
    {{ '12.345'|format_number('EUR', {rounding_mode: 'floor'}) }}

    {# €1,000,000.0000 #}
    {{ '1000000'|format_number('EUR', {fraction_digit: 4}) }}

By default, the filter uses the current locale. You can pass it explicitly:

.. code-block:: twig

    {# 12,345 #}
    {{ '12.345'|format_number(locale='fr') }}

.. note::

    The ``format_number`` filter is part of the ``IntlExtension`` which is not
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
* ``attrs``: A map of attributes
* ``style``: The style of the number output
