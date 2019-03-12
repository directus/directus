<?php

use Twig\Node\Expression\Binary\BitwiseOrBinary;

class_exists('Twig\Node\Expression\Binary\BitwiseOrBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_BitwiseOr" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\BitwiseOrBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\BitwiseOrBinary" instead */
    class Twig_Node_Expression_Binary_BitwiseOr extends BitwiseOrBinary
    {
    }
}
