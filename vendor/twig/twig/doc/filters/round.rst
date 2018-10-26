``round``
=========

The ``round`` filter rounds a number to a given precision:

.. code-block:: jinja

    {{ 42.55|round }}
    {# outputs 43 #}

    {{ 42.55|round(1, 'floor') }}
    {# outputs 42.5 #}

The ``round`` filter takes two optional arguments; the first one specifies the
precision (default is ``0``) and the second the rounding method (default is
``common``):

* ``common`` rounds either up or down (rounds the value up to precision decimal
  places away from zero, when it is half way there -- making 1.5 into 2 and
  -1.5 into -2);

* ``ceil`` always rounds up;

* ``floor`` always rounds down.

.. note::

    The ``//`` operator is equivalent to ``|round(0, 'floor')``.

Arguments
---------

* ``precision``: The rounding precision
* ``method``: The rounding method
