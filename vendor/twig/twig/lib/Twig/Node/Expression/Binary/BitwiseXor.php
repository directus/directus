<?php

use Twig\Node\Expression\Binary\BitwiseXorBinary;

class_exists('Twig\Node\Expression\Binary\BitwiseXorBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_BitwiseXor" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\BitwiseXorBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\BitwiseXorBinary" instead */
    class Twig_Node_Expression_Binary_BitwiseXor extends BitwiseXorBinary
    {
    }
}
