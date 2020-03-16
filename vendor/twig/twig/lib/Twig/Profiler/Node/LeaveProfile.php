<?php

use Twig\Profiler\Node\LeaveProfileNode;

class_exists('Twig\Profiler\Node\LeaveProfileNode');

@trigger_error(sprintf('Using the "Twig_Profiler_Node_LeaveProfile" class is deprecated since Twig version 2.7, use "Twig\Profiler\Node\LeaveProfileNode" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Profiler\Node\LeaveProfileNode" instead */
    class Twig_Profiler_Node_LeaveProfile extends LeaveProfileNode
    {
    }
}
