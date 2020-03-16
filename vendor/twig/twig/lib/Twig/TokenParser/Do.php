<?php

use Twig\TokenParser\DoTokenParser;

class_exists('Twig\TokenParser\DoTokenParser');

@trigger_error(sprintf('Using the "Twig_TokenParser_Do" class is deprecated since Twig version 2.7, use "Twig\TokenParser\DoTokenParser" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\TokenParser\DoTokenParser" instead */
    class Twig_TokenParser_Do extends DoTokenParser
    {
    }
}
