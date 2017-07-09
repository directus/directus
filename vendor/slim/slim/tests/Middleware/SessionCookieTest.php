<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.6.1
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

class SessionCookieTest extends PHPUnit_Framework_TestCase
{
    public function setUp()
    {
        $_SESSION = array();
    }

    /**
     * Test session cookie is set and constructed correctly
     *
     * We test for two things:
     *
     * 1) That the HTTP cookie exists with the correct name;
     * 2) That the HTTP cookie's value is the expected value;
     */
    public function testSessionCookieIsCreated()
    {
        \Slim\Environment::mock(array(
            'SCRIPT_NAME' => '/index.php',
            'PATH_INFO' => '/foo'
        ));
        $app = new \Slim\Slim();
        $app->get('/foo', function () {
            $_SESSION['foo'] = 'bar';
            echo "Success";
        });
        $mw = new \Slim\Middleware\SessionCookie(array('expires' => '10 years'));
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        list($status, $header, $body) = $app->response()->finalize();
        $this->assertTrue($app->response->cookies->has('slim_session'));
        $cookie = $app->response->cookies->get('slim_session');
        $this->assertEquals('{"foo":"bar"}', $cookie['value']);
    }

    /**
     * Test $_SESSION is populated from an encrypted HTTP cookie
     *
     * The encrypted cookie contains the serialized array ['foo' => 'bar']. The
     * global secret, cipher, and cipher mode are assumed to be the default
     * values.
     */
    // public function testSessionIsPopulatedFromEncryptedCookie()
    // {
    //     \Slim\Environment::mock(array(
    //         'SCRIPT_NAME' => '/index.php',
    //         'PATH_INFO' => '/foo',
    //         'HTTP_COOKIE' => 'slim_session=1644004961%7CLKkYPwqKIMvBK7MWl6D%2BxeuhLuMaW4quN%2F512ZAaVIY%3D%7Ce0f007fa852c7101e8224bb529e26be4d0dfbd63',
    //     ));
    //     $app = new \Slim\Slim();
    //     // The cookie value in the test is encrypted, so cookies.encrypt must
    //     // be set to true
    //     $app->config('cookies.encrypt', true);
    //     $app->get('/foo', function () {
    //         echo "Success";
    //     });
    //     $mw = new \Slim\Middleware\SessionCookie(array('expires' => '10 years'));
    //     $mw->setApplication($app);
    //     $mw->setNextMiddleware($app);
    //     $mw->call();
    //     $this->assertEquals(array('foo' => 'bar'), $_SESSION);
    // }

    /**
     * Test $_SESSION is populated from an unencrypted HTTP cookie
     *
     * The unencrypted cookie contains the serialized array ['foo' => 'bar'].
     * The global cookies.encrypt setting is set to false
     */
    public function testSessionIsPopulatedFromUnencryptedCookie()
    {
        \Slim\Environment::mock(array(
            'SCRIPT_NAME' => '/index.php',
            'PATH_INFO' => '/foo',
            'HTTP_COOKIE' => 'slim_session={"foo":"bar"}',
        ));
        $app = new \Slim\Slim();
        // The cookie value in the test is unencrypted, so cookies.encrypt must
        // be set to false
        $app->config('cookies.encrypt', false);
        $app->get('/foo', function () {
            echo "Success";
        });
        $mw = new \Slim\Middleware\SessionCookie(array('expires' => '10 years'));
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        $this->assertEquals(array('foo' => 'bar'), $_SESSION);
    }

    /**
     * Test $_SESSION is populated from an unencrypted HTTP cookie
     *
     * The unencrypted cookie contains the serialized array ['foo' => 'bar'].
     * The global cookies.encrypt setting is set to false
     */
    public function testSessionIsPopulatedFromMalformedCookieData()
    {
        \Slim\Environment::mock(array(
            'SCRIPT_NAME' => '/index.php',
            'PATH_INFO' => '/foo',
            'HTTP_COOKIE' => 'slim_session={"foo":"bar"sdkhguy5y}',
        ));
        $app = new \Slim\Slim();
        // The cookie value in the test is unencrypted, so cookies.encrypt must
        // be set to false
        $app->config('cookies.encrypt', false);
        $app->get('/foo', function () {
            echo "Success";
        });
        $mw = new \Slim\Middleware\SessionCookie(array('expires' => '10 years'));
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        $this->assertEquals(array(), $_SESSION);
    }

    /**
     * Test $_SESSION is populated as empty array if no HTTP cookie
     */
    public function testSessionIsPopulatedAsEmptyIfNoCookie()
    {
        \Slim\Environment::mock(array(
            'SCRIPT_NAME' => '/index.php',
            'PATH_INFO' => '/foo'
        ));
        $app = new \Slim\Slim();
        $app->get('/foo', function () {
            echo "Success";
        });
        $mw = new \Slim\Middleware\SessionCookie(array('expires' => '10 years'));
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        $this->assertEquals(array(), $_SESSION);
    }

