<?php
/*
 * Smarty plugin
 * -------------------------------------------------------------
 * File:     function.urlFor.php
 * Type:     function
 * Name:     urlFor
 * Purpose:  outputs url for a function with the defined name method
 * -------------------------------------------------------------
 */
function smarty_function_urlFor($params, $template)
{
	$name = isset($params['name']) ? $params['name'] : '';
    $appName = isset($params['appname']) ? $params['appname'] : 'default';

	$url = \Slim\Slim::getInstance($appName)->urlFor($name);

	if (isset($params['options']))
	{
		$options = explode('|', $params['options']);
		foreach ($options as $option) {
			list($key, $value) = explode('.', $option);
			$opts[$key] = $value;
		}

		$url = \Slim\Slim::getInstance($appName)->urlFor($name, $opts);
	}

	return $url;
}
