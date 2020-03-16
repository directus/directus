<?php

use Twig\TwigFunction;

class_exists('Twig\TwigFunction');

@trigger_error(sprintf('Using the "Twig_Function" class is deprecated since Twig version 2.7, use "Twig\TwigFunction" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\TwigFunction" instead */
    class Twig_Function extends TwigFunction
    {
    }
}
