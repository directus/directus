<?php

use Twig\Node\Expression\Binary\FloorDivBinary;

class_exists('Twig\Node\Expression\Binary\FloorDivBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_FloorDiv" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\FloorDivBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\FloorDivBinary" instead */
    class Twig_Node_Expression_Binary_FloorDiv extends FloorDivBinary
    {
    }
}
