``escape``
==========

The ``escape`` filter escapes a string using strategies that depend on the
context.

By default, it uses the HTML escaping strategy:

.. code-block:: html+twig

    <p>
        {{ user.username|escape }}
    </p>

For convenience, the ``e`` filter is defined as an alias:

.. code-block:: html+twig

    <p>
        {{ user.username|e }}
    </p>

The ``escape`` filter can also be used in other contexts than HTML thanks to
an optional argument which defines the escaping strategy to use:

.. code-block:: twig

    {{ user.username|e }}
    {# is equivalent to #}
    {{ user.username|e('html') }}

And here is how to escape variables included in JavaScript code:

.. code-block:: twig

    {{ user.username|escape('js') }}
    {{ user.username|e('js') }}

The ``escape`` filter supports the following escaping strategies for HTML
documents:

* ``html``: escapes a string for the **HTML body** context.

* ``js``: escapes a string for the **JavaScript** context.

* ``css``: escapes a string for the **CSS** context. CSS escaping can be
  applied to any string being inserted into CSS and escapes everything except
  alphanumerics.

* ``url``: escapes a string for the **URI or parameter** contexts. This should
  not be used to escape an entire URI; only a subcomponent being inserted.

* ``html_attr``: escapes a string for the **HTML attribute** context.

Note that doing contextual escaping in HTML documents is hard and choosing the
right escaping strategy depends on a lot of factors. Please, read related
documentation like `the OWASP prevention cheat sheet
<https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.md>`_
to learn more about this topic.

.. note::

    Internally, ``escape`` uses the PHP native `htmlspecialchars`_ function
    for the HTML escaping strategy.

.. caution::

    When using automatic escaping, Twig tries to not double-escape a variable
    when the automatic escaping strategy is the same as the one applied by the
    escape filter; but that does not work when using a variable as the
    escaping strategy:

    .. code-block:: twig

        {% set strategy = 'html' %}

        {% autoescape 'html' %}
            {{ var|escape('html') }}   {# won't be double-escaped #}
            {{ var|escape(strategy) }} {# will be double-escaped #}
        {% endautoescape %}

    When using a variable as the escaping strategy, you should disable
    automatic escaping:

    .. code-block:: twig

        {% set strategy = 'html' %}

        {% autoescape 'html' %}
            {{ var|escape(strategy)|raw }} {# won't be double-escaped #}
        {% endautoescape %}

Custom Escapers
---------------

You can define custom escapers by calling the ``setEscaper()`` method on the
``core`` extension instance. The first argument is the escaper name (to be
used in the ``escape`` call) and the second one must be a valid PHP callable:

.. code-block:: php

    $twig = new \Twig\Environment($loader);
    $twig->getExtension(\Twig\Extension\CoreExtension::class)->setEscaper('csv', 'csv_escaper');

When called by Twig, the callable receives the Twig environment instance, the
string to escape, and the charset.

.. note::

    Built-in escapers cannot be overridden mainly because they should be
    considered as the final implementation and also for better performance.

Arguments
---------

* ``strategy``: The escaping strategy
* ``charset``:  The string charset

.. _`htmlspecialchars`: https://secure.php.net/htmlspecialchars
