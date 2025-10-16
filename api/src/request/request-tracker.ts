import http from 'http';
import https from 'https';
import dns from 'dns';

interface TrackerOptions {
  verbose?: boolean;
  logToConsole?: boolean;
}

interface RequestInfo {
  protocol: string;
  method: string;
  host: string;
  port: number;
  path: string;
  timestamp: string;
  startTime: number;
  headers: Record<string, string | string[] | undefined>;
  statusCode?: number;
  duration?: number;
  responseHeaders?: http.IncomingHttpHeaders;
  error?: string;
}

interface DnsInfo {
  type: 'dns';
  hostname: string;
  address: string | null;
  duration: number;
  timestamp: string;
  error: string | null;
}

interface RequestSummary {
  total: number;
  http: number;
  https: number;
  dns?: number;
  errors: number;
  avgDuration: number;
  hosts: string[];
}

type TrackedRequest = RequestInfo | DnsInfo;

class RequestTracker {
  // TODO
  // - investigate https://github.com/mswjs/interceptors/tree/main
  // - track websockets

  private requests: TrackedRequest[] = [];
  private verbose: boolean;
  private logToConsole: boolean;
  private originalHttpRequest: typeof http.request;
  private originalHttpsRequest: typeof https.request;
  private originalDnsLookup: typeof dns.lookup;

  constructor(options: TrackerOptions = {}) {
    this.verbose = options.verbose !== false;
    this.logToConsole = options.logToConsole !== false;
    this.originalHttpRequest = http.request;
    this.originalHttpsRequest = https.request;
    this.originalDnsLookup = dns.lookup;
  }

  start(): void {

    // Track HTTP requests
    const originalHttpRequest = http.request

    http.request = ((...args: Parameters<typeof originalHttpRequest>): http.ClientRequest => {
      const req = originalHttpRequest(...args);
      this._trackRequest('http', args, req);
      return req;
    }) as typeof http.request;


    // Track HTTPS requests
    const originalHttpsRequest = https.request

    https.request = ((...args: Parameters<typeof originalHttpsRequest>): http.ClientRequest => {
      const req = originalHttpsRequest(...args);
      this._trackRequest('https', args, req);
      return req;
    }) as typeof https.request;


    // Track DNS lookups
    // const originalDnsLookup = dns.lookup

    // dns.lookup = ((
    //   hostname: string,
    //   options: any,
    //   callback?: any
    // ): void => {
    //   const startTime = Date.now();

    //   if (typeof options === 'function') {
    //     callback = options;
    //     options = {};
    //   }

    //   this._logDnsLookup(hostname);

    //   return originalDnsLookup(
    //     hostname,
    //     // options,
    //     (err: NodeJS.ErrnoException | null, address: string, family: number) => {
    //       const duration = Date.now() - startTime;
    //       this._recordDns(hostname, address, duration, err);
    //       if (callback) callback(err, address, family);
    //     }
    //   );
    // }) as typeof dns.lookup;

    if (this.logToConsole) {
      console.log('🔍 Request tracker started');
    }
  }

  stop(): void {
    http.request = this.originalHttpRequest;
    https.request = this.originalHttpsRequest;
    dns.lookup = this.originalDnsLookup;

    if (this.logToConsole) {
      console.log('🛑 Request tracker stopped');
    }
  }

