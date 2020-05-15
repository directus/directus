``format``
==========

The ``format`` filter formats a given string by replacing the placeholders
(placeholders follows the `sprintf`_ notation):

.. code-block:: twig

    {{ "I like %s and %s."|format(foo, "bar") }}

    {# outputs I like foo and bar
       if the foo parameter equals to the foo string. #}

.. _`sprintf`: https://secure.php.net/sprintf

.. seealso:: :doc:`replace<replace>`
