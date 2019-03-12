<?php

use Twig\TokenParser\FlushTokenParser;

class_exists('Twig\TokenParser\FlushTokenParser');

@trigger_error(sprintf('Using the "Twig_TokenParser_Flush" class is deprecated since Twig version 2.7, use "Twig\TokenParser\FlushTokenParser" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\TokenParser\FlushTokenParser" instead */
    class Twig_TokenParser_Flush extends FlushTokenParser
    {
    }
}
