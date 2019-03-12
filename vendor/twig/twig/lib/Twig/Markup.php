<?php

use Twig\Markup;

class_exists('Twig\Markup');

@trigger_error(sprintf('Using the "Twig_Markup" class is deprecated since Twig version 2.7, use "Twig\Markup" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Markup" instead */
    class Twig_Markup extends Markup
    {
    }
}
