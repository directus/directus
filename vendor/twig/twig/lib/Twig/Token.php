<?php

use Twig\Token;

class_exists('Twig\Token');

@trigger_error(sprintf('Using the "Twig_Token" class is deprecated since Twig version 2.7, use "Twig\Token" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Token" instead */
    class Twig_Token extends Token
    {
    }
}
