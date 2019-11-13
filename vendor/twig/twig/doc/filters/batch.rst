``batch``
=========

The ``batch`` filter "batches" items by returning a list of lists with the
given number of items. A second parameter can be provided and used to fill in
missing items:

.. code-block:: twig

    {% set items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] %}

    <table>
    {% for row in items|batch(3, 'No item') %}
        <tr>
            {% for column in row %}
                <td>{{ column }}</td>
            {% endfor %}
        </tr>
    {% endfor %}
    </table>

The above example will be rendered as:

.. code-block:: twig

    <table>
        <tr>
            <td>a</td>
            <td>b</td>
            <td>c</td>
        </tr>
        <tr>
            <td>d</td>
            <td>e</td>
            <td>f</td>
        </tr>
        <tr>
            <td>g</td>
            <td>No item</td>
            <td>No item</td>
        </tr>
    </table>

Arguments
---------

* ``size``: The size of the batch; fractional numbers will be rounded up
* ``fill``: Used to fill in missing items
* ``preserve_keys``: Whether to preserve keys or not
