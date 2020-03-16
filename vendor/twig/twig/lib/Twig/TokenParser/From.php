<?php

use Twig\TokenParser\FromTokenParser;

class_exists('Twig\TokenParser\FromTokenParser');

@trigger_error(sprintf('Using the "Twig_TokenParser_From" class is deprecated since Twig version 2.7, use "Twig\TokenParser\FromTokenParser" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\TokenParser\FromTokenParser" instead */
    class Twig_TokenParser_From extends FromTokenParser
    {
    }
}
