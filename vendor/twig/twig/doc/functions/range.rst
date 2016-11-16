``range``
=========

Returns a list containing an arithmetic progression of integers:

.. code-block:: jinja

    {% for i in range(0, 3) %}
        {{ i }},
    {% endfor %}

    {# outputs 0, 1, 2, 3, #}

When step is given (as the third parameter), it specifies the increment (or
decrement):

.. code-block:: jinja

    {% for i in range(0, 6, 2) %}
        {{ i }},
    {% endfor %}

    {# outputs 0, 2, 4, 6, #}

The Twig built-in ``..`` operator is just syntactic sugar for the ``range``
function (with a step of 1):

.. code-block:: jinja

    {% for i in 0..3 %}
        {{ i }},
    {% endfor %}

.. tip::

    The ``range`` function works as the native PHP `range`_ function.

Arguments
---------

* ``low``:  The first value of the sequence.
* ``high``: The highest possible value of the sequence.
* ``step``: The increment between elements of the sequence.

.. _`range`: http://php.net/range
