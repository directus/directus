``for``
=======

Loop over each item in a sequence. For example, to display a list of users
provided in a variable called ``users``:

.. code-block:: jinja

    <h1>Members</h1>
    <ul>
        {% for user in users %}
            <li>{{ user.username|e }}</li>
        {% endfor %}
    </ul>

.. note::

    A sequence can be either an array or an object implementing the
    ``Traversable`` interface.

If you do need to iterate over a sequence of numbers, you can use the ``..``
operator:

.. code-block:: jinja

    {% for i in 0..10 %}
        * {{ i }}
    {% endfor %}

The above snippet of code would print all numbers from 0 to 10.

It can be also useful with letters:

.. code-block:: jinja

    {% for letter in 'a'..'z' %}
        * {{ letter }}
    {% endfor %}

The ``..`` operator can take any expression at both sides:

.. code-block:: jinja

    {% for letter in 'a'|upper..'z'|upper %}
        * {{ letter }}
    {% endfor %}

.. tip:

    If you need a step different from 1, you can use the ``range`` function
    instead.

The `loop` variable
-------------------

Inside of a ``for`` loop block you can access some special variables:

===================== =============================================================
Variable              Description
===================== =============================================================
``loop.index``        The current iteration of the loop. (1 indexed)
``loop.index0``       The current iteration of the loop. (0 indexed)
``loop.revindex``     The number of iterations from the end of the loop (1 indexed)
``loop.revindex0``    The number of iterations from the end of the loop (0 indexed)
``loop.first``        True if first iteration
``loop.last``         True if last iteration
``loop.length``       The number of items in the sequence
``loop.parent``       The parent context
===================== =============================================================

.. code-block:: jinja

    {% for user in users %}
        {{ loop.index }} - {{ user.username }}
    {% endfor %}

.. note::

    The ``loop.length``, ``loop.revindex``, ``loop.revindex0``, and
    ``loop.last`` variables are only available for PHP arrays, or objects that
    implement the ``Countable`` interface. They are also not available when
    looping with a condition.

Adding a condition
------------------

Unlike in PHP, it's not possible to ``break`` or ``continue`` in a loop. You
can however filter the sequence during iteration which allows you to skip
items. The following example skips all the users which are not active:

.. code-block:: jinja

    <ul>
        {% for user in users if user.active %}
            <li>{{ user.username|e }}</li>
        {% endfor %}
    </ul>

The advantage is that the special loop variable will count correctly thus not
counting the users not iterated over. Keep in mind that properties like
``loop.last`` will not be defined when using loop conditions.

.. note::

    Using the ``loop`` variable within the condition is not recommended as it
    will probably not be doing what you expect it to. For instance, adding a
    condition like ``loop.index > 4`` won't work as the index is only
    incremented when the condition is true (so the condition will never
    match).

The `else` Clause
-----------------

If no iteration took place because the sequence was empty, you can render a
replacement block by using ``else``:

.. code-block:: jinja

    <ul>
        {% for user in users %}
            <li>{{ user.username|e }}</li>
        {% else %}
            <li><em>no user found</em></li>
        {% endfor %}
    </ul>

Iterating over Keys
-------------------

By default, a loop iterates over the values of the sequence. You can iterate
on keys by using the ``keys`` filter:

.. code-block:: jinja

    <h1>Members</h1>
    <ul>
        {% for key in users|keys %}
            <li>{{ key }}</li>
        {% endfor %}
    </ul>

Iterating over Keys and Values
------------------------------

You can also access both keys and values:

.. code-block:: jinja

    <h1>Members</h1>
    <ul>
        {% for key, user in users %}
            <li>{{ key }}: {{ user.username|e }}</li>
        {% endfor %}
    </ul>

Iterating over a Subset
-----------------------

You might want to iterate over a subset of values. This can be achieved using
the :doc:`slice <../filters/slice>` filter:

.. code-block:: jinja

    <h1>Top Ten Members</h1>
    <ul>
        {% for user in users|slice(0, 10) %}
            <li>{{ user.username|e }}</li>
        {% endfor %}
    </ul>
