Extending Twig
==============

.. caution::

    This section describes how to extends Twig for versions **older than
    1.12**. If you are using a newer version, read the :doc:`newer<advanced>`
    chapter instead.

Twig can be extended in many ways; you can add extra tags, filters, tests,
operators, global variables, and functions. You can even extend the parser
itself with node visitors.

.. note::

    The first section of this chapter describes how to extend Twig easily. If
    you want to reuse your changes in different projects or if you want to
    share them with others, you should then create an extension as described
    in the following section.

.. caution::

    When extending Twig by calling methods on the Twig environment instance,
    Twig won't be able to recompile your templates when the PHP code is
    updated. To see your changes in real-time, either disable template caching
    or package your code into an extension (see the next section of this
    chapter).

Before extending Twig, you must understand the differences between all the
different possible extension points and when to use them.

First, remember that Twig has two main language constructs:

* ``{{ }}``: used to print the result of an expression evaluation;

* ``{% %}``: used to execute statements.

To understand why Twig exposes so many extension points, let's see how to
implement a *Lorem ipsum* generator (it needs to know the number of words to
generate).

You can use a ``lipsum`` *tag*:

.. code-block:: jinja

    {% lipsum 40 %}

That works, but using a tag for ``lipsum`` is not a good idea for at least
three main reasons:

* ``lipsum`` is not a language construct;
* The tag outputs something;
* The tag is not flexible as you cannot use it in an expression:

  .. code-block:: jinja

      {{ 'some text' ~ {% lipsum 40 %} ~ 'some more text' }}

In fact, you rarely need to create tags; and that's good news because tags are
the most complex extension point of Twig.

Now, let's use a ``lipsum`` *filter*:

.. code-block:: jinja

    {{ 40|lipsum }}

Again, it works, but it looks weird. A filter transforms the passed value to
something else but here we use the value to indicate the number of words to
generate (so, ``40`` is an argument of the filter, not the value we want to
transform).

Next, let's use a ``lipsum`` *function*:

.. code-block:: jinja

    {{ lipsum(40) }}

Here we go. For this specific example, the creation of a function is the
extension point to use. And you can use it anywhere an expression is accepted:

.. code-block:: jinja

    {{ 'some text' ~ ipsum(40) ~ 'some more text' }}

    {% set ipsum = ipsum(40) %}

Last but not the least, you can also use a *global* object with a method able
to generate lorem ipsum text:

.. code-block:: jinja

    {{ text.lipsum(40) }}

As a rule of thumb, use functions for frequently used features and global
objects for everything else.

Keep in mind the following when you want to extend Twig:

========== ========================== ========== =========================
What?      Implementation difficulty? How often? When?
========== ========================== ========== =========================
*macro*    trivial                    frequent   Content generation
*global*   trivial                    frequent   Helper object
*function* trivial                    frequent   Content generation
*filter*   trivial                    frequent   Value transformation
*tag*      complex                    rare       DSL language construct
*test*     trivial                    rare       Boolean decision
*operator* trivial                    rare       Values transformation
========== ========================== ========== =========================

Globals
-------

A global variable is like any other template variable, except that it's
available in all templates and macros::

    $twig = new Twig_Environment($loader);
    $twig->addGlobal('text', new Text());

You can then use the ``text`` variable anywhere in a template:

.. code-block:: jinja

    {{ text.lipsum(40) }}

Filters
-------

A filter is a regular PHP function or an object method that takes the left
side of the filter (before the pipe ``|``) as first argument and the extra
arguments passed to the filter (within parentheses ``()``) as extra arguments.

Defining a filter is as easy as associating the filter name with a PHP
callable. For instance, let's say you have the following code in a template:

.. code-block:: jinja

    {{ 'TWIG'|lower }}

When compiling this template to PHP, Twig looks for the PHP callable
associated with the ``lower`` filter. The ``lower`` filter is a built-in Twig
filter, and it is simply mapped to the PHP ``strtolower()`` function. After
compilation, the generated PHP code is roughly equivalent to:

.. code-block:: html+php

    <?php echo strtolower('TWIG') ?>

As you can see, the ``'TWIG'`` string is passed as a first argument to the PHP
function.

A filter can also take extra arguments like in the following example:

.. code-block:: jinja

    {{ now|date('d/m/Y') }}

In this case, the extra arguments are passed to the function after the main
argument, and the compiled code is equivalent to:

