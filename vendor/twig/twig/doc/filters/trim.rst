``trim``
========

.. versionadded:: 1.6.2
    The ``trim`` filter was added in Twig 1.6.2.

The ``trim`` filter strips whitespace (or other characters) from the beginning
and end of a string:

.. code-block:: jinja

    {{ '  I like Twig.  '|trim }}

    {# outputs 'I like Twig.' #}

    {{ '  I like Twig.'|trim('.') }}

    {# outputs '  I like Twig' #}

.. note::

    Internally, Twig uses the PHP `trim`_ function.

Arguments
---------

* ``character_mask``: The characters to strip

.. _`trim`: http://php.net/trim
