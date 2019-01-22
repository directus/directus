Recipes
=======

.. _deprecation-notices:

Displaying Deprecation Notices
------------------------------

Deprecated features generate deprecation notices (via a call to the
``trigger_error()`` PHP function). By default, they are silenced and never
displayed nor logged.

To easily remove all deprecated feature usages from your templates, write and
run a script along the lines of the following::

    require_once __DIR__.'/vendor/autoload.php';

    $twig = create_your_twig_env();

    $deprecations = new Twig_Util_DeprecationCollector($twig);

    print_r($deprecations->collectDir(__DIR__.'/templates'));

The ``collectDir()`` method compiles all templates found in a directory,
catches deprecation notices, and return them.

.. tip::

    If your templates are not stored on the filesystem, use the ``collect()``
    method instead. ``collect()`` takes a ``Traversable`` which must return
    template names as keys and template contents as values (as done by
    ``Twig_Util_TemplateDirIterator``).

However, this code won't find all deprecations (like using deprecated some Twig
classes). To catch all notices, register a custom error handler like the one
below::

    $deprecations = [];
    set_error_handler(function ($type, $msg) use (&$deprecations) {
        if (E_USER_DEPRECATED === $type) {
            $deprecations[] = $msg;
        }
    });

    // run your application

    print_r($deprecations);

Note that most deprecation notices are triggered during **compilation**, so
they won't be generated when templates are already cached.

.. tip::

    If you want to manage the deprecation notices from your PHPUnit tests, have
    a look at the `symfony/phpunit-bridge
    <https://github.com/symfony/phpunit-bridge>`_ package, which eases the
    process a lot.

Making a Layout conditional
---------------------------

Working with Ajax means that the same content is sometimes displayed as is,
and sometimes decorated with a layout. As Twig layout template names can be
any valid expression, you can pass a variable that evaluates to ``true`` when
the request is made via Ajax and choose the layout accordingly:

.. code-block:: jinja

    {% extends request.ajax ? "base_ajax.html" : "base.html" %}

    {% block content %}
        This is the content to be displayed.
    {% endblock %}

Making an Include dynamic
-------------------------

When including a template, its name does not need to be a string. For
instance, the name can depend on the value of a variable:

.. code-block:: jinja

    {% include var ~ '_foo.html' %}

If ``var`` evaluates to ``index``, the ``index_foo.html`` template will be
rendered.

As a matter of fact, the template name can be any valid expression, such as
the following:

.. code-block:: jinja

    {% include var|default('index') ~ '_foo.html' %}

Overriding a Template that also extends itself
----------------------------------------------

A template can be customized in two different ways:

* *Inheritance*: A template *extends* a parent template and overrides some
  blocks;

* *Replacement*: If you use the filesystem loader, Twig loads the first
  template it finds in a list of configured directories; a template found in a
  directory *replaces* another one from a directory further in the list.

But how do you combine both: *replace* a template that also extends itself
(aka a template in a directory further in the list)?

Let's say that your templates are loaded from both ``.../templates/mysite``
and ``.../templates/default`` in this order. The ``page.twig`` template,
stored in ``.../templates/default`` reads as follows:

