``title``
=========

The ``title`` filter returns a titlecased version of the value. Words will
start with uppercase letters, all remaining characters are lowercase:

.. code-block:: jinja

    {{ 'my first car'|title }}

    {# outputs 'My First Car' #}