.. code-block:: html+php

    <?php echo twig_date_format_filter($now, 'd/m/Y') ?>

Let's see how to create a new filter.

In this section, we will create a ``rot13`` filter, which should return the
`rot13`_ transformation of a string. Here is an example of its usage and the
expected output:

.. code-block:: jinja

    {{ "Twig"|rot13 }}

    {# should displays Gjvt #}

Adding a filter is as simple as calling the ``addFilter()`` method on the
``Twig_Environment`` instance::

    $twig = new Twig_Environment($loader);
    $twig->addFilter('rot13', new Twig_Filter_Function('str_rot13'));

The second argument of ``addFilter()`` is an instance of ``Twig_Filter``.
Here, we use ``Twig_Filter_Function`` as the filter is a PHP function. The
first argument passed to the ``Twig_Filter_Function`` constructor is the name
of the PHP function to call, here ``str_rot13``, a native PHP function.

Let's say I now want to be able to add a prefix before the converted string:

.. code-block:: jinja

    {{ "Twig"|rot13('prefix_') }}

    {# should displays prefix_Gjvt #}

As the PHP ``str_rot13()`` function does not support this requirement, let's
create a new PHP function::

    function project_compute_rot13($string, $prefix = '')
    {
        return $prefix.str_rot13($string);
    }

As you can see, the ``prefix`` argument of the filter is passed as an extra
argument to the ``project_compute_rot13()`` function.

Adding this filter is as easy as before::

    $twig->addFilter('rot13', new Twig_Filter_Function('project_compute_rot13'));

For better encapsulation, a filter can also be defined as a static method of a
class. The ``Twig_Filter_Function`` class can also be used to register such
static methods as filters::

    $twig->addFilter('rot13', new Twig_Filter_Function('SomeClass::rot13Filter'));

.. tip::

    In an extension, you can also define a filter as a static method of the
    extension class.

Environment aware Filters
~~~~~~~~~~~~~~~~~~~~~~~~~

The ``Twig_Filter`` classes take options as their last argument. For instance,
if you want access to the current environment instance in your filter, set the
``needs_environment`` option to ``true``::

    $filter = new Twig_Filter_Function('str_rot13', array('needs_environment' => true));

Twig will then pass the current environment as the first argument to the
filter call::

    function twig_compute_rot13(Twig_Environment $env, $string)
    {
        // get the current charset for instance
        $charset = $env->getCharset();

        return str_rot13($string);
    }

Automatic Escaping
~~~~~~~~~~~~~~~~~~

If automatic escaping is enabled, the output of the filter may be escaped
before printing. If your filter acts as an escaper (or explicitly outputs HTML
or JavaScript code), you will want the raw output to be printed. In such a
case, set the ``is_safe`` option::

    $filter = new Twig_Filter_Function('nl2br', array('is_safe' => array('html')));

Some filters may need to work on input that is already escaped or safe, for
example when adding (safe) HTML tags to originally unsafe output. In such a
case, set the ``pre_escape`` option to escape the input data before it is run
through your filter::

    $filter = new Twig_Filter_Function('somefilter', array('pre_escape' => 'html', 'is_safe' => array('html')));

Dynamic Filters
~~~~~~~~~~~~~~~

.. versionadded:: 1.5
    Dynamic filters support was added in Twig 1.5.

A filter name containing the special ``*`` character is a dynamic filter as
the ``*`` can be any string::

    $twig->addFilter('*_path_*', new Twig_Filter_Function('twig_path'));

    function twig_path($name, $arguments)
    {
        // ...
    }

The following filters will be matched by the above defined dynamic filter:

* ``product_path``
* ``category_path``

A dynamic filter can define more than one dynamic parts::

    $twig->addFilter('*_path_*', new Twig_Filter_Function('twig_path'));

    function twig_path($name, $suffix, $arguments)
    {
        // ...
    }

The filter will receive all dynamic part values before the normal filters
arguments. For instance, a call to ``'foo'|a_path_b()`` will result in the
following PHP call: ``twig_path('a', 'b', 'foo')``.

Functions
---------

A function is a regular PHP function or an object method that can be called from
templates.

.. code-block:: jinja

    {{ constant("DATE_W3C") }}

When compiling this template to PHP, Twig looks for the PHP callable
associated with the ``constant`` function. The ``constant`` function is a built-in Twig
function, and it is simply mapped to the PHP ``constant()`` function. After
compilation, the generated PHP code is roughly equivalent to:

.. code-block:: html+php

    <?php echo constant('DATE_W3C') ?>

Adding a function is similar to adding a filter. This can be done by calling the
``addFunction()`` method on the ``Twig_Environment`` instance::

    $twig = new Twig_Environment($loader);
    $twig->addFunction('functionName', new Twig_Function_Function('someFunction'));

You can also expose extension methods as functions in your templates::

    // $this is an object that implements Twig_ExtensionInterface.
    $twig = new Twig_Environment($loader);
    $twig->addFunction('otherFunction', new Twig_Function_Method($this, 'someMethod'));

Functions also support ``needs_environment`` and ``is_safe`` parameters.

Dynamic Functions
~~~~~~~~~~~~~~~~~

.. versionadded:: 1.5
    Dynamic functions support was added in Twig 1.5.

A function name containing the special ``*`` character is a dynamic function
as the ``*`` can be any string::

    $twig->addFunction('*_path', new Twig_Function_Function('twig_path'));

    function twig_path($name, $arguments)
    {
        // ...
    }

The following functions will be matched by the above defined dynamic function:

* ``product_path``
* ``category_path``

A dynamic function can define more than one dynamic parts::

    $twig->addFilter('*_path_*', new Twig_Filter_Function('twig_path'));

    function twig_path($name, $suffix, $arguments)
    {
        // ...
    }

The function will receive all dynamic part values before the normal functions
arguments. For instance, a call to ``a_path_b('foo')`` will result in the
following PHP call: ``twig_path('a', 'b', 'foo')``.

Tags
----

One of the most exciting feature of a template engine like Twig is the
possibility to define new language constructs. This is also the most complex
feature as you need to understand how Twig's internals work.

Let's create a simple ``set`` tag that allows the definition of simple
variables from within a template. The tag can be used like follows:

.. code-block:: jinja

    {% set name = "value" %}

    {{ name }}

    {# should output value #}

.. note::

    The ``set`` tag is part of the Core extension and as such is always
    available. The built-in version is slightly more powerful and supports
    multiple assignments by default (cf. the template designers chapter for
    more information).

Three steps are needed to define a new tag:

* Defining a Token Parser class (responsible for parsing the template code);

* Defining a Node class (responsible for converting the parsed code to PHP);

* Registering the tag.

Registering a new tag
~~~~~~~~~~~~~~~~~~~~~

Adding a tag is as simple as calling the ``addTokenParser`` method on the
``Twig_Environment`` instance::

    $twig = new Twig_Environment($loader);
    $twig->addTokenParser(new Project_Set_TokenParser());

Defining a Token Parser
~~~~~~~~~~~~~~~~~~~~~~~

Now, let's see the actual code of this class::

    class Project_Set_TokenParser extends Twig_TokenParser
    {
        public function parse(Twig_Token $token)
        {
            $lineno = $token->getLine();
            $name = $this->parser->getStream()->expect(Twig_Token::NAME_TYPE)->getValue();
            $this->parser->getStream()->expect(Twig_Token::OPERATOR_TYPE, '=');
            $value = $this->parser->getExpressionParser()->parseExpression();

            $this->parser->getStream()->expect(Twig_Token::BLOCK_END_TYPE);

            return new Project_Set_Node($name, $value, $lineno, $this->getTag());
        }

        public function getTag()
        {
            return 'set';
        }
    }

The ``getTag()`` method must return the tag we want to parse, here ``set``.

The ``parse()`` method is invoked whenever the parser encounters a ``set``
tag. It should return a ``Twig_Node`` instance that represents the node (the
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

* ``look()``: Looks a the next token without consuming it.

Parsing expressions is done by calling the ``parseExpression()`` like we did for
the ``set`` tag.

.. tip::

    Reading the existing ``TokenParser`` classes is the best way to learn all
    the nitty-gritty details of the parsing process.

Defining a Node
~~~~~~~~~~~~~~~

The ``Project_Set_Node`` class itself is rather simple::

    class Project_Set_Node extends Twig_Node
    {
        public function __construct($name, Twig_Node_Expression $value, $lineno, $tag = null)
        {
            parent::__construct(array('value' => $value), array('name' => $name), $lineno, $tag);
        }

        public function compile(Twig_Compiler $compiler)
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
  ``Twig_Node_For`` for a usage example).

* ``addDebugInfo()``: Adds the line of the original template file related to
  the current node as a comment.

* ``indent()``: Indents the generated code (see ``Twig_Node_Block`` for a
  usage example).

* ``outdent()``: Outdents the generated code (see ``Twig_Node_Block`` for a
  usage example).

.. _creating_extensions:

Creating an Extension
---------------------

The main motivation for writing an extension is to move often used code into a
reusable class like adding support for internationalization. An extension can
define tags, filters, tests, operators, global variables, functions, and node
visitors.

Creating an extension also makes for a better separation of code that is
executed at compilation time and code needed at runtime. As such, it makes
your code faster.

Most of the time, it is useful to create a single extension for your project,
to host all the specific tags and filters you want to add to Twig.

.. tip::

    When packaging your code into an extension, Twig is smart enough to
    recompile your templates whenever you make a change to it (when the
    ``auto_reload`` is enabled).

.. note::

    Before writing your own extensions, have a look at the Twig official
    extension repository: http://github.com/twigphp/Twig-extensions.

An extension is a class that implements the following interface::

    interface Twig_ExtensionInterface
    {
        /**
         * Initializes the runtime environment.
         *
         * This is where you can load some file that contains filter functions for instance.
         *
         * @param Twig_Environment $environment The current Twig_Environment instance
         */
        function initRuntime(Twig_Environment $environment);

        /**
         * Returns the token parser instances to add to the existing list.
         *
         * @return array An array of Twig_TokenParserInterface or Twig_TokenParserBrokerInterface instances
         */
        function getTokenParsers();

        /**
         * Returns the node visitor instances to add to the existing list.
         *
         * @return array An array of Twig_NodeVisitorInterface instances
         */
        function getNodeVisitors();

        /**
         * Returns a list of filters to add to the existing list.
         *
         * @return array An array of filters
         */
        function getFilters();

        /**
         * Returns a list of tests to add to the existing list.
         *
         * @return array An array of tests
         */
        function getTests();

        /**
         * Returns a list of functions to add to the existing list.
         *
         * @return array An array of functions
         */
        function getFunctions();

        /**
         * Returns a list of operators to add to the existing list.
         *
         * @return array An array of operators
         */
        function getOperators();

        /**
         * Returns a list of global variables to add to the existing list.
         *
         * @return array An array of global variables
         */
        function getGlobals();

        /**
         * Returns the name of the extension.
         *
         * @return string The extension name
         */
        function getName();
    }

To keep your extension class clean and lean, it can inherit from the built-in
``Twig_Extension`` class instead of implementing the whole interface. That
way, you just need to implement the ``getName()`` method as the
``Twig_Extension`` provides empty implementations for all other methods.

The ``getName()`` method must return a unique identifier for your extension.

Now, with this information in mind, let's create the most basic extension
possible::

    class Project_Twig_Extension extends Twig_Extension
    {
        public function getName()
        {
            return 'project';
        }
    }

.. note::

    Of course, this extension does nothing for now. We will customize it in
    the next sections.

Twig does not care where you save your extension on the filesystem, as all
extensions must be registered explicitly to be available in your templates.

You can register an extension by using the ``addExtension()`` method on your
main ``Environment`` object::

    $twig = new Twig_Environment($loader);
    $twig->addExtension(new Project_Twig_Extension());

Of course, you need to first load the extension file by either using
``require_once()`` or by using an autoloader (see `spl_autoload_register()`_).

.. tip::

    The bundled extensions are great examples of how extensions work.

Globals
~~~~~~~

Global variables can be registered in an extension via the ``getGlobals()``
method::

    class Project_Twig_Extension extends Twig_Extension
    {
        public function getGlobals()
        {
            return array(
                'text' => new Text(),
            );
        }

        // ...
    }

Functions
~~~~~~~~~

Functions can be registered in an extension via the ``getFunctions()``
method::

    class Project_Twig_Extension extends Twig_Extension
    {
        public function getFunctions()
        {
            return array(
                'lipsum' => new Twig_Function_Function('generate_lipsum'),
            );
        }

        // ...
    }

Filters
~~~~~~~

To add a filter to an extension, you need to override the ``getFilters()``
method. This method must return an array of filters to add to the Twig
environment::

    class Project_Twig_Extension extends Twig_Extension
    {
        public function getFilters()
        {
            return array(
                'rot13' => new Twig_Filter_Function('str_rot13'),
            );
        }

        // ...
    }

As you can see in the above code, the ``getFilters()`` method returns an array
where keys are the name of the filters (``rot13``) and the values the
definition of the filter (``new Twig_Filter_Function('str_rot13')``).

As seen in the previous chapter, you can also define filters as static methods
on the extension class::

$twig->addFilter('rot13', new Twig_Filter_Function('Project_Twig_Extension::rot13Filter'));

You can also use ``Twig_Filter_Method`` instead of ``Twig_Filter_Function``
when defining a filter to use a method::

    class Project_Twig_Extension extends Twig_Extension
    {
        public function getFilters()
        {
            return array(
                'rot13' => new Twig_Filter_Method($this, 'rot13Filter'),
            );
        }

        public function rot13Filter($string)
        {
            return str_rot13($string);
        }

        // ...
    }

The first argument of the ``Twig_Filter_Method`` constructor is always
``$this``, the current extension object. The second one is the name of the
method to call.

Using methods for filters is a great way to package your filter without
polluting the global namespace. This also gives the developer more flexibility
at the cost of a small overhead.

Overriding default Filters
..........................

If some default core filters do not suit your needs, you can easily override
them by creating your own extension. Just use the same names as the one you
want to override::

    class MyCoreExtension extends Twig_Extension
    {
        public function getFilters()
        {
            return array(
                'date' => new Twig_Filter_Method($this, 'dateFilter'),
                // ...
            );
        }

        public function dateFilter($timestamp, $format = 'F j, Y H:i')
        {
            return '...'.twig_date_format_filter($timestamp, $format);
        }

        public function getName()
        {
            return 'project';
        }
    }

Here, we override the ``date`` filter with a custom one. Using this extension
is as simple as registering the ``MyCoreExtension`` extension by calling the
``addExtension()`` method on the environment instance::

    $twig = new Twig_Environment($loader);
    $twig->addExtension(new MyCoreExtension());

Tags
~~~~

Adding a tag in an extension can be done by overriding the
``getTokenParsers()`` method. This method must return an array of tags to add
to the Twig environment::

    class Project_Twig_Extension extends Twig_Extension
    {
        public function getTokenParsers()
        {
            return array(new Project_Set_TokenParser());
        }

        // ...
    }

In the above code, we have added a single new tag, defined by the
``Project_Set_TokenParser`` class. The ``Project_Set_TokenParser`` class is
responsible for parsing the tag and compiling it to PHP.

Operators
~~~~~~~~~

The ``getOperators()`` methods allows to add new operators. Here is how to add
``!``, ``||``, and ``&&`` operators::

    class Project_Twig_Extension extends Twig_Extension
    {
        public function getOperators()
        {
            return array(
                array(
                    '!' => array('precedence' => 50, 'class' => 'Twig_Node_Expression_Unary_Not'),
                ),
                array(
                    '||' => array('precedence' => 10, 'class' => 'Twig_Node_Expression_Binary_Or', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT),
                    '&&' => array('precedence' => 15, 'class' => 'Twig_Node_Expression_Binary_And', 'associativity' => Twig_ExpressionParser::OPERATOR_LEFT),
                ),
            );
        }

        // ...
    }

Tests
~~~~~

The ``getTests()`` methods allows to add new test functions::

    class Project_Twig_Extension extends Twig_Extension
    {
        public function getTests()
        {
            return array(
                'even' => new Twig_Test_Function('twig_test_even'),
            );
        }

        // ...
    }

Testing an Extension
--------------------

.. versionadded:: 1.10
    Support for functional tests was added in Twig 1.10.

Functional Tests
~~~~~~~~~~~~~~~~

You can create functional tests for extensions simply by creating the
following file structure in your test directory::

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

    class Project_Tests_IntegrationTest extends Twig_Test_IntegrationTestCase
    {
        public function getExtensions()
        {
            return array(
                new Project_Twig_Extension1(),
                new Project_Twig_Extension2(),
            );
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
``Twig_Test_NodeTestCase``. Examples can be found in the Twig repository
`tests/Twig/Node`_ directory.

.. _`spl_autoload_register()`: http://www.php.net/spl_autoload_register
.. _`rot13`:                   http://www.php.net/manual/en/function.str-rot13.php
.. _`tests/Twig/Fixtures`:     https://github.com/twigphp/Twig/tree/master/test/Twig/Tests/Fixtures
.. _`tests/Twig/Node`:         https://github.com/twigphp/Twig/tree/master/test/Twig/Tests/Node
