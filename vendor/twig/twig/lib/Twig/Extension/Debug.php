<?php

/*
 * This file is part of Twig.
 *
 * (c) 2011 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Twig_Extension_Debug extends Twig_Extension
{
    public function getFunctions()
    {
        // dump is safe if var_dump is overridden by xdebug
        $isDumpOutputHtmlSafe = extension_loaded('xdebug')
            // false means that it was not set (and the default is on) or it explicitly enabled
            && (false === ini_get('xdebug.overload_var_dump') || ini_get('xdebug.overload_var_dump'))
            // false means that it was not set (and the default is on) or it explicitly enabled
            // xdebug.overload_var_dump produces HTML only when html_errors is also enabled
            && (false === ini_get('html_errors') || ini_get('html_errors'))
            || 'cli' === php_sapi_name()
        ;

        return array(
            new Twig_SimpleFunction('dump', 'twig_var_dump', array('is_safe' => $isDumpOutputHtmlSafe ? array('html') : array(), 'needs_context' => true, 'needs_environment' => true)),
        );
    }

    public function getName()
    {
        return 'debug';
    }
}

function twig_var_dump(Twig_Environment $env, $context)
{
    if (!$env->isDebug()) {
        return;
    }

    ob_start();

    $count = func_num_args();
    if (2 === $count) {
        $vars = array();
        foreach ($context as $key => $value) {
            if (!$value instanceof Twig_Template) {
                $vars[$key] = $value;
            }
        }

        var_dump($vars);
    } else {
        for ($i = 2; $i < $count; ++$i) {
            var_dump(func_get_arg($i));
        }
    }

    return ob_get_clean();
}
