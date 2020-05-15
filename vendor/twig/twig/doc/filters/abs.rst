``abs``
=======

The ``abs`` filter returns the absolute value.

.. code-block:: twig

    {# number = -5 #}

    {{ number|abs }}

    {# outputs 5 #}

.. note::

    Internally, Twig uses the PHP `abs`_ function.

.. _`abs`: https://secure.php.net/abs
