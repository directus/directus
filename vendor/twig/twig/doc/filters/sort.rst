``sort``
========

The ``sort`` filter sorts an array:

.. code-block:: jinja

    {% for user in users|sort %}
        ...
    {% endfor %}

.. note::

    Internally, Twig uses the PHP `asort`_ function to maintain index
    association. It supports Traversable objects by transforming
    those to arrays.

.. _`asort`: http://php.net/asort