    public function testSerializingTooLongValueWritesLogAndDoesntCreateCookie()
    {
        \Slim\Environment::mock(array(
            'SCRIPT_NAME' => '/index.php',
            'PATH_INFO' => '/foo'
        ));

        $logWriter = $this->getMockBuilder('Slim\LogWriter')
            ->disableOriginalConstructor()
            ->getMock();

        $logWriter->expects($this->once())
            ->method('write')
            ->with('WARNING! Slim\Middleware\SessionCookie data size is larger than 4KB. Content save failed.', \Slim\Log::ERROR);

        $app = new \Slim\Slim(array(
            'log.writer' => $logWriter
        ));

        $tooLongValue = $this->getTooLongValue();

        $app->get('/foo', function () use ($tooLongValue) {
            $_SESSION['test'] = $tooLongValue;
            echo "Success";
        });

        $mw = new \Slim\Middleware\SessionCookie(array('expires' => '10 years'));
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        list($status, $header, $body) = $app->response()->finalize();
        $this->assertFalse($app->response->cookies->has('slim_session'));
    }

    /**
     * Generated by http://www.random.org/strings/
     */
    protected function getTooLongValue()
    {
        return <<<EOF
8Y7WpaR3Fiyv0wF0QhKn
hwgh0SYA5cNOh85lSY3E
POUv7tHdFAKK0rmJnNUT
dxVjXuDUlStKTiC6B2rE
BMnchGCK2IIC83agjZ8t
K5U9tmPok3z7n7qFJPp4
YfMPI07qRBgZnYW3vvrj
mY1082KeqiegFNwGiUSs
HYE16N7PChio33DZWjsD
urQLFxD1I0FsxPO7rora
Nmas8nhLl1SiwnlL8eZX
y2xe18BWfXcNHDGkfaih
zXT7MxHXmnq0s4lowjcc
5n8lrXmjYtIdHxl2QcMb
emFTXQpPX9bw8WjulQCB
Peq12lgmurt988RZiquy
lQ5Dw86wMIcIm3uULhr7
T8Obj45ubR8poc1l5sIs
EG6kvcDIHVeQjUdrJuiw
sBLmZnLll23QGK8hMFO1
Pii0BXpzL9wpUt3hQnfe
prkTuA8zuxU8vMOu5uSi
Zynrx9BniMwYGPTOJVSd
ygUsr1GQ1KGJu6ukLvgo
7zrkBV0QM9jNqqvkzZwm
ZnoKRJI1SbaSCqsAduCt
q5RPtNVpHmtizY3QwiJs
8tjGt9MG37zgKx8KhfYE
ByoILEa2ceHjdrP6yd1G
UMHeFx2kOCx2DVeVJIkt
aiFdKMTE9rIbpObSp1fy
Aei9bjwcWwHT2S22rYnj
QHG7FEHSPdkw8acO393N
Ip4rgim3NKanJXpfdthy
yMh4EnoYBBoqSScfW4g5
bVrXYt8JkyCuR5Og0JBN
npKpr7obY4ZYVOnIF9Pe
soEmhC8uCw73bXzMy4ui
2oi4eFSXOoNDXZiAkz3c
zshSls22jy5QBvEJDDtY
C50qtymWnisOM1TIochg
OOnMEtkUHJw21kuw6m91
aqxRK1thCfPGBGytOmzG
kyqvZE1oEzCONj7q4I3p
rvbnRzZhXv21UXRJnR51
QJyXbtzDGpSljtSt4Fxi
SGiklrhWQCdRrnXuBExW
mQFykwpVF07NRPet9LdT
zOaOhwMfCeYQr2xqkKq7
Ru2dsZdhHzhBDvV5nv1q
qB7kVD0YDKB6RJyPcpX9
MxvPmISfMJMFiAFD82Qf
0idAAQxmd6fK9TkJPihp
wp2mvp3yAHWKmdsgLcss
OUqFt0BJoM7Iz4jJpF2d
hiWTsF1jrgEhV07TInLp
u7htseWgTDRY9UYp9wy6
vnF0vsaFikqpjGkLy5oH
ncvaoRPa5MDBNvXZoiG9
gCMvsGG8eLW3u8UWvRrk
bKgFBuy4zLhBF4RBuTVt
Dz1QmbyQPqmmfjchF6u3
myRkxQtSnHQZr0kUqSJS
Ati7CBQq6LOPSVlAek5a
7EOVTREQ52qOjKAibvAr
etvEUy3CbsDiaeSPGlJH
XyFey6LugF2UZfHDFjgV
ByBaUrDz0yuvLOvECQuS
5CoA6FBz8D71FwwebEYl
5xQyEV5h7lNAsgbjBY6o
N92xlCGjyNGWp1Y9HoNL
mMhirp7mufNYVqIy8jBl
nYSK8Rk6KybpAPspHXPd
oemmqqxjF9g4ZjNk2pyL
dqetI1RYqszZPZeH7WNW
B1x1GSPdGXnefeNmxFxr
vFTVOHqgOgZR0xHHUl8P
RwFio0Cd8ZkaRIpcs7jh
Ps0tGJgPyo1gRdm9wtlB
j4hmInyIpAz1MjHYAQc1
YIjnSirWsrItgqidgS3W
LNT7DriU7wPyN6zV9G6d
YFD19x1DDBwz57DegTsy
rz72EblrUsP6wtN69GRo
irhM6N9eNu8Bq9Qo5Tlc
Cpb3Zl3FDttiW63KXQpL
4ZQ7VGbfVjwBwhcGoOe7
RgXxZ9OU0HJFQRpjvJDW
lk3PpNhcHT4vVkgF9Q3V
URiazjSe8G4zHrBBMaxM
Gh7Xp4hqf9GTnIYyMe5E
palqUjJhSGm7EZAR1b4i
HN8qrHznKAyhlywYBw3N
nV9Kla5KFWaRG4r3cCT1
qHT7nPIbVjxNYdujh5WK
CKg7BfQjwZtHk2oM1cyO
RBPMpZxNpM3ZhiXNz5D2
xZJM9ETPwABBqHirjTXA
faI4irlrshHra2hg6mHE
N0OLyZjmKpyzHRlAcC44
oEMe1Mq85Kynyla7S3Lo
Us9auTpKq33jAI51MUvC
Vbu2qKSsmCrXu1WMDFfL
WCCzzLqz2kfMy3IV0ngc
ya4k4AoSjb2nd43VGRvt
1FrWocIRfoyFj3igs8lF
dQlTXv3jttgGmHVJtuJK
zCHcfzABc5pNch7cEW4B
r8jB0mL9ESrMHhvqGxbf
qLUYdNrXNJNujy43WNLt
GaQ6adUTFHErjRYFj7ws
btv28UZlttBqlVAEpu7G
1Se9HT2tp45a5iwbAHpA
tXaOwMjaI3S1uxngaVVL
saFZXdx4kExE3Y3SEMTA
my9rhAEFcw4N1uBqa2Ts
IRupwTKFoRIpPSBwnPPw
qpxq4VIrOdESR4UZiOcw
1n12beyYTUN0zNzV0nRf
dkgrmnaeWbrxA2QQaHDq
o1f6VCap62NxJI2Wd0F7
eyYYL6mY0XUmuCdV2v9e
SPBqa552akcetnRViZD9
cqLrX89ouNlDcjC7hmYk
3vAcrwlseFDYDYzrCXXx
tkyJUeJjORVXoFKaoEmi
o1JoqBFpSPyRT6RwFTXC
IMW657539XCcn0Tvx3iJ
rW9ZUNBSHNHjR0wfbr1R
x7Ez1Br1T9VG4wEetwfY
Xj9s0ipdQDEeYG3eCkBG
xQCp4J0a7BEqEEVPJvYY
S46aXD70Ur3BiokRfeJK
kEQcqPCP9kmWxXboESOB
VjADYs7ZwJUvWNAk0Msc
5cSrhWsbizSwo31NsPKj
PHKG7ui9gU0F5fXKXtWz
8FxjchkHJ3jQQSWKfkSu
pN8e9d71IVYA1vLyQGqV
Hh3QE3o9tmNsJMEBoRK8
QBLTFWWfkGSOI3Vp3y6c
5gwll5qdcgnaF4tDvdRd
NDYpacWX4hnFsrO73OOo
GaenbdbDOUp0iClZKlTU
79UJvctLD86KC2mwxSqc
jbwmzM4oZZ7zuYo769YY
B7Ssx6qbITbIqaJJboMK
7tLwsE3FhBphBJBKP4Bk
aumHnttxOXpiX3b5ivlk
gsvWRKCd1KLYkucRdW1j
j0TSXNoMGXlIK9X6YjX1
4zvHH7QEPlgK4AaRWw6r
eXSVfE2X2nbn1wzA3bdw
exrWkKQ8v87kzzxpzdF7
wL9B42yeyA6SgfnZ0SnW
hyO53wkaJNQnK2rzndcA
8jSesmehxaHL39QUdlEo
oAQMANsGVewC4cYhdjpk
tBVMFz1LMIg8nj5acoKx
4IxsrP4UrdaHa2QlFZ38
OMg0erS6Mg2nVY9PBLGu
WLybJJlrNJ3ZKgftRyOb
s392j4FVZuxnLc8Euq2g
2AB9ceeOXHrw6dJeqImY
q8Gqy9rzsKyp9vEg13h3
UhWoiMQuE8i38vd5HZuO
CjLfC9MtQY7wou4YGl1f
bQGFeV3I1YVsyh1zjdYX
E4yS7PXLT2pTvq9aTuPc
41Vm8F6tc6mnYCc0gfCY
nmKOUzThbGpqnSkJzmr5
E5izT37qIM1PJ1IotRnw
X0rD7K2rUN47XeLXW3x2
3taWQ4GMNGQgjuD7MPwX
u7AyGdUWFG25ZaeZSyrt
mLPs4NU5ayAgrj9L089E
5mWnKfJ8OoAbhjb9XpY5
cBv75uTcpezbnWe5C7YC
DWikoIaaJQebFW2tddw2
qMyIzbkUJxyTheONxBjJ
WyWqJmTW5uniw9ofX84U
JaFGtu4y24UGSmPrIjVj
SDFz3iRvf2FG65m8brV9
0mpT6dWL4p59cdTs0n1c
jw7rIgu3VFnkuOp8mZR3
F1PPQYZfZkqbyiu7Tvl6
tXT8EPpH39oB9Qe3SI6C
DwL6cklHbnOyEOO5jNOo
vEORF3tEYRngOowzuOEY
6XY27pGEG9L9MvwvHinw
rEMyl7S9eFk554yHvCa3
pLToqRXBWIPK51roFlKs
AXfdbVdGkGqwlKn68k01
ecFbbnvrpmcLF2gL3GbC
aWJf90PECBF0qqZ1jVC3
WjMuah0gZjryj7zsZKMB
1J9koTowUYguyp4MBGmp
rnjhybC8RQSEvmYpqkGR
Qdj2QlGYXN1H8A1315QJ
amycQeWwXnrdI3duyqTa
H2YwgIStIGQlWNigfiIZ
btR0CdDnkwGt0hlCtQF0
O37vtIvVgCKVbcXbBexH
xhkbsShz4onN4CeGf7Ox
1vJfx422pUnxtjG5Laag
3IV5ib20qSYZW3Wr2LiH
zmvoTLblxTX3EpYPlHxC
U0Ceix4L3dMomXzn7OAC
JyzkRGfIi8j4EnKfoWPG
gMUXWXZZgJzLBfZ4y9FV
7ClYOAd9EoWspOWQ1MmO
1CIKB3Ei846C1rmXS8Zc
ARLDXFpaHp1VlbEMF8fk
KrQa28U3gbHs9B5oGhxS
WHc9LmQiINcUglo8cKPs
3WMYJ8TAtvlMswUPOd6t
s81Cy4B2oLrc4E5XSa5p
QA6pDUiKipuWFXZ4BMUF
E03CQbBiZ27GpJekftsF
pqGkJifdjVLuuIu0xBej
V27rk0vIwp1Q8p4DvJ1F
TPhvHNooyU6Rrmcx8GIK
81nRsYYsvVo3LCmuOnX5
uY6xGTes3UOMXkXwEfGj
T5LfaSyWP5y4L7vvLBjS
dHO7dVB1bmIA40fEgk3i
KHJxU6C0rUVtPtIR1slm
YdhTz1mwWi2z2GDzzRJB
TIzFqPkKrgCgkiv2RzCg
Z0qY4Wjpfug51zXzU51H
nWm3mJnVLAKv9RNkdThl
xk28IMKOGOPdQuXjGDB6
eEG3ndIRXnmmLilygHop
jE6u88nWi30Yos79canx
b0VuROFF04rZuOTo5Fue
yt4fSpHN7v4uZ7uNPMA9
0sENIYeLlIbBWhqTjXCp
m7qMMX3acdRtTTVNp7Qt
s8XKOJmCQr7YGk47jGMn
6o1kxMmoUgWCW8rEtnWA
kxXj1hKRFBJmX8ErM6Zp
FZBIPSbNt5hmXoC1M92l
UxeirI2PCJnQcAJVmNVJ
FaJ9L5K0u1J9JKGl2Aew
bHGX5QLvkGXSFY5OCezp
5cnbOjU1j8Fuvtuuk9d0
7Oz2IIi69WB5J14n9iWQ
XgCpDLURX3urpiYDFf3P
7xeWOS4yTMUQ0EbLkZOU
AzKM3Dp7nGr9SYPI4xmi
EOF;
    }
}
