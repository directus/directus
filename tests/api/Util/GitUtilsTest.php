<?php

class GitUtilsTest extends PHPUnit_Framework_TestCase
{
    protected $gitPath;
    protected $gitPath2;

    public function setUp()
    {
        $this->gitPath = __DIR__ . '/git';
        $this->gitPath2 = $this->gitPath . '2';
        mkdir($this->gitPath);
        file_put_contents($this->gitPath . '/HEAD', 'ref: master');
        file_put_contents($this->gitPath . '/master', 'commit-hash');

        mkdir($this->gitPath2);
        file_put_contents($this->gitPath2 . '/HEAD', 'development');
    }

    public function tearDown()
    {
        unlink($this->gitPath . '/HEAD');
        unlink($this->gitPath . '/master');
        unlink($this->gitPath2 . '/HEAD');
        rmdir($this->gitPath);
        rmdir($this->gitPath2);
    }

    public function testHashDotGit()
    {
        $hash = \Directus\Util\Git::getCloneHash(__DIR__ . '/git');
        $this->assertSame('commit-hash', $hash);
    }

    public function testHashDotGitMissingHead()
    {
        $hash = \Directus\Util\Git::getCloneHash(__DIR__ . '/git2');
        $this->assertSame('development', $hash);
    }

    public function testSession()
    {
        $this->assertSame(session_id(), \Directus\Util\Git::getCloneHash(''));
    }
}
