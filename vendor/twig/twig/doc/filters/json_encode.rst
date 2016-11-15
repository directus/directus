``json_encode``
===============

The ``json_encode`` filter returns the JSON representation of a value:

.. code-block:: jinja

    {{ data|json_encode() }}

.. note::

    Internally, Twig uses the PHP `json_encode`_ function.

Arguments
---------

* ``options``: A bitmask of `json_encode options`_ (``{{
  data|json_encode(constant('JSON_PRETTY_PRINT')) }}``)

.. _`json_encode`: http://php.net/json_encode
.. _`json_encode options`: http://www.php.net/manual/en/json.constants.php
