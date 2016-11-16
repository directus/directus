# Custom Views

The Slim Framework provides a default view class that uses PHP template files. This folder includes custom view classes
that you may use with third-party template libraries, such as [Twig](http://www.twig-project.org/),
[Smarty](http://www.smarty.net/), or [Mustache](http://mustache.github.com/).

## Twig

The `\Slim\Extras\Views\Twig` custom view class provides support for the [Twig](http://twig.sensiolabs.org/) template
library. You can use the Twig custom view in your Slim Framework application like this:

	<?php
	$app = new \Slim\Slim(array(
		'view' => new \Slim\Extras\Views\Twig()
	));

If you are not using Composer to autoload project dependencies, you must also set the Twig view's public static
`$twigDirectory` property; this is the relative or absolute path to the directory that conatins the Twig library.

### Twig configuration

There are several public static properties you can use to customize the Twig library behavior.

####$twigOptions

An array of options to pass to the underlying Twig environment ([Twig docs](http://twig.sensiolabs.org/doc/api.html#environment-options)):

	\Slim\Extras\Views\Twig::$twigOptions = array(
		'debug' => true
	);


####$twigExtensions

An array contianing Twig extensions to load ([Twig docs](http://twig.sensiolabs.org/doc/advanced.html)):

	\Slim\Extras\Views\Twig::$twigExtensions = array(
		new MyCustomExtension(),
		new ThirdPartyExtension()
	);


####$twigTemplateDirs

An array of paths to directories containing Twig templates ([Twig docs](http://twig.sensiolabs.org/doc/api.html#twig-loader-filesystem)):

	\Slim\Extras\Views\Twig::$twigTemplateDirs = array(
		realpath(PROJECT_DIR . '/templates'),
		realpath(PROJECT_DIR . '/some/other/templates')
	);

## Mustache

The `\Slim\Extras\Views\Mustache` custom view class provides support for the
[Mustache template language](http://mustache.github.com/) and the [Mustache.php library](github.com/bobthecow/mustache.php).
You can use the Mustache custom view in your Slim Framework application like this:

	<?php
	\Slim\Extras\Views\Mustache::$mustacheDirectory = 'path/to/mustacheDirectory/';
	$app = new \Slim\Slim(array(
		'view' => new \Slim\Extras\Views\Mustache()
	));

Before you can use the Mustache view class, you must set its static public `$mustacheDirectory` property; this is the
relative or absolute path to the Mustache library.

## SmartyView

The `\Slim\Extras\Views\Smarty` custom view class provides support for the [Smarty](http://www.smarty.net/) template
library. You can use the Smarty custom view in your Slim Framework application like this:

	<?php
	$app = new \Slim\Slim(array(
		'view' => new \Slim\Extras\Views\Smarty()
	));

You must configure the Smarty view's public static `$smartyDirectory`, `$smartyCompileDirectory` , `$smartyCacheDirectory`
and optionally `$smartyTemplatesDirectory` properties before using the Smarty view class in your application. These
properties are at the top of the `Views/Smarty.php` class definition.

## Blitz

The `\Slim\Extras\Views\Blitz` custom view class provides support for the Blitz templating system. Blitz is written
as C and is compiled to a PHP extension. This means it is FAST. You can learn more about Blitz at
<http://alexeyrybak.com/blitz/blitz_en.html>. You can use the Blitz custom view in your Slim Framework application like this:

	<?php
	$app = new \Slim\Slim(array(
		'view' => new \Slim\Extras\Views\Blitz()
	));

## HaangaView

The `\Slim\Extras\Views\Haanga` custom view class provides support for the Haanga templating system. Refer to
the `Views/Haanga.php` file for further documentation.

    <?php
	$app = new \Slim\Slim(array(
        'view' => new \Slim\Extras\Views\Haanga(
        	'/path/to/Haanga/dir',
        	'/path/to/templates/dir',
        	'/path/to/compiled/dir'
        )
    ));

## H2o

The `H2o` custom view class provides support for the [H2o templating system](http://www.h2o-template.org). You can
use the H2o custom view in your Slim Framework application like this:

    <?php
	\Slim\Extras\Views\H2o::$h2o_directory = './h2o/';
	$app = new \Slim\Slim(array(
		'view' => new \Slim\Extras\Views\H2oView()
	));

Refer to the `Views/H2o.php` file for further documentation.

