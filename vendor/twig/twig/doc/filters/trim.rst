``trim``
========

The ``trim`` filter strips whitespace (or other characters) from the beginning
and end of a string:

.. code-block:: twig

    {{ '  I like Twig.  '|trim }}

    {# outputs 'I like Twig.' #}

    {{ '  I like Twig.'|trim('.') }}

    {# outputs '  I like Twig' #}

    {{ '  I like Twig.  '|trim(side='left') }}

    {# outputs 'I like Twig.  ' #}

    {{ '  I like Twig.  '|trim(' ', 'right') }}

    {# outputs '  I like Twig.' #}

.. note::

    Internally, Twig uses the PHP `trim`_, `ltrim`_, and `rtrim`_ functions.

Arguments
---------

* ``character_mask``: The characters to strip

* ``side``: The default is to strip from the left and the right (`both`) sides, but `left`
  and `right` will strip from either the left side or right side only

.. _`trim`: https://secure.php.net/trim
.. _`ltrim`: https://secure.php.net/ltrim
.. _`rtrim`: https://secure.php.net/rtrim
