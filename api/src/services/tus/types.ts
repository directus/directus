import type http from 'node:http'

import type {Locker, Upload} from '@tus/utils'

/**
 * Represents the configuration options for a server.
 */
export type ServerOptions = {
  /**
   * The route to accept requests.
   */
  path: string

  /**
   * Max file size allowed when uploading
   */
  maxSize?:
    | number
    | ((req: http.IncomingMessage, uploadId: string | null) => Promise<number> | number)

  /**
   * Return a relative URL as the `Location` header.
   */
  relativeLocation?: boolean

  /**
   * Allow `Forwarded`, `X-Forwarded-Proto`, and `X-Forwarded-Host` headers
   * to override the `Location` header returned by the server.
   */
  respectForwardedHeaders?: boolean

  /**
   * Additional headers sent in `Access-Control-Allow-Headers`.
   */
  allowedHeaders?: string[]

  /**
   * Interval in milliseconds for sending progress of an upload over `EVENTS.POST_RECEIVE_V2`
   */
  postReceiveInterval?: number

  /**
   * Control how the upload URL is generated.
   * @param req - The incoming HTTP request.
   * @param options - Options for generating the URL.
   */
  generateUrl?: (
    req: http.IncomingMessage,
    options: {proto: string; host: string; path: string; id: string}
  ) => string

  /**
   * Control how the Upload-ID is extracted from the request.
   * @param req - The incoming HTTP request.
   */
  getFileIdFromRequest?: (req: http.IncomingMessage, lastPath?: string) => string | void

  /**
   * Control how you want to name files.
   * It is important to make these unique to prevent data loss.
   * Only use it if you really need to.
   * Default uses `crypto.randomBytes(16).toString('hex')`.
   * @param req - The incoming HTTP request.
   */
  namingFunction?: (
    req: http.IncomingMessage,
    metadata?: Record<string, string | null>
  ) => string | Promise<string>

  /**
   * The Lock interface defines methods for implementing a locking mechanism.
   * It is primarily used to ensure exclusive access to resources, such as uploads and their metadata.
   */
  locker:
    | Locker
    | Promise<Locker>
    | ((req: http.IncomingMessage) => Locker | Promise<Locker>)

  /**
   * This timeout controls how long the server will wait a cancelled lock to do its cleanup.
   */
  lockDrainTimeout?: number

  /**
   * Disallow termination for finished uploads.
   */
  disableTerminationForFinishedUploads?: boolean

  /**
   * `onUploadCreate` will be invoked before a new upload is created.
   * If the function returns the (modified) response, the upload will be created.
   * If an error is thrown, the HTTP request will be aborted, and the provided `body` and `status_code`
   * (or their fallbacks) will be sent to the client. This can be used to implement validation of upload
   * metadata or add headers.
   * @param req - The incoming HTTP request.
   * @param res - The HTTP response.
   * @param upload - The Upload object.
   */
  onUploadCreate?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    upload: Upload
  ) => Promise<
    // TODO: change in the next major
    http.ServerResponse | {res: http.ServerResponse; metadata?: Upload['metadata']}
  >

  /**
   * `onUploadFinish` will be invoked after an upload is completed but before a response is returned to the client.
   * You can optionally return `status_code`, `headers` and `body` to modify the response.
   * Note that the tus specification does not allow sending response body nor status code other than 204, but most clients support it.
   * If an error is thrown, the HTTP request will be aborted, and the provided `body` and `status_code`
   * (or their fallbacks) will be sent to the client. This can be used to implement post-processing validation.
   * @param req - The incoming HTTP request.
   * @param res - The HTTP response.
   * @param upload - The Upload object.
   */
  onUploadFinish?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    upload: Upload
  ) => Promise<
    // TODO: change in the next major
    | http.ServerResponse
    | {
        res: http.ServerResponse
        status_code?: number
        headers?: Record<string, string | number>
        body?: string
      }
  >

  /**
   * `onIncomingRequest` will be invoked when an incoming request is received.
   * @param req - The incoming HTTP request.
   * @param res - The HTTP response.
   * @param uploadId - The ID of the upload.
   */
  onIncomingRequest?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    uploadId: string
  ) => Promise<void>

  /**
   * `onResponseError` will be invoked when an error response is about to be sent by the server.
   * Use this function to map custom errors to tus errors or for custom observability.
   * @param req - The incoming HTTP request.
   * @param res - The HTTP response.
   * @param err - The error object or response.
   */
  onResponseError?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    err: Error | {status_code: number; body: string}
  ) =>
    | Promise<{status_code: number; body: string} | void>
    | {status_code: number; body: string}
    | void
}

export type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void

export type WithOptional<T, K extends keyof T> = Omit<T, K> & {[P in K]+?: T[P]}

export type WithRequired<T, K extends keyof T> = T & {[P in K]-?: T[P]}
