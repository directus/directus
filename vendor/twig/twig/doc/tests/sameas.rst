``same as``
===========

``same as`` checks if a variable is the same as another variable.
This is equivalent to ``===`` in PHP:

.. code-block:: twig

    {% if foo.attribute is same as(false) %}
        the foo attribute really is the 'false' PHP value
    {% endif %}
