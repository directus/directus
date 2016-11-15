``constant``
============

.. versionadded: 1.13.1
    constant now accepts object instances as the second argument.

``constant`` checks if a variable has the exact same value as a constant. You
can use either global constants or class constants:

.. code-block:: jinja

    {% if post.status is constant('Post::PUBLISHED') %}
        the status attribute is exactly the same as Post::PUBLISHED
    {% endif %}

You can test constants from object instances as well:

.. code-block:: jinja

    {% if post.status is constant('PUBLISHED', post) %}
        the status attribute is exactly the same as Post::PUBLISHED
    {% endif %}
