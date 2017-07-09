``number_format``
=================

.. versionadded:: 1.5
    The ``number_format`` filter was added in Twig 1.5

The ``number_format`` filter formats numbers.  It is a wrapper around PHP's
`number_format`_ function:

.. code-block:: jinja

    {{ 200.35|number_format }}

You can control the number of decimal places, decimal point, and thousands
separator using the additional arguments:

.. code-block:: jinja

    {{ 9800.333|number_format(2, '.', ',') }}

To format negative numbers, wrap the number with parentheses (needed because of
Twig's :ref:`precedence of operators <twig-expressions>`:

.. code-block:: jinja

    {{ -9800.333|number_format(2, '.', ',') }} {# outputs : -9 #}
    {{ (-9800.333)|number_format(2, '.', ',') }} {# outputs : -9,800.33 #}

If no formatting options are provided then Twig will use the default formatting
options of:

* 0 decimal places.
* ``.`` as the decimal point.
* ``,`` as the thousands separator.

These defaults can be easily changed through the core extension:

.. code-block:: php

    $twig = new Twig_Environment($loader);
    $twig->getExtension('Twig_Extension_Core')->setNumberFormat(3, '.', ',');

    // before Twig 1.26
    $twig->getExtension('core')->setNumberFormat(3, '.', ',');

The defaults set for ``number_format`` can be over-ridden upon each call using the
additional parameters.

Arguments
---------

* ``decimal``:       The number of decimal points to display
* ``decimal_point``: The character(s) to use for the decimal point
* ``thousand_sep``:   The character(s) to use for the thousands separator

.. _`number_format`: http://php.net/number_format
