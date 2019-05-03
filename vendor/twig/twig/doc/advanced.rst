Extending Twig
==============

Twig can be extended in many ways; you can add extra tags, filters, tests,
operators, global variables, and functions. You can even extend the parser
itself with node visitors.

.. note::

    The first section of this chapter describes how to extend Twig. If you want
    to reuse your changes in different projects or if you want to share them
    with others, you should then create an extension as described in the
    following section.

.. caution::

    When extending Twig without creating an extension, Twig won't be able to
    recompile your templates when the PHP code is updated. To see your changes
    in real-time, either disable template caching or package your code into an
    extension (see the next section of this chapter).

Before extending Twig, you must understand the differences between all the
different possible extension points and when to use them.

First, remember that Twig has two main language constructs:

* ``{{ }}``: used to print the result of an expression evaluation;

* ``{% %}``: used to execute statements.

To understand why Twig exposes so many extension points, let's see how to
implement a *Lorem ipsum* generator (it needs to know the number of words to
generate).

You can use a ``lipsum`` *tag*:

.. code-block:: twig

    {% lipsum 40 %}

That works, but using a tag for ``lipsum`` is not a good idea for at least
three main reasons:

* ``lipsum`` is not a language construct;
* The tag outputs something;
* The tag is not flexible as you cannot use it in an expression:

  .. code-block:: twig

      {{ 'some text' ~ {% lipsum 40 %} ~ 'some more text' }}

In fact, you rarely need to create tags; and that's good news because tags are
the most complex extension point.

Now, let's use a ``lipsum`` *filter*:

.. code-block:: twig

    {{ 40|lipsum }}

Again, it works. But a filter should transform the passed value to something
else. Here, we use the value to indicate the number of words to generate (so,
``40`` is an argument of the filter, not the value we want to transform).

Next, let's use a ``lipsum`` *function*:

.. code-block:: twig

    {{ lipsum(40) }}

Here we go. For this specific example, the creation of a function is the
extension point to use. And you can use it anywhere an expression is accepted:

.. code-block:: twig

    {{ 'some text' ~ lipsum(40) ~ 'some more text' }}

    {% set lipsum = lipsum(40) %}

Lastly, you can also use a *global* object with a method able to generate lorem
ipsum text:

.. code-block:: twig

    {{ text.lipsum(40) }}

As a rule of thumb, use functions for frequently used features and global
objects for everything else.

Keep in mind the following when you want to extend Twig:

========== ========================== ========== =========================
What?      Implementation difficulty? How often? When?
========== ========================== ========== =========================
*macro*    simple                     frequent   Content generation
*global*   simple                     frequent   Helper object
*function* simple                     frequent   Content generation
*filter*   simple                     frequent   Value transformation
*tag*      complex                    rare       DSL language construct
*test*     simple                     rare       Boolean decision
*operator* simple                     rare       Values transformation
========== ========================== ========== =========================

Globals
-------

A global variable is like any other template variable, except that it's
available in all templates and macros::

    $twig = new \Twig\Environment($loader);
    $twig->addGlobal('text', new Text());

You can then use the ``text`` variable anywhere in a template:

.. code-block:: twig

    {{ text.lipsum(40) }}

Filters
-------

Creating a filter consists of associating a name with a PHP callable::

    // an anonymous function
    $filter = new \Twig\TwigFilter('rot13', function ($string) {
        return str_rot13($string);
    });

    // or a simple PHP function
    $filter = new \Twig\TwigFilter('rot13', 'str_rot13');

    // or a class static method
    $filter = new \Twig\TwigFilter('rot13', ['SomeClass', 'rot13Filter']);
    $filter = new \Twig\TwigFilter('rot13', 'SomeClass::rot13Filter');

    // or a class method
    $filter = new \Twig\TwigFilter('rot13', [$this, 'rot13Filter']);
    // the one below needs a runtime implementation (see below for more information)
    $filter = new \Twig\TwigFilter('rot13', ['SomeClass', 'rot13Filter']);

The first argument passed to the ``\Twig\TwigFilter`` constructor is the name of the
filter you will use in templates and the second one is the PHP callable to
associate with it.

Then, add the filter to the Twig environment::

    $twig = new \Twig\Environment($loader);
    $twig->addFilter($filter);

And here is how to use it in a template:

