<?php

use Twig\TokenParser\ExtendsTokenParser;

class_exists('Twig\TokenParser\ExtendsTokenParser');

@trigger_error(sprintf('Using the "Twig_TokenParser_Extends" class is deprecated since Twig version 2.7, use "Twig\TokenParser\ExtendsTokenParser" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\TokenParser\ExtendsTokenParser" instead */
    class Twig_TokenParser_Extends extends ExtendsTokenParser
    {
    }
}