.. code-block:: jinja

    {# page.twig #}
    {% extends "layout.twig" %}

    {% block content %}
    {% endblock %}

You can replace this template by putting a file with the same name in
``.../templates/mysite``. And if you want to extend the original template, you
might be tempted to write the following:

.. code-block:: jinja

    {# page.twig in .../templates/mysite #}
    {% extends "page.twig" %} {# from .../templates/default #}

Of course, this will not work as Twig will always load the template from
``.../templates/mysite``.

It turns out it is possible to get this to work, by adding a directory right
at the end of your template directories, which is the parent of all of the
other directories: ``.../templates`` in our case. This has the effect of
making every template file within our system uniquely addressable. Most of the
time you will use the "normal" paths, but in the special case of wanting to
extend a template with an overriding version of itself we can reference its
parent's full, unambiguous template path in the extends tag:

.. code-block:: jinja

    {# page.twig in .../templates/mysite #}
    {% extends "default/page.twig" %} {# from .../templates #}

.. note::

    This recipe was inspired by the following Django wiki page:
    https://code.djangoproject.com/wiki/ExtendingTemplates

Customizing the Syntax
----------------------

Twig allows some syntax customization for the block delimiters. It's not
recommended to use this feature as templates will be tied with your custom
syntax. But for specific projects, it can make sense to change the defaults.

To change the block delimiters, you need to create your own lexer object::

    $twig = new Twig_Environment(...);

    $lexer = new Twig_Lexer($twig, [
        'tag_comment'   => ['{#', '#}'],
        'tag_block'     => ['{%', '%}'],
        'tag_variable'  => ['{{', '}}'],
        'interpolation' => ['#{', '}'],
    ]);
    $twig->setLexer($lexer);

Here are some configuration example that simulates some other template engines
syntax::

    // Ruby erb syntax
    $lexer = new Twig_Lexer($twig, [
        'tag_comment'  => ['<%#', '%>'],
        'tag_block'    => ['<%', '%>'],
        'tag_variable' => ['<%=', '%>'],
    ]);

    // SGML Comment Syntax
    $lexer = new Twig_Lexer($twig, [
        'tag_comment'  => ['<!--#', '-->'],
        'tag_block'    => ['<!--', '-->'],
        'tag_variable' => ['${', '}'],
    ]);

    // Smarty like
    $lexer = new Twig_Lexer($twig, [
        'tag_comment'  => ['{*', '*}'],
        'tag_block'    => ['{', '}'],
        'tag_variable' => ['{$', '}'],
    ]);

Using dynamic Object Properties
-------------------------------

When Twig encounters a variable like ``article.title``, it tries to find a
``title`` public property in the ``article`` object.

It also works if the property does not exist but is rather defined dynamically
thanks to the magic ``__get()`` method; you just need to also implement the
``__isset()`` magic method like shown in the following snippet of code::

    class Article
    {
        public function __get($name)
        {
            if ('title' == $name) {
                return 'The title';
            }

            // throw some kind of error
        }

        public function __isset($name)
        {
            if ('title' == $name) {
                return true;
            }

            return false;
        }
    }

Accessing the parent Context in Nested Loops
--------------------------------------------

Sometimes, when using nested loops, you need to access the parent context. The
parent context is always accessible via the ``loop.parent`` variable. For
instance, if you have the following template data::

    $data = [
        'topics' => [
            'topic1' => ['Message 1 of topic 1', 'Message 2 of topic 1'],
            'topic2' => ['Message 1 of topic 2', 'Message 2 of topic 2'],
        ],
    ];

And the following template to display all messages in all topics:

.. code-block:: jinja

    {% for topic, messages in topics %}
        * {{ loop.index }}: {{ topic }}
      {% for message in messages %}
          - {{ loop.parent.loop.index }}.{{ loop.index }}: {{ message }}
      {% endfor %}
    {% endfor %}

The output will be similar to:

.. code-block:: text

    * 1: topic1
      - 1.1: The message 1 of topic 1
      - 1.2: The message 2 of topic 1
    * 2: topic2
      - 2.1: The message 1 of topic 2
      - 2.2: The message 2 of topic 2

In the inner loop, the ``loop.parent`` variable is used to access the outer
context. So, the index of the current ``topic`` defined in the outer for loop
is accessible via the ``loop.parent.loop.index`` variable.

Defining undefined Functions and Filters on the Fly
---------------------------------------------------

When a function (or a filter) is not defined, Twig defaults to throw a
``Twig_Error_Syntax`` exception. However, it can also call a `callback`_ (any
valid PHP callable) which should return a function (or a filter).

For filters, register callbacks with ``registerUndefinedFilterCallback()``.
For functions, use ``registerUndefinedFunctionCallback()``::

    // auto-register all native PHP functions as Twig functions
    // don't try this at home as it's not secure at all!
    $twig->registerUndefinedFunctionCallback(function ($name) {
        if (function_exists($name)) {
            return new Twig_Function($name, $name);
        }

        return false;
    });

If the callable is not able to return a valid function (or filter), it must
return ``false``.

If you register more than one callback, Twig will call them in turn until one
does not return ``false``.

.. tip::

    As the resolution of functions and filters is done during compilation,
    there is no overhead when registering these callbacks.

Validating the Template Syntax
------------------------------

When template code is provided by a third-party (through a web interface for
instance), it might be interesting to validate the template syntax before
saving it. If the template code is stored in a `$template` variable, here is
how you can do it::

    try {
        $twig->parse($twig->tokenize(new Twig_Source($template)));

        // the $template is valid
    } catch (Twig_Error_Syntax $e) {
        // $template contains one or more syntax errors
    }

If you iterate over a set of files, you can pass the filename to the
``tokenize()`` method to get the filename in the exception message::

    foreach ($files as $file) {
        try {
            $twig->parse($twig->tokenize(new Twig_Source($template, $file->getFilename(), $file)));

            // the $template is valid
        } catch (Twig_Error_Syntax $e) {
            // $template contains one or more syntax errors
        }
    }

.. note::

    This method won't catch any sandbox policy violations because the policy
    is enforced during template rendering (as Twig needs the context for some
    checks like allowed methods on objects).

Refreshing modified Templates when OPcache or APC is enabled
------------------------------------------------------------

When using OPcache with ``opcache.validate_timestamps`` set to ``0`` or APC
with ``apc.stat`` set to ``0`` and Twig cache enabled, clearing the template
cache won't update the cache.

To get around this, force Twig to invalidate the bytecode cache::

    $twig = new Twig_Environment($loader, [
        'cache' => new Twig_Cache_Filesystem('/some/cache/path', Twig_Cache_Filesystem::FORCE_BYTECODE_INVALIDATION),
        // ...
    ]);

Reusing a stateful Node Visitor
-------------------------------

When attaching a visitor to a ``Twig_Environment`` instance, Twig uses it to
visit *all* templates it compiles. If you need to keep some state information
around, you probably want to reset it when visiting a new template.

This can be easily achieved with the following code::

    protected $someTemplateState = [];

    public function enterNode(Twig_Node $node, Twig_Environment $env)
    {
        if ($node instanceof Twig_Node_Module) {
            // reset the state as we are entering a new template
            $this->someTemplateState = [];
        }

        // ...

        return $node;
    }

Using a Database to store Templates
-----------------------------------

If you are developing a CMS, templates are usually stored in a database. This
recipe gives you a simple PDO template loader you can use as a starting point
for your own.

First, let's create a temporary in-memory SQLite3 database to work with::

    $dbh = new PDO('sqlite::memory:');
    $dbh->exec('CREATE TABLE templates (name STRING, source STRING, last_modified INTEGER)');
    $base = '{% block content %}{% endblock %}';
    $index = '
    {% extends "base.twig" %}
    {% block content %}Hello {{ name }}{% endblock %}
    ';
    $now = time();
    $dbh->exec("INSERT INTO templates (name, source, last_modified) VALUES ('base.twig', '$base', $now)");
    $dbh->exec("INSERT INTO templates (name, source, last_modified) VALUES ('index.twig', '$index', $now)");

We have created a simple ``templates`` table that hosts two templates:
``base.twig`` and ``index.twig``.

Now, let's define a loader able to use this database::

    class DatabaseTwigLoader implements Twig_LoaderInterface
    {
        protected $dbh;

        public function __construct(PDO $dbh)
        {
            $this->dbh = $dbh;
        }

        public function getSourceContext($name)
        {
            if (false === $source = $this->getValue('source', $name)) {
                throw new Twig_Error_Loader(sprintf('Template "%s" does not exist.', $name));
            }

            return new Twig_Source($source, $name);
        }

        public function exists($name)
        {
            return $name === $this->getValue('name', $name);
        }

        public function getCacheKey($name)
        {
            return $name;
        }

        public function isFresh($name, $time)
        {
            if (false === $lastModified = $this->getValue('last_modified', $name)) {
                return false;
            }

            return $lastModified <= $time;
        }

        protected function getValue($column, $name)
        {
            $sth = $this->dbh->prepare('SELECT '.$column.' FROM templates WHERE name = :name');
            $sth->execute([':name' => (string) $name]);

            return $sth->fetchColumn();
        }
    }

Finally, here is an example on how you can use it::

    $loader = new DatabaseTwigLoader($dbh);
    $twig = new Twig_Environment($loader);

    echo $twig->render('index.twig', ['name' => 'Fabien']);

Using different Template Sources
--------------------------------

This recipe is the continuation of the previous one. Even if you store the
contributed templates in a database, you might want to keep the original/base
templates on the filesystem. When templates can be loaded from different
sources, you need to use the ``Twig_Loader_Chain`` loader.

As you can see in the previous recipe, we reference the template in the exact
same way as we would have done it with a regular filesystem loader. This is
the key to be able to mix and match templates coming from the database, the
filesystem, or any other loader for that matter: the template name should be a
logical name, and not the path from the filesystem::

    $loader1 = new DatabaseTwigLoader($dbh);
    $loader2 = new Twig_Loader_Array([
        'base.twig' => '{% block content %}{% endblock %}',
    ]);
    $loader = new Twig_Loader_Chain([$loader1, $loader2]);

    $twig = new Twig_Environment($loader);

    echo $twig->render('index.twig', ['name' => 'Fabien']);

Now that the ``base.twig`` templates is defined in an array loader, you can
remove it from the database, and everything else will still work as before.

Loading a Template from a String
--------------------------------

From a template, you can easily load a template stored in a string via the
``template_from_string`` function (via the ``Twig_Extension_StringLoader``
extension):

.. code-block:: jinja

    {{ include(template_from_string("Hello {{ name }}")) }}

From PHP, it's also possible to load a template stored in a string via
``Twig_Environment::createTemplate()``::

    $template = $twig->createTemplate('hello {{ name }}');
    echo $template->render(['name' => 'Fabien']);

Using Twig and AngularJS in the same Templates
----------------------------------------------

Mixing different template syntaxes in the same file is not a recommended
practice as both AngularJS and Twig use the same delimiters in their syntax:
``{{`` and ``}}``.

Still, if you want to use AngularJS and Twig in the same template, there are
two ways to make it work depending on the amount of AngularJS you need to
include in your templates:

* Escaping the AngularJS delimiters by wrapping AngularJS sections with the
  ``{% verbatim %}`` tag or by escaping each delimiter via ``{{ '{{' }}`` and
  ``{{ '}}' }}``;

* Changing the delimiters of one of the template engines (depending on which
  engine you introduced last):

  * For AngularJS, change the interpolation tags using the
    ``interpolateProvider`` service, for instance at the module initialization
    time:

    ..  code-block:: javascript

        angular.module('myApp', []).config(function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[').endSymbol(']}');
        });

  * For Twig, change the delimiters via the ``tag_variable`` Lexer option:

    ..  code-block:: php

        $env->setLexer(new Twig_Lexer($env, [
            'tag_variable' => ['{[', ']}'],
        ]));

.. _callback: https://secure.php.net/manual/en/function.is-callable.php