.. code-block:: twig

    {{ 'Twig'|rot13 }}

    {# will output Gjvt #}

When called by Twig, the PHP callable receives the left side of the filter
(before the pipe ``|``) as the first argument and the extra arguments passed
to the filter (within parentheses ``()``) as extra arguments.

For instance, the following code:

.. code-block:: twig

    {{ 'TWIG'|lower }}
    {{ now|date('d/m/Y') }}

is compiled to something like the following::

    <?php echo strtolower('TWIG') ?>
    <?php echo twig_date_format_filter($now, 'd/m/Y') ?>

The ``\Twig\TwigFilter`` class takes an array of options as its last argument::

    $filter = new \Twig\TwigFilter('rot13', 'str_rot13', $options);

Environment-aware Filters
~~~~~~~~~~~~~~~~~~~~~~~~~

If you want to access the current environment instance in your filter, set the
``needs_environment`` option to ``true``; Twig will pass the current
environment as the first argument to the filter call::

    $filter = new \Twig\TwigFilter('rot13', function (Twig_Environment $env, $string) {
        // get the current charset for instance
        $charset = $env->getCharset();

        return str_rot13($string);
    }, ['needs_environment' => true]);

Context-aware Filters
~~~~~~~~~~~~~~~~~~~~~

If you want to access the current context in your filter, set the
``needs_context`` option to ``true``; Twig will pass the current context as
the first argument to the filter call (or the second one if
``needs_environment`` is also set to ``true``)::

    $filter = new \Twig\TwigFilter('rot13', function ($context, $string) {
        // ...
    }, ['needs_context' => true]);

    $filter = new \Twig\TwigFilter('rot13', function (Twig_Environment $env, $context, $string) {
        // ...
    }, ['needs_context' => true, 'needs_environment' => true]);

Automatic Escaping
~~~~~~~~~~~~~~~~~~

If automatic escaping is enabled, the output of the filter may be escaped
before printing. If your filter acts as an escaper (or explicitly outputs HTML
or JavaScript code), you will want the raw output to be printed. In such a
case, set the ``is_safe`` option::

    $filter = new \Twig\TwigFilter('nl2br', 'nl2br', ['is_safe' => ['html']]);

Some filters may need to work on input that is already escaped or safe, for
example when adding (safe) HTML tags to originally unsafe output. In such a
case, set the ``pre_escape`` option to escape the input data before it is run
through your filter::

    $filter = new \Twig\TwigFilter('somefilter', 'somefilter', ['pre_escape' => 'html', 'is_safe' => ['html']]);

Variadic Filters
~~~~~~~~~~~~~~~~

When a filter should accept an arbitrary number of arguments, set the
``is_variadic`` option to ``true``; Twig will pass the extra arguments as the
last argument to the filter call as an array::

    $filter = new \Twig\TwigFilter('thumbnail', function ($file, array $options = []) {
        // ...
    }, ['is_variadic' => true]);

Be warned that :ref:`named arguments <named-arguments>` passed to a variadic
filter cannot be checked for validity as they will automatically end up in the
option array.

Dynamic Filters
~~~~~~~~~~~~~~~

A filter name containing the special ``*`` character is a dynamic filter and
the ``*`` part will match any string::

    $filter = new \Twig\TwigFilter('*_path', function ($name, $arguments) {
        // ...
    });

The following filters are matched by the above defined dynamic filter:

* ``product_path``
* ``category_path``

A dynamic filter can define more than one dynamic parts::

    $filter = new \Twig\TwigFilter('*_path_*', function ($name, $suffix, $arguments) {
        // ...
    });

The filter receives all dynamic part values before the normal filter arguments,
but after the environment and the context. For instance, a call to
``'foo'|a_path_b()`` will result in the following arguments to be passed to the
filter: ``('a', 'b', 'foo')``.

Deprecated Filters
~~~~~~~~~~~~~~~~~~

You can mark a filter as being deprecated by setting the ``deprecated`` option
to ``true``. You can also give an alternative filter that replaces the
deprecated one when that makes sense::

    $filter = new \Twig\TwigFilter('obsolete', function () {
        // ...
    }, ['deprecated' => true, 'alternative' => 'new_one']);

When a filter is deprecated, Twig emits a deprecation notice when compiling a
template using it. See :ref:`deprecation-notices` for more information.

Functions
---------

Functions are defined in the exact same way as filters, but you need to create
an instance of ``\Twig\TwigFunction``::

    $twig = new \Twig\Environment($loader);
    $function = new \Twig\TwigFunction('function_name', function () {
        // ...
    });
    $twig->addFunction($function);

Functions support the same features as filters, except for the ``pre_escape``
and ``preserves_safety`` options.

Tests
-----

Tests are defined in the exact same way as filters and functions, but you need
to create an instance of ``\Twig\TwigTest``::

    $twig = new \Twig\Environment($loader);
    $test = new \Twig\TwigTest('test_name', function () {
        // ...
    });
    $twig->addTest($test);

Tests allow you to create custom application specific logic for evaluating
boolean conditions. As a simple example, let's create a Twig test that checks if
objects are 'red'::

    $twig = new \Twig\Environment($loader);
    $test = new \Twig\TwigTest('red', function ($value) {
        if (isset($value->color) && $value->color == 'red') {
            return true;
        }
        if (isset($value->paint) && $value->paint == 'red') {
            return true;
        }
        return false;
    });
    $twig->addTest($test);

Test functions must always return ``true``/``false``.

When creating tests you can use the ``node_class`` option to provide custom test
compilation. This is useful if your test can be compiled into PHP primitives.
This is used by many of the tests built into Twig::

    $twig = new \Twig\Environment($loader);
    $test = new \Twig\TwigTest(
        'odd',
        null,
        ['node_class' => \Twig\Node\Expression\Test\OddTest::class]);
    $twig->addTest($test);

    class Twig_Node_Expression_Test_Odd extends \Twig\Node\Expression\TestExpression
    {
        public function compile(\Twig\Compiler $compiler)
        {
            $compiler
                ->raw('(')
                ->subcompile($this->getNode('node'))
                ->raw(' % 2 == 1')
                ->raw(')')
            ;
        }
    }

The above example shows how you can create tests that use a node class. The node
class has access to one sub-node called ``node``. This sub-node contains the
value that is being tested. When the ``odd`` filter is used in code such as:

.. code-block:: twig

    {% if my_value is odd %}

The ``node`` sub-node will contain an expression of ``my_value``. Node-based
tests also have access to the ``arguments`` node. This node will contain the
various other arguments that have been provided to your test.

.. versionadded:: 2.6
    Dynamic tests support was added in Twig 2.6.

If you want to pass a variable number of positional or named arguments to the
test, set the ``is_variadic`` option to ``true``. Tests support dynamic
names (see dynamic filters for the syntax).

Tags
----

One of the most exciting features of a template engine like Twig is the
possibility to define new **language constructs**. This is also the most complex
feature as you need to understand how Twig's internals work.

Most of the time though, a tag is not needed:

* If your tag generates some output, use a **function** instead.

* If your tag modifies some content and returns it, use a **filter** instead.

  For instance, if you want to create a tag that converts a Markdown formatted
  text to HTML, create a ``markdown`` filter instead:

  .. code-block:: twig

      {{ '**markdown** text'|markdown }}

  If you want use this filter on large amounts of text, wrap it with the
  :doc:`apply <tags/apply>` tag:

  .. code-block:: twig

      {% apply markdown %}
      Title
      =====

      Much better than creating a tag as you can **compose** filters.
      {% endapply %}

 .. note::

      The ``apply`` tag was introduced in Twig 2.9; use the ``filter`` tag with
      previous versions.

* If your tag does not output anything, but only exists because of a side
  effect, create a **function** that returns nothing and call it via the
  :doc:`filter <tags/do>` tag.

  For instance, if you want to create a tag that logs text, create a ``log``
  function instead and call it via the :doc:`do <tags/do>` tag:

  .. code-block:: twig

      {% do log('Log some things') %}

If you still want to create a tag for a new language construct, great!

Let's create a ``set`` tag that allows the definition of simple variables from
within a template. The tag can be used like follows:

.. code-block:: twig

    {% set name = "value" %}

    {{ name }}

    {# should output value #}

.. note::

    The ``set`` tag is part of the Core extension and as such is always
    available. The built-in version is slightly more powerful and supports
    multiple assignments by default.

Three steps are needed to define a new tag:

* Defining a Token Parser class (responsible for parsing the template code);

* Defining a Node class (responsible for converting the parsed code to PHP);

* Registering the tag.

Registering a new tag
~~~~~~~~~~~~~~~~~~~~~

Add a tag by calling the ``addTokenParser`` method on the ``\Twig\Environment``
instance::

    $twig = new \Twig\Environment($loader);
    $twig->addTokenParser(new Project_Set_TokenParser());

Defining a Token Parser
~~~~~~~~~~~~~~~~~~~~~~~

Now, let's see the actual code of this class::

    class Project_Set_TokenParser extends \Twig\TokenParser\AbstractTokenParser
    {
        public function parse(\Twig\Token $token)
        {
            $parser = $this->parser;
            $stream = $parser->getStream();

            $name = $stream->expect(\Twig\Token::NAME_TYPE)->getValue();
            $stream->expect(\Twig\Token::OPERATOR_TYPE, '=');
            $value = $parser->getExpressionParser()->parseExpression();
            $stream->expect(\Twig\Token::BLOCK_END_TYPE);

            return new Project_Set_Node($name, $value, $token->getLine(), $this->getTag());
        }

        public function getTag()
        {
            return 'set';
        }
    }

The ``getTag()`` method must return the tag we want to parse, here ``set``.

The ``parse()`` method is invoked whenever the parser encounters a ``set``
tag. It should return a ``\Twig\Node\Node`` instance that represents the node (the
``Project_Set_Node`` calls creating is explained in the next section).

The parsing process is simplified thanks to a bunch of methods you can call
from the token stream (``$this->parser->getStream()``):

* ``getCurrent()``: Gets the current token in the stream.

* ``next()``: Moves to the next token in the stream, *but returns the old one*.

* ``test($type)``, ``test($value)`` or ``test($type, $value)``: Determines whether
  the current token is of a particular type or value (or both). The value may be an
  array of several possible values.

* ``expect($type[, $value[, $message]])``: If the current token isn't of the given
  type/value a syntax error is thrown. Otherwise, if the type and value are correct,
  the token is returned and the stream moves to the next token.

* ``look()``: Looks at the next token without consuming it.

Parsing expressions is done by calling the ``parseExpression()`` like we did for
the ``set`` tag.

.. tip::

    Reading the existing ``TokenParser`` classes is the best way to learn all
    the nitty-gritty details of the parsing process.

Defining a Node
~~~~~~~~~~~~~~~

The ``Project_Set_Node`` class itself is quite short::

    class Project_Set_Node extends \Twig\Node\Node
    {
        public function __construct($name, \Twig\Node\Expression\AbstractExpression $value, $line, $tag = null)
        {
            parent::__construct(['value' => $value], ['name' => $name], $line, $tag);
        }

        public function compile(\Twig\Compiler $compiler)
        {
            $compiler
                ->addDebugInfo($this)
                ->write('$context[\''.$this->getAttribute('name').'\'] = ')
                ->subcompile($this->getNode('value'))
                ->raw(";\n")
            ;
        }
    }

The compiler implements a fluid interface and provides methods that helps the
developer generate beautiful and readable PHP code:

* ``subcompile()``: Compiles a node.

* ``raw()``: Writes the given string as is.

* ``write()``: Writes the given string by adding indentation at the beginning
  of each line.

* ``string()``: Writes a quoted string.

* ``repr()``: Writes a PHP representation of a given value (see
  ``\Twig\Node\ForNode`` for a usage example).

* ``addDebugInfo()``: Adds the line of the original template file related to
  the current node as a comment.

* ``indent()``: Indents the generated code (see ``\Twig\Node\BlockNode`` for a
  usage example).

* ``outdent()``: Outdents the generated code (see ``\Twig\Node\BlockNode`` for a
  usage example).

.. _creating_extensions:

Creating an Extension
---------------------

The main motivation for writing an extension is to move often used code into a
reusable class like adding support for internationalization. An extension can
define tags, filters, tests, operators, functions, and node visitors.

Most of the time, it is useful to create a single extension for your project,
to host all the specific tags and filters you want to add to Twig.

.. tip::

    When packaging your code into an extension, Twig is smart enough to
    recompile your templates whenever you make a change to it (when
    ``auto_reload`` is enabled).

.. note::

    Before writing your own extensions, have a look at the Twig official
    extension repository: https://github.com/twigphp/Twig-extensions.

An extension is a class that implements the following interface::

    interface \Twig\Extension\ExtensionInterface
    {
        /**
         * Returns the token parser instances to add to the existing list.
         *
         * @return \Twig\TokenParser\TokenParserInterface[]
         */
        public function getTokenParsers();

        /**
         * Returns the node visitor instances to add to the existing list.
         *
         * @return \Twig\NodeVisitor\NodeVisitorInterface[]
         */
        public function getNodeVisitors();

        /**
         * Returns a list of filters to add to the existing list.
         *
         * @return \Twig\TwigFilter[]
         */
        public function getFilters();

        /**
         * Returns a list of tests to add to the existing list.
         *
         * @return \Twig\TwigTest[]
         */
        public function getTests();

        /**
         * Returns a list of functions to add to the existing list.
         *
         * @return \Twig\TwigFunction[]
         */
        public function getFunctions();

        /**
         * Returns a list of operators to add to the existing list.
         *
         * @return array<array> First array of unary operators, second array of binary operators
         */
        public function getOperators();
    }

To keep your extension class clean and lean, inherit from the built-in
``\Twig\Extension\AbstractExtension`` class instead of implementing the interface as it provides
empty implementations for all methods:

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension
    {
    }

This extension does nothing for now. We will customize it in the next sections.

You can save your extension anywhere on the filesystem, as all extensions must
be registered explicitly to be available in your templates.

You can register an extension by using the ``addExtension()`` method on your
main ``Environment`` object::

    $twig = new \Twig\Environment($loader);
    $twig->addExtension(new Project_Twig_Extension());

.. tip::

    The Twig core extensions are great examples of how extensions work.

Globals
~~~~~~~

Global variables can be registered in an extension via the ``getGlobals()``
method::

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension implements \Twig\Extension\GlobalsInterface
    {
        public function getGlobals()
        {
            return [
                'text' => new Text(),
            ];
        }

        // ...
    }

Functions
~~~~~~~~~

Functions can be registered in an extension via the ``getFunctions()``
method::

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension
    {
        public function getFunctions()
        {
            return [
                new \Twig\TwigFunction('lipsum', 'generate_lipsum'),
            ];
        }

        // ...
    }

Filters
~~~~~~~

To add a filter to an extension, you need to override the ``getFilters()``
method. This method must return an array of filters to add to the Twig
environment::

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension
    {
        public function getFilters()
        {
            return [
                new \Twig\TwigFilter('rot13', 'str_rot13'),
            ];
        }

        // ...
    }

Tags
~~~~

Adding a tag in an extension can be done by overriding the
``getTokenParsers()`` method. This method must return an array of tags to add
to the Twig environment::

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension
    {
        public function getTokenParsers()
        {
            return [new Project_Set_TokenParser()];
        }

        // ...
    }

In the above code, we have added a single new tag, defined by the
``Project_Set_TokenParser`` class. The ``Project_Set_TokenParser`` class is
responsible for parsing the tag and compiling it to PHP.

Operators
~~~~~~~~~

The ``getOperators()`` methods lets you add new operators. Here is how to add
the ``!``, ``||``, and ``&&`` operators::

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension
    {
        public function getOperators()
        {
            return [
                [
                    '!' => ['precedence' => 50, 'class' => \Twig\Node\Expression\Unary\NotUnary::class],
                ],
                [
                    '||' => ['precedence' => 10, 'class' => \Twig\Node\Expression\Binary\OrBinary::class, 'associativity' => \Twig\ExpressionParser::OPERATOR_LEFT],
                    '&&' => ['precedence' => 15, 'class' => \Twig\Node\Expression\Binary\AndBinary::class, 'associativity' => \Twig\ExpressionParser::OPERATOR_LEFT],
                ],
            ];
        }

        // ...
    }

Tests
~~~~~

The ``getTests()`` method lets you add new test functions::

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension
    {
        public function getTests()
        {
            return [
                new \Twig\TwigTest('even', 'twig_test_even'),
            ];
        }

        // ...
    }

Definition vs Runtime
~~~~~~~~~~~~~~~~~~~~~

Twig filters, functions, and tests runtime implementations can be defined as
any valid PHP callable:

* **functions/static methods**: Simple to implement and fast (used by all Twig
  core extensions); but it is hard for the runtime to depend on external
  objects;

* **closures**: Simple to implement;

* **object methods**: More flexible and required if your runtime code depends
  on external objects.

The simplest way to use methods is to define them on the extension itself::

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension
    {
        private $rot13Provider;

        public function __construct($rot13Provider)
        {
            $this->rot13Provider = $rot13Provider;
        }

        public function getFunctions()
        {
            return [
                new \Twig\TwigFunction('rot13', [$this, 'rot13']),
            ];
        }

        public function rot13($value)
        {
            return $this->rot13Provider->rot13($value);
        }
    }

This is very convenient but not recommended as it makes template compilation
depend on runtime dependencies even if they are not needed (think for instance
as a dependency that connects to a database engine).

You can easily decouple the extension definitions from their runtime
implementations by registering a ``\Twig\RuntimeLoader\RuntimeLoaderInterface`` instance on
the environment that knows how to instantiate such runtime classes (runtime
classes must be autoload-able)::

    class RuntimeLoader implements \Twig\RuntimeLoader\RuntimeLoaderInterface
    {
        public function load($class)
        {
            // implement the logic to create an instance of $class
            // and inject its dependencies
            // most of the time, it means using your dependency injection container
            if ('Project_Twig_RuntimeExtension' === $class) {
                return new $class(new Rot13Provider());
            } else {
                // ...
            }
        }
    }

    $twig->addRuntimeLoader(new RuntimeLoader());

.. note::

    Twig comes with a PSR-11 compatible runtime loader
    (``\Twig\RuntimeLoader\ContainerRuntimeLoader``).

It is now possible to move the runtime logic to a new
``Project_Twig_RuntimeExtension`` class and use it directly in the extension::

    class Project_Twig_RuntimeExtension
    {
        private $rot13Provider;

        public function __construct($rot13Provider)
        {
            $this->rot13Provider = $rot13Provider;
        }

        public function rot13($value)
        {
            return $this->rot13Provider->rot13($value);
        }
    }

    class Project_Twig_Extension extends \Twig\Extension\AbstractExtension
    {
        public function getFunctions()
        {
            return [
                new \Twig\TwigFunction('rot13', ['Project_Twig_RuntimeExtension', 'rot13']),
                // or
                new \Twig\TwigFunction('rot13', 'Project_Twig_RuntimeExtension::rot13'),
            ];
        }
    }

Overloading
-----------

To overload an already defined filter, test, operator, global variable, or
function, re-define it in an extension and register it **as late as
possible** (order matters)::

    class MyCoreExtension extends \Twig\Extension\AbstractExtension
    {
        public function getFilters()
        {
            return [
                new \Twig\TwigFilter('date', [$this, 'dateFilter']),
            ];
        }

        public function dateFilter($timestamp, $format = 'F j, Y H:i')
        {
            // do something different from the built-in date filter
        }
    }

    $twig = new \Twig\Environment($loader);
    $twig->addExtension(new MyCoreExtension());

Here, we have overloaded the built-in ``date`` filter with a custom one.

If you do the same on the ``\Twig\Environment`` itself, beware that it takes
precedence over any other registered extensions::

    $twig = new \Twig\Environment($loader);
    $twig->addFilter(new \Twig\TwigFilter('date', function ($timestamp, $format = 'F j, Y H:i') {
        // do something different from the built-in date filter
    }));
    // the date filter will come from the above registration, not
    // from the registered extension below
    $twig->addExtension(new MyCoreExtension());

.. caution::

    Note that overloading the built-in Twig elements is not recommended as it
    might be confusing.

Testing an Extension
--------------------

Functional Tests
~~~~~~~~~~~~~~~~

You can create functional tests for extensions by creating the following file
structure in your test directory::

    Fixtures/
        filters/
            foo.test
            bar.test
        functions/
            foo.test
            bar.test
        tags/
            foo.test
            bar.test
    IntegrationTest.php

The ``IntegrationTest.php`` file should look like this::

    class Project_Tests_IntegrationTest extends \Twig\Test\IntegrationTestCase
    {
        public function getExtensions()
        {
            return [
                new Project_Twig_Extension1(),
                new Project_Twig_Extension2(),
            ];
        }

        public function getFixturesDir()
        {
            return dirname(__FILE__).'/Fixtures/';
        }
    }

Fixtures examples can be found within the Twig repository
`tests/Twig/Fixtures`_ directory.

Node Tests
~~~~~~~~~~

Testing the node visitors can be complex, so extend your test cases from
``\Twig\Test\NodeTestCase``. Examples can be found in the Twig repository
`tests/Twig/Node`_ directory.

.. _`rot13`:               https://secure.php.net/manual/en/function.str-rot13.php
.. _`tests/Twig/Fixtures`: https://github.com/twigphp/Twig/tree/2.x/test/Twig/Tests/Fixtures
.. _`tests/Twig/Node`:     https://github.com/twigphp/Twig/tree/2.x/test/Twig/Tests/Node
