<?php

namespace Directus\Util;

class Git
{
    public static function getCloneHash($rootDirectory)
    {
        $hash = static::getGitHash($rootDirectory);

        return $hash ? $hash : session_id();
    }

    public static function getGitHash($rootDirectory)
    {
        $hash = null;
        $headFile = $rootDirectory . '/HEAD';
        // Parent-level clone
        if (is_file($headFile)) {
            $headFileContents = file_get_contents($headFile);
            if (false === strpos($headFileContents, 'ref:')) {
                $hash = $headFileContents;
            } else {
                $branchPath = explode('ref:', $headFileContents);
                $branchPath = trim(array_pop($branchPath));
                $branchPath = $rootDirectory . '/' . $branchPath;
                $hash = trim(file_get_contents($branchPath));
            }
        }

        return $hash;
    }
}
