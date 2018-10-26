<?php
class Issue797Test extends PHPUnit_Framework_TestCase
{
    protected $preserveGlobalState = false;

    public function testBootstrapPhpIsExecutedInIsolation()
    {
        $this->assertEquals(GITHUB_ISSUE, 797);
    }
}
