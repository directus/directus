<?php

use Twig\TokenParser\AutoEscapeTokenParser;

class_exists('Twig\TokenParser\AutoEscapeTokenParser');

@trigger_error(sprintf('Using the "Twig_TokenParser_AutoEscape" class is deprecated since Twig version 2.7, use "Twig\TokenParser\AutoEscapeTokenParser" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\TokenParser\AutoEscapeTokenParser" instead */
    class Twig_TokenParser_AutoEscape extends AutoEscapeTokenParser
    {
    }
}
