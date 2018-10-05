<?php namespace League\OAuth2\Client\Test\Provider;

use Mockery as m;

class GithubResourceOwnerTest extends \PHPUnit_Framework_TestCase
{
    public function testUrlIsNullWithoutDomainOrNickname()
    {
        $user = new \League\OAuth2\Client\Provider\GithubResourceOwner;

        $url = $user->getUrl();

        $this->assertNull($url);
    }

    public function testUrlIsDomainWithoutNickname()
    {
        $domain = uniqid();
        $user = new \League\OAuth2\Client\Provider\GithubResourceOwner;
        $user->setDomain($domain);

        $url = $user->getUrl();

        $this->assertEquals($domain, $url);
    }

    public function testUrlIsNicknameWithoutDomain()
    {
        $nickname = uniqid();
        $user = new \League\OAuth2\Client\Provider\GithubResourceOwner(['login' => $nickname]);

        $url = $user->getUrl();

        $this->assertEquals($nickname, $url);
    }
}