  private _trackRequest(protocol: string, args: any[], req: http.ClientRequest): void {
    const options = this._parseRequestArgs(args);
    const startTime = Date.now();

    const requestInfo: RequestInfo = {
      protocol,
      method: options.method || 'GET',
      host: options.hostname || options.host || 'localhost',
      port: options.port || (protocol === 'https' ? 443 : 80),
      path: options.path || '/',
      timestamp: new Date().toISOString(),
      startTime,
      headers: options.headers || {}
    };

    if (this.verbose && this.logToConsole) {
      console.log(`\n📡 ${requestInfo.method} ${protocol}://${requestInfo.host}:${requestInfo.port}${requestInfo.path}`);
    }

    req.on('response', (res: http.IncomingMessage) => {
      const duration = Date.now() - startTime;
      requestInfo.statusCode = res.statusCode!;
      requestInfo.duration = duration;
      requestInfo.responseHeaders = res.headers;

      if (this.verbose && this.logToConsole) {
        console.log(`✅ Response: ${res.statusCode} (${duration}ms)`);
      }

      this.requests.push(requestInfo);
    });

    req.on('error', (err: Error) => {
      const duration = Date.now() - startTime;
      requestInfo.error = err.message;
      requestInfo.duration = duration;

      if (this.verbose && this.logToConsole) {
        console.log(`❌ Error: ${err.message} (${duration}ms)`);
      }

      this.requests.push(requestInfo);
    });
  }

  private _parseRequestArgs(args: any[]): any {
    if (typeof args[0] === 'string') {
      const url = new URL(args[0]);
      return {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: args[1]?.method || 'GET',
        headers: args[1]?.headers || {}
      };
    }

    return args[0] || {};
  }

  // private _logDnsLookup(hostname: string): void {
  //   if (this.verbose && this.logToConsole) {
  //     console.log(`\n🔎 DNS Lookup: ${hostname}`);
  //   }
  // }

  // private _recordDns(
  //   hostname: string,
  //   address: string | null,
  //   duration: number,
  //   err: NodeJS.ErrnoException | null
  // ): void {
  //   const dnsInfo: DnsInfo = {
  //     type: 'dns',
  //     hostname,
  //     address,
  //     duration,
  //     timestamp: new Date().toISOString(),
  //     error: err ? err.message : null
  //   };

  //   if (this.verbose && this.logToConsole) {
  //     if (err) {
  //       console.log(`❌ DNS Error: ${err.message}`);
  //     } else {
  //       console.log(`✅ Resolved: ${address} (${duration}ms)`);
  //     }
  //   }

  //   this.requests.push(dnsInfo);
  // }

  getRequests(): TrackedRequest[] {
    return this.requests;
  }

  getSummary(): RequestSummary {
    const httpRequests = this.requests.filter((r): r is RequestInfo => 'protocol' in r);
    // @ ts-expect-error odd error for type guard
    // const dnsLookups = this.requests.filter((r): r is DnsInfo => r.type === 'dns');

    return {
      total: this.requests.length,
      http: httpRequests.filter(r => r.protocol === 'http').length,
      https: httpRequests.filter(r => r.protocol === 'https').length,
      // dns: dnsLookups.length,
      errors: this.requests.filter(r => 'error' in r && r.error).length,
      avgDuration: this._calculateAvgDuration(httpRequests),
      hosts: [...new Set(httpRequests.map(r => r.host))]
    };
  }

  private _calculateAvgDuration(requests: RequestInfo[]): number {
    const durations = requests.filter(r => r.duration).map(r => r.duration!);
    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  printSummary(): void {
    const summary = this.getSummary();
    console.log('\n📊 Request Summary:');
    console.log(`   Total requests: ${summary.total}`);
    console.log(`   HTTP: ${summary.http} | HTTPS: ${summary.https} | DNS: ${summary.dns}`);
    console.log(`   Errors: ${summary.errors}`);
    console.log(`   Avg duration: ${summary.avgDuration}ms`);
    console.log(`   Unique hosts: ${summary.hosts.join(', ')}`);
  }

  clear(): void {
    this.requests = [];
  }
}

export default RequestTracker;
export type { TrackerOptions, RequestInfo, DnsInfo, RequestSummary, TrackedRequest };

// Example usage:
// import RequestTracker from './request-tracker.js';
// import https from 'https';
//
// const tracker = new RequestTracker({ verbose: true });
// tracker.start();
//
// https.get('https://api.github.com/users/github', (res) => {
//   res.on('data', () => {});
//   res.on('end', () => {
//     tracker.printSummary();
//     tracker.stop();
//   });
// });