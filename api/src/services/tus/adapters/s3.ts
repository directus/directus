/**
 * TUS Amazon S3 storage implementation for resumable uploads
 *
 * https://tus.io/
 */
import os from 'node:os'
import fs, {promises as fsProm} from 'node:fs'
import stream, {promises as streamProm} from 'node:stream'
import type {Readable} from 'node:stream'

import AWS, {NoSuchKey, NotFound, S3, S3ClientConfig} from '@aws-sdk/client-s3'

import {
  DataStore,
  StreamSplitter,
  Upload,
  ERRORS,
  TUS_RESUMABLE,
  KvStore,
  MemoryKvStore,
} from '@tus/utils'

import {Semaphore, Permit} from '@shopify/semaphore'
import MultiStream from 'multistream'
import crypto from 'node:crypto'
import path from 'node:path'

export type S3Options = {
  // The preferred part size for parts send to S3. Can not be lower than 5MiB or more than 5GiB.
  // The server calculates the optimal part size, which takes this size into account,
  // but may increase it to not exceed the S3 10K parts limit.
  partSize?: number
  useTags?: boolean
  maxConcurrentPartUploads?: number
  cache?: KvStore<MetadataValue>
  expirationPeriodInMilliseconds?: number
  // Options to pass to the AWS S3 SDK.
  s3ClientConfig: S3ClientConfig & {bucket: string}
}

export type MetadataValue = {
  file: Upload
  'upload-id': string
  'tus-version': string
}

function calcOffsetFromParts(parts?: Array<AWS.Part>) {
  // @ts-expect-error not undefined
  return parts && parts.length > 0 ? parts.reduce((a, b) => a + b.Size, 0) : 0
}

// Implementation (based on https://github.com/tus/tusd/blob/master/s3store/s3store.go)
//
// Once a new tus upload is initiated, multiple objects in S3 are created:
//
// First of all, a new info object is stored which contains (as Metadata) a JSON-encoded
// blob of general information about the upload including its size and meta data.
// This kind of objects have the suffix ".info" in their key.
//
// In addition a new multipart upload
// (http://docs.aws.amazon.com/AmazonS3/latest/dev/uploadobjusingmpu.html) is
// created. Whenever a new chunk is uploaded to tus-node-server using a PATCH request, a
// new part is pushed to the multipart upload on S3.
//
// If meta data is associated with the upload during creation, it will be added
// to the multipart upload and after finishing it, the meta data will be passed
// to the final object. However, the metadata which will be attached to the
// final object can only contain ASCII characters and every non-ASCII character
// will be replaced by a question mark (for example, "Menü" will be "Men?").
// However, this does not apply for the metadata returned by the `_getMetadata`
// function since it relies on the info object for reading the metadata.
// Therefore, HEAD responses will always contain the unchanged metadata, Base64-
// encoded, even if it contains non-ASCII characters.
//
// Once the upload is finished, the multipart upload is completed, resulting in
// the entire file being stored in the bucket. The info object, containing
// meta data is not deleted.
//
// Considerations
//
// In order to support tus' principle of resumable upload, S3's Multipart-Uploads
// are internally used.
// For each incoming PATCH request (a call to `write`), a new part is uploaded
// to S3.
export class S3FileStore extends DataStore {
  private bucket: string
  private cache: KvStore<MetadataValue>
  private client: S3
  private preferredPartSize: number
  private expirationPeriodInMilliseconds = 0
  private useTags = true
  private partUploadSemaphore: Semaphore
  public maxMultipartParts = 10_000 as const
  public minPartSize = 5_242_880 as const // 5MiB
  public maxUploadSize = 5_497_558_138_880 as const // 5TiB

  constructor(options: S3Options) {
    super()
    const {partSize, s3ClientConfig} = options
    const {bucket, ...restS3ClientConfig} = s3ClientConfig

    this.extensions = [
      'creation',
      'termination',
      'expiration',
    ]

    this.bucket = bucket
    this.preferredPartSize = partSize || 8 * 1024 * 1024
    this.expirationPeriodInMilliseconds = options.expirationPeriodInMilliseconds ?? 0
    this.useTags = options.useTags ?? true
    this.cache = options.cache ?? new MemoryKvStore<MetadataValue>()
    this.client = new S3(restS3ClientConfig)
    this.partUploadSemaphore = new Semaphore(options.maxConcurrentPartUploads ?? 60)
  }

  protected shouldUseExpirationTags() {
    return this.expirationPeriodInMilliseconds !== 0 && this.useTags
  }

  protected useCompleteTag(value: 'true' | 'false') {
    if (!this.shouldUseExpirationTags()) {
      return undefined
    }

    return `Tus-Completed=${value}`
  }

  /**
   * Saves upload metadata to a `${file_id}.info` file on S3.
   * Please note that the file is empty and the metadata is saved
   * on the S3 object's `Metadata` field, so that only a `headObject`
   * is necessary to retrieve the data.
   */
  private async saveMetadata(upload: Upload, uploadId: string) {
    console.log(`[${upload.id}] saving metadata`);

    await this.client.putObject({
      Bucket: this.bucket,
      Key: this.infoKey(upload.id),
      Body: JSON.stringify(upload),
      Tagging: this.useCompleteTag('false'),
      Metadata: {
        'upload-id': uploadId,
        'tus-version': TUS_RESUMABLE,
      },
    })

    console.log(`[${upload.id}] metadata file saved`)
  }

  private async completeMetadata(upload: Upload) {
    if (!this.shouldUseExpirationTags()) {
      return
    }

    const {'upload-id': uploadId} = await this.getMetadata(upload.id)

    await this.client.putObject({
      Bucket: this.bucket,
      Key: this.infoKey(upload.id),
      Body: JSON.stringify(upload),
      Tagging: this.useCompleteTag('true'),
      Metadata: {
        'upload-id': uploadId,
        'tus-version': TUS_RESUMABLE,
      },
    })
  }

  /**
   * Retrieves upload metadata previously saved in `${file_id}.info`.
   * There's a small and simple caching mechanism to avoid multiple
   * HTTP calls to S3.
   */
  private async getMetadata(id: string): Promise<MetadataValue> {
    const cached = await this.cache.get(id)

    if (cached) {
      return cached
    }

    const {Metadata, Body} = await this.client.getObject({
      Bucket: this.bucket,
      Key: this.infoKey(id),
    })

    const file = JSON.parse((await Body?.transformToString()) as string)

    const metadata: MetadataValue = {
      'tus-version': Metadata?.['tus-version'] as string,
      'upload-id': Metadata?.['upload-id'] as string,
      file: new Upload({
        id,
        size: file.size ? Number.parseInt(file.size, 10) : undefined,
        offset: Number.parseInt(file.offset, 10),
        metadata: file.metadata,
        creation_date: file.creation_date,
        storage: file.storage,
      }),
    }

    await this.cache.set(id, metadata)
    return metadata
  }

  private infoKey(id: string) {
    return `${id}.info`
  }

  private partKey(id: string, isIncomplete = false) {
    if (isIncomplete) {
      id += '.part'
    }

    // TODO: introduce ObjectPrefixing for parts and incomplete parts.
    // ObjectPrefix is prepended to the name of each S3 object that is created
    // to store uploaded files. It can be used to create a pseudo-directory
    // structure in the bucket, e.g. "path/to/my/uploads".
    return id
  }

  private async uploadPart(
    metadata: MetadataValue,
    readStream: fs.ReadStream | Readable,
    partNumber: number
  ): Promise<string> {
    const data = await this.client.uploadPart({
      Bucket: this.bucket,
      Key: metadata.file.id,
      UploadId: metadata['upload-id'],
      PartNumber: partNumber,
      Body: readStream,
    })

    console.log(`[${metadata.file.id}] finished uploading part #${partNumber}`)
    return data.ETag as string
  }

  private async uploadIncompletePart(
    id: string,
    readStream: fs.ReadStream | Readable
  ): Promise<string> {
    const data = await this.client.putObject({
      Bucket: this.bucket,
      Key: this.partKey(id, true),
      Body: readStream,
      Tagging: this.useCompleteTag('false'),
    })

    console.log(`[${id}] finished uploading incomplete part`)
    return data.ETag as string
  }

  private async downloadIncompletePart(id: string) {
    const incompletePart = await this.getIncompletePart(id)

    if (!incompletePart) {
      return
    }

    const filePath = await this.uniqueTmpFileName('tus-s3-incomplete-part-')

    try {
      let incompletePartSize = 0

      const byteCounterTransform = new stream.Transform({
        transform(chunk, _, callback) {
          incompletePartSize += chunk.length
          callback(null, chunk)
        },
      })

      // write to temporary file
      await streamProm.pipeline(
        incompletePart,
        byteCounterTransform,
        fs.createWriteStream(filePath)
      )

      const createReadStream = (options: {cleanUpOnEnd: boolean}) => {
        const fileReader = fs.createReadStream(filePath)

        if (options.cleanUpOnEnd) {
          fileReader.on('end', () => {
            fs.unlink(filePath, () => {
              // ignore
            })
          })

          fileReader.on('error', (err) => {
            fileReader.destroy(err)

            fs.unlink(filePath, () => {
              // ignore
            })
          })
        }

        return fileReader
      }

      return {size: incompletePartSize, path: filePath, createReader: createReadStream}
    } catch (err) {
      fsProm.rm(filePath).catch(() => {
        /* ignore */
      })

      throw err
    }
  }

  private async getIncompletePart(id: string): Promise<Readable | undefined> {
    try {
      const data = await this.client.getObject({
        Bucket: this.bucket,
        Key: this.partKey(id, true),
      })

      return data.Body as Readable
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return undefined
      }

      throw error
    }
  }

  private async getIncompletePartSize(id: string): Promise<number | undefined> {
    try {
      const data = await this.client.headObject({
        Bucket: this.bucket,
        Key: this.partKey(id, true),
      })

      return data.ContentLength
    } catch (error) {
      if (error instanceof NotFound) {
        return undefined
      }

      throw error
    }
  }

  private async deleteIncompletePart(id: string): Promise<void> {
    await this.client.deleteObject({
      Bucket: this.bucket,
      Key: this.partKey(id, true),
    })
  }

  /**
   * Uploads a stream to s3 using multiple parts
   */
  private async uploadParts(
    metadata: MetadataValue,
    readStream: stream.Readable,
    currentPartNumber: number,
    offset: number
  ): Promise<number> {
    const size = metadata.file.size
    const promises: Promise<void>[] = []
    let pendingChunkFilepath: string | null = null
    let bytesUploaded = 0
    let permit: Permit | undefined = undefined

    const splitterStream = new StreamSplitter({
      chunkSize: this.calcOptimalPartSize(size),
      directory: os.tmpdir(),
    })
      .on('beforeChunkStarted', async () => {
        permit = await this.partUploadSemaphore.acquire()
      })
      .on('chunkStarted', (filepath) => {
        pendingChunkFilepath = filepath
      })
      .on('chunkFinished', ({path, size: partSize}) => {
        pendingChunkFilepath = null

        const partNumber = currentPartNumber++
        const acquiredPermit = permit

        offset += partSize

        const isFinalPart = size === offset

        // eslint-disable-next-line no-async-promise-executor
        const deferred = new Promise<void>(async (resolve, reject) => {
          try {
            // Only the first chunk of each PATCH request can prepend
            // an incomplete part (last chunk) from the previous request.
            const readable = fs.createReadStream(path)
            readable.on('error', reject)

            if (partSize >= this.minPartSize || isFinalPart) {
              await this.uploadPart(metadata, readable, partNumber)
            } else {
              await this.uploadIncompletePart(metadata.file.id, readable)
            }

            bytesUploaded += partSize
            resolve()
          } catch (error) {
            reject(error)
          } finally {
            fsProm.rm(path).catch(() => {
              /* ignore */
            })

            acquiredPermit?.release()
          }
        })

        promises.push(deferred)
      })
      .on('chunkError', () => {
        permit?.release()
      })

    try {
      await streamProm.pipeline(readStream, splitterStream)
    } catch (error) {
      if (pendingChunkFilepath !== null) {
        try {
          await fsProm.rm(pendingChunkFilepath)
        } catch {
		console.log(`[${metadata.file.id}] failed to remove chunk ${pendingChunkFilepath}`)
        }
      }

      promises.push(Promise.reject(error))
    } finally {
      await Promise.all(promises)
    }

    return bytesUploaded
  }

  /**
   * Completes a multipart upload on S3.
   * This is where S3 concatenates all the uploaded parts.
   */
  private async finishMultipartUpload(metadata: MetadataValue, parts: Array<AWS.Part>) {
    const response = await this.client.completeMultipartUpload({
      Bucket: this.bucket,
      Key: metadata.file.id,
      UploadId: metadata['upload-id'],
      MultipartUpload: {
        Parts: parts.map((part) => {
          return {
            ETag: part.ETag,
            PartNumber: part.PartNumber,
          }
        }),
      },
    })

    return response.Location
  }

  /**
   * Gets the number of complete parts/chunks already uploaded to S3.
   * Retrieves only consecutive parts.
   */
  private async retrieveParts(
    id: string,
    partNumberMarker?: string
  ): Promise<Array<AWS.Part>> {
    const metadata = await this.getMetadata(id)

    const params: AWS.ListPartsCommandInput = {
      Bucket: this.bucket,
      Key: id,
      UploadId: metadata['upload-id'],
      PartNumberMarker: partNumberMarker,
    }

    const data = await this.client.listParts(params)

    let parts = data.Parts ?? []

    if (data.IsTruncated) {
      const rest = await this.retrieveParts(id, data.NextPartNumberMarker)
      parts = [...parts, ...rest]
    }

    if (!partNumberMarker) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      parts.sort((a, b) => a.PartNumber! - b.PartNumber!)
    }

    return parts
  }

  /**
   * Removes cached data for a given file.
   */
  private async clearCache(id: string) {
    console.log(`[${id}] removing cached data`)
    await this.cache.delete(id)
  }

  private calcOptimalPartSize(size?: number): number {
    // When upload size is not know we assume largest possible value (`maxUploadSize`)
    if (size === undefined) {
      size = this.maxUploadSize
    }

    let optimalPartSize: number

    // When upload is smaller or equal to PreferredPartSize, we upload in just one part.
    if (size <= this.preferredPartSize) {
      optimalPartSize = size
    }
    // Does the upload fit in MaxMultipartParts parts or less with PreferredPartSize.
    else if (size <= this.preferredPartSize * this.maxMultipartParts) {
      optimalPartSize = this.preferredPartSize
      // The upload is too big for the preferred size.
      // We devide the size with the max amount of parts and round it up.
    } else {
      optimalPartSize = Math.ceil(size / this.maxMultipartParts)
    }

    return optimalPartSize
  }

  /**
   * Creates a multipart upload on S3 attaching any metadata to it.
   * Also, a `${file_id}.info` file is created which holds some information
   * about the upload itself like: `upload-id`, `upload-length`, etc.
   */
  public async create(upload: Upload) {
    console.log(`[${upload.id}] initializing multipart upload`)

    const request: AWS.CreateMultipartUploadCommandInput = {
      Bucket: this.bucket,
      Key: upload.id,
      Metadata: {'tus-version': TUS_RESUMABLE},
    }

    if (upload.metadata?.contentType) {
      request.ContentType = upload.metadata.contentType
    }

    if (upload.metadata?.cacheControl) {
      request.CacheControl = upload.metadata.cacheControl
    }

    upload.creation_date = new Date().toISOString()

    const res = await this.client.createMultipartUpload(request)
    upload.storage = {type: 's3', path: res.Key as string, bucket: this.bucket}
    await this.saveMetadata(upload, res.UploadId as string)
    console.log(`[${upload.id}] multipart upload created (${res.UploadId})`)

    return upload
  }

  async read(id: string) {
    const data = await this.client.getObject({
      Bucket: this.bucket,
      Key: id,
    })

    return data.Body as Readable
  }

  /**
   * Write to the file, starting at the provided offset
   */
  public async write(src: stream.Readable, id: string, offset: number): Promise<number> {
    // Metadata request needs to happen first
    const metadata = await this.getMetadata(id)
    const parts = await this.retrieveParts(id)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const partNumber: number = parts.length > 0 ? parts[parts.length - 1].PartNumber! : 0
    const nextPartNumber = partNumber + 1

    const incompletePart = await this.downloadIncompletePart(id)
    const requestedOffset = offset

    if (incompletePart) {
      // once the file is on disk, we delete the incomplete part
      await this.deleteIncompletePart(id)

      offset = requestedOffset - incompletePart.size
      src = new MultiStream([incompletePart.createReader({cleanUpOnEnd: true}), src])
    }

    const bytesUploaded = await this.uploadParts(metadata, src, nextPartNumber, offset)

    // The size of the incomplete part should not be counted, because the
    // process of the incomplete part should be fully transparent to the user.
    const newOffset = requestedOffset + bytesUploaded - (incompletePart?.size ?? 0)

    if (metadata.file.size === newOffset) {
      try {
        const parts = await this.retrieveParts(id)
        await this.finishMultipartUpload(metadata, parts)
        await this.completeMetadata(metadata.file)
        await this.clearCache(id)
      } catch (error) {
        console.log(`[${id}] failed to finish upload`, error)
        throw error
      }
    }

    return newOffset
  }

  public async getUpload(id: string): Promise<Upload> {
    let metadata: MetadataValue

    try {
      metadata = await this.getMetadata(id)
    } catch (error) {
		console.log('getUpload: No file found.', error)
      throw ERRORS.FILE_NOT_FOUND
    }

    let offset = 0

    try {
      const parts = await this.retrieveParts(id)
      offset = calcOffsetFromParts(parts)
    } catch (error) {
      // Check if the error is caused by the upload not being found. This happens
      // when the multipart upload has already been completed or aborted. Since
      // we already found the info object, we know that the upload has been
      // completed and therefore can ensure the the offset is the size.
      // AWS S3 returns NoSuchUpload, but other implementations, such as DigitalOcean
      // Spaces, can also return NoSuchKey.
      if (error.Code === 'NoSuchUpload' || error.Code === 'NoSuchKey') {
        return new Upload({
          ...metadata.file,
          offset: metadata.file.size as number,
          size: metadata.file.size,
          metadata: metadata.file.metadata,
          storage: metadata.file.storage,
        })
      }

      console.log(error)
      throw error
    }

    const incompletePartSize = await this.getIncompletePartSize(id)

    return new Upload({
      ...metadata.file,
      offset: offset + (incompletePartSize ?? 0),
      size: metadata.file.size,
      storage: metadata.file.storage,
    })
  }

  public async declareUploadLength(file_id: string, upload_length: number) {
    const {file, 'upload-id': uploadId} = await this.getMetadata(file_id);

    if (!file) {
      throw ERRORS.FILE_NOT_FOUND
    }

    file.size = upload_length

    await this.saveMetadata(file, uploadId)
  }

  public async remove(id: string): Promise<void> {
    try {
      const {'upload-id': uploadId} = await this.getMetadata(id)

      if (uploadId) {
        await this.client.abortMultipartUpload({
          Bucket: this.bucket,
          Key: id,
          UploadId: uploadId,
        })
      }
    } catch (error) {
      if (error?.code && ['NotFound', 'NoSuchKey', 'NoSuchUpload'].includes(error.Code)) {
        console.log('remove: No file found.', error)
        throw ERRORS.FILE_NOT_FOUND
      }

      throw error
    }

    await this.client.deleteObjects({
      Bucket: this.bucket,
      Delete: {
        Objects: [{Key: id}, {Key: this.infoKey(id)}],
      },
    })

    this.clearCache(id)
  }

  protected getExpirationDate(created_at: string) {
    const date = new Date(created_at)

    return new Date(date.getTime() + this.getExpiration())
  }

  getExpiration(): number {
    return this.expirationPeriodInMilliseconds
  }

  async deleteExpired(): Promise<number> {
    if (this.getExpiration() === 0) {
      return 0
    }

    let keyMarker: string | undefined = undefined
    let uploadIdMarker: string | undefined = undefined
    let isTruncated = true
    let deleted = 0

    while (isTruncated) {
      const listResponse: AWS.ListMultipartUploadsCommandOutput =
        await this.client.listMultipartUploads({
          Bucket: this.bucket,
          KeyMarker: keyMarker,
          UploadIdMarker: uploadIdMarker,
        })

      const expiredUploads =
        listResponse.Uploads?.filter((multiPartUpload) => {
          const initiatedDate = multiPartUpload.Initiated
          return (
            initiatedDate &&
            new Date().getTime() >
              this.getExpirationDate(initiatedDate.toISOString()).getTime()
          )
        }) || []

      const objectsToDelete = expiredUploads.reduce((all, expiredUpload) => {
        all.push(
          {
            key: this.infoKey(expiredUpload.Key as string),
          },
          {
            key: this.partKey(expiredUpload.Key as string, true),
          }
        )

        return all
      }, [] as {key: string}[])

      const deletions: Promise<AWS.DeleteObjectsCommandOutput>[] = []

      // Batch delete 1000 items at a time
      while (objectsToDelete.length > 0) {
        const objects = objectsToDelete.splice(0, 1000)

        deletions.push(
          this.client.deleteObjects({
            Bucket: this.bucket,
            Delete: {
              Objects: objects.map((object) => ({
                Key: object.key,
              })),
            },
          })
        )
      }

      const [objectsDeleted] = await Promise.all([
        Promise.all(deletions),
        ...expiredUploads.map((expiredUpload) => {
          return this.client.abortMultipartUpload({
            Bucket: this.bucket,
            Key: expiredUpload.Key,
            UploadId: expiredUpload.UploadId,
          })
        }),
      ])

      deleted += objectsDeleted.reduce((all, acc) => all + (acc.Deleted?.length ?? 0), 0)

      isTruncated = Boolean(listResponse.IsTruncated)

      if (isTruncated) {
        keyMarker = listResponse.NextKeyMarker
        uploadIdMarker = listResponse.NextUploadIdMarker
      }
    }

    return deleted
  }

  private async uniqueTmpFileName(template: string): Promise<string> {
    let tries = 0
    const maxTries = 10

    while (tries < maxTries) {
      const fileName =
        template + crypto.randomBytes(10).toString('base64url').slice(0, 10)

      const filePath = path.join(os.tmpdir(), fileName)

      try {
        await fsProm.lstat(filePath)
        // If no error, file exists, so try again
        tries++
      } catch (e) {
        if (e.code === 'ENOENT') {
          // File does not exist, return the path
          return filePath
        }

        throw e // For other errors, rethrow
      }
    }

    throw new Error(`Could not find a unique file name after ${maxTries} tries`)
  }
}
