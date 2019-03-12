<?php

use Twig\Loader\ExistsLoaderInterface;

class_exists('Twig\Loader\ExistsLoaderInterface');

@trigger_error(sprintf('Using the "Twig_ExistsLoaderInterface" class is deprecated since Twig version 2.7, use "Twig\Loader\ExistsLoaderInterface" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Loader\ExistsLoaderInterface" instead */
    class Twig_ExistsLoaderInterface extends ExistsLoaderInterface
    {
    }
}
