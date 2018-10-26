``keys``
========

The ``keys`` filter returns the keys of an array. It is useful when you want to
iterate over the keys of an array:

.. code-block:: jinja

    {% for key in array|keys %}
        ...
    {% endfor %}
