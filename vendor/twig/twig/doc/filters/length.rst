``length``
==========

The ``length`` filter returns the number of items of a sequence or mapping, or
the length of a string:

.. code-block:: jinja

    {% if users|length > 10 %}
        ...
    {% endif %}
