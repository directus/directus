<?php

use Twig\Node\Expression\Binary\GreaterEqualBinary;

class_exists('Twig\Node\Expression\Binary\GreaterEqualBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_GreaterEqual" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\GreaterEqualBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\GreaterEqualBinary" instead */
    class Twig_Node_Expression_Binary_GreaterEqual extends GreaterEqualBinary
    {
    }
}
