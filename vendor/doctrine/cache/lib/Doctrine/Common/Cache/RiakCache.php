<?php
/*
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This software consists of voluntary contributions made by many individuals
 * and is licensed under the MIT license. For more information, see
 * <http://www.doctrine-project.org>.
 */

namespace Doctrine\Common\Cache;

use Riak\Bucket;
use Riak\Connection;
use Riak\Input;
use Riak\Exception;
use Riak\Object;

/**
 * Riak cache provider.
 *
 * @link   www.doctrine-project.org
 * @since  1.1
 * @author Guilherme Blanco <guilhermeblanco@hotmail.com>
 */
class RiakCache extends CacheProvider
{
    const EXPIRES_HEADER = 'X-Riak-Meta-Expires';

    /**
     * @var \Riak\Bucket
     */
    private $bucket;

    /**
     * Sets the riak bucket instance to use.
     *
     * @param \Riak\Bucket $bucket
     */
    public function __construct(Bucket $bucket)
    {
        $this->bucket = $bucket;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        try {
            $response = $this->bucket->get($id);

            // No objects found
            if ( ! $response->hasObject()) {
                return false;
            }

            // Check for attempted siblings
            $object = ($response->hasSiblings())
                ? $this->resolveConflict($id, $response->getVClock(), $response->getObjectList())
                : $response->getFirstObject();

            // Check for expired object
            if ($this->isExpired($object)) {
                $this->bucket->delete($object);

                return false;
            }

            return unserialize($object->getContent());
        } catch (Exception\RiakException $e) {
            // Covers:
            // - Riak\ConnectionException
            // - Riak\CommunicationException
            // - Riak\UnexpectedResponseException
            // - Riak\NotFoundException
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        try {
            // We only need the HEAD, not the entire object
            $input = new Input\GetInput();

            $input->setReturnHead(true);

            $response = $this->bucket->get($id, $input);

            // No objects found
            if ( ! $response->hasObject()) {
                return false;
            }

            $object = $response->getFirstObject();

            // Check for expired object
            if ($this->isExpired($object)) {
                $this->bucket->delete($object);

                return false;
            }

            return true;
        } catch (Exception\RiakException $e) {
            // Do nothing
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        try {
            $object = new Object($id);

            $object->setContent(serialize($data));

            if ($lifeTime > 0) {
                $object->addMetadata(self::EXPIRES_HEADER, (string) (time() + $lifeTime));
            }

            $this->bucket->put($object);

            return true;
        } catch (Exception\RiakException $e) {
            // Do nothing
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        try {
            $this->bucket->delete($id);

            return true;
        } catch (Exception\BadArgumentsException $e) {
            // Key did not exist on cluster already
        } catch (Exception\RiakException $e) {
            // Covers:
            // - Riak\Exception\ConnectionException
            // - Riak\Exception\CommunicationException
            // - Riak\Exception\UnexpectedResponseException
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        try {
            $keyList = $this->bucket->getKeyList();

            foreach ($keyList as $key) {
                $this->bucket->delete($key);
            }

            return true;
        } catch (Exception\RiakException $e) {
            // Do nothing
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        // Only exposed through HTTP stats API, not Protocol Buffers API
        return null;
    }

    /**
     * Check if a given Riak Object have expired.
     *
     * @param \Riak\Object $object
     *
     * @return bool
     */
    private function isExpired(Object $object)
    {
        $metadataMap = $object->getMetadataMap();

        return isset($metadataMap[self::EXPIRES_HEADER])
            && $metadataMap[self::EXPIRES_HEADER] < time();
    }

    /**
     * On-read conflict resolution. Applied approach here is last write wins.
     * Specific needs may override this method to apply alternate conflict resolutions.
     *
     * {@internal Riak does not attempt to resolve a write conflict, and store
     * it as sibling of conflicted one. By following this approach, it is up to
     * the next read to resolve the conflict. When this happens, your fetched
     * object will have a list of siblings (read as a list of objects).
     * In our specific case, we do not care about the intermediate ones since
     * they are all the same read from storage, and we do apply a last sibling
     * (last write) wins logic.
     * If by any means our resolution generates another conflict, it'll up to
     * next read to properly solve it.}
     *
     * @param string $id
     * @param string $vClock
     * @param array  $objectList
     *
     * @return \Riak\Object
     */
    protected function resolveConflict($id, $vClock, array $objectList)
    {
        // Our approach here is last-write wins
        $winner = $objectList[count($objectList)];

        $putInput = new Input\PutInput();
        $putInput->setVClock($vClock);

        $mergedObject = new Object($id);
        $mergedObject->setContent($winner->getContent());

        $this->bucket->put($mergedObject, $putInput);

        return $mergedObject;
    }
}
