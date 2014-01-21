<?php

namespace Directus\Util;

class Git {

    public static function getCloneHash($expectedGitDirectory) {
        $gitCommitHash = null;
        $headFile = $expectedGitDirectory . '/HEAD';
        // Parent-level clone
        if(is_file($headFile)) {
            $branchPath = explode('ref:', file_get_contents($headFile));
            $branchPath = trim(array_pop($branchPath));
            $branchPath = $expectedGitDirectory . "/$branchPath";
            $gitCommitHash = trim(file_get_contents($branchPath));
        }
        // Submodule
        elseif(is_file($expectedGitDirectory)) {
            $modulePath = explode('gitdir:', file_get_contents($expectedGitDirectory));
            $modulePath = trim(array_pop($modulePath));
            $modulePath = dirname($expectedGitDirectory) . "/$modulePath";
            $gitCommitHash = self::getCloneHash($modulePath);
        }
        return $gitCommitHash;
    }

}
