# View Extensions
This is where you can define all you custom functions in the template parser method of choice, I have currently included
Twig and Smarty to allow Slim's urlFor() funtion in the template(view). You can add additional functions, filters, plugins to
the Extension directory under the template parser directory of choice.

## Twig
### How to use
To use this in Twig just include the code below at the top of your Slim index.php file after including TwigView.

	TwigView::$twigExtensions = array(
	    'Twig_Extensions_Slim',
	);

Inside your Twig template you would write:

	{{ urlFor('hello', {"name": "Josh", "age": "19"}) }}

You can easily pass variables that are objects or arrays by doing:

	<a href="{{ urlFor('hello', {"name": person.name, "age": person.age}) }}">Hello {{ name }}</a>

If you need to specify the appname for the getInstance method in the urlFor functions, set it as the third parameter of the function
in your template:

	<a href="{{ urlFor('hello', {"name": person.name, "age": person.age}, 'admin') }}">Hello {{ name }}</a>

The $twigExtensions take an array of extension class name which need to follow the naming convention starting with __Extension_Twig__,
this might seem like a overkill to add Slim's urlFor but it makes organising your project easier as your project becomes larger.

## Smarty
### How to use
To use this in Smarty just include the code below at the top of your Slim index.php after including SmartyView.

	SmartyView::$smartyExtensions = array(
		dirname(__FILE__) . '/Views/Extension/Smarty',
	);

Inside your Smarty template you would write:

	{urlFor name="hello" options="name.Josh|age.26"}

You can easily pass variables that are arrays using the (.) or object using the (->) by doing:

	<a href="{urlFor name="hello" options="name.{$person.name}|age.{$person.age}"}">Hello {$name}</a>

If you need to specify the appname for the getInstance method in the urlFor functions, set the appname parameter in your function:

	<a href="{urlFor name="hello" appname="admin" options="name.{$person.name}|age.{$person.age}"}">Hello {$name}</a>

The $smartyExtensions take an array of extension directories, this follows the Smarty naming convention provided in the Smarty docs.
