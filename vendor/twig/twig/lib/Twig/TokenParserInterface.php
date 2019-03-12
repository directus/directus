<?php

use Twig\TokenParser\TokenParserInterface;

class_exists('Twig\TokenParser\TokenParserInterface');

@trigger_error(sprintf('Using the "Twig_TokenParserInterface" class is deprecated since Twig version 2.7, use "Twig\TokenParser\TokenParserInterface" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\TokenParser\TokenParserInterface" instead */
    class Twig_TokenParserInterface extends TokenParserInterface
    {
    }
}
