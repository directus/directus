``empty``
=========

``empty`` checks if a variable is an empty string, an empty array, an empty
hash, exactly ``false``, or exactly ``null``:

.. code-block:: jinja

    {% if foo is empty %}
        ...
    {% endif %}
