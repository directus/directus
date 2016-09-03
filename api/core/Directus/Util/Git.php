<?php

namespace Directus\Util;

class Git
{

    public static function getCloneHash($expectedGitDirectory)
    {
        $headFile = $expectedGitDirectory . '/HEAD';
        // Parent-level clone
        if (is_file($headFile)) {
            $headFileContents = file_get_contents($headFile);
            if (false === strpos($headFileContents, 'ref:')) {
                return $headFileContents;
            } else {
                $branchPath = explode('ref:', $headFileContents);
                $branchPath = trim(array_pop($branchPath));
                $branchPath = $expectedGitDirectory . "/$branchPath";
                return trim(file_get_contents($branchPath));
            }
        } // Submodule
        elseif (is_file($expectedGitDirectory)) {
            $modulePath = explode('gitdir:', file_get_contents($expectedGitDirectory));
            $modulePath = trim(array_pop($modulePath));
            $modulePath = dirname($expectedGitDirectory) . "/$modulePath";
            return self::getCloneHash($modulePath);
        } else {
            //Always bust cache
            return session_id();
        }
    }

}
