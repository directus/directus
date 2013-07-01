<?php

namespace Directus\Media\Upload\Adapter;

use Directus\Media\Upload;

class FileSystemAdapter extends Adapter {

	/**
	 * @param  array $file One item from the $_FILES superglobal.
	 */
	public function acceptUpload($file) {
		$path = $this->getTarget();
        $media = new Upload($file, $path);
        return $media;
	}

}