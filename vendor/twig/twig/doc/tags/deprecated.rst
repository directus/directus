``deprecated``
==============

.. versionadded:: 1.36 and 2.6
    The ``deprecated`` tag was added in Twig 1.36 and 2.6.

Twig generates a deprecation notice (via a call to the ``trigger_error()``
PHP function) where the ``deprecated`` tag is used in a template:

.. code-block:: jinja

    {# base.twig #}
    {% deprecated 'The "base.twig" template is deprecated, use "layout.twig" instead.' %}
    {% extends 'layout.twig' %}

Also you can deprecate a block in the following way:

.. code-block:: jinja

    {% block hey %}
        {% deprecated 'The "hey" block is deprecated, use "greet" instead.' %}
        {{ block('greet') }}
    {% endblock %}

    {% block greet %}
        Hey you!
    {% endblock %}

Note that by default, the deprecation notices are silenced and never displayed nor logged.
See :ref:`deprecation-notices` to learn how to handle them.
