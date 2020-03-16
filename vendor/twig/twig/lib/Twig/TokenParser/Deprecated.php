<?php

use Twig\TokenParser\DeprecatedTokenParser;

class_exists('Twig\TokenParser\DeprecatedTokenParser');

@trigger_error(sprintf('Using the "Twig_TokenParser_Deprecated" class is deprecated since Twig version 2.7, use "Twig\TokenParser\DeprecatedTokenParser" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\TokenParser\DeprecatedTokenParser" instead */
    class Twig_TokenParser_Deprecated extends DeprecatedTokenParser
    {
    }
}
