<?php

use Twig\Node\Expression\Binary\LessEqualBinary;

class_exists('Twig\Node\Expression\Binary\LessEqualBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_LessEqual" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\LessEqualBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\LessEqualBinary" instead */
    class Twig_Node_Expression_Binary_LessEqual extends LessEqualBinary
    {
    }
}
