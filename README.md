# HyperAPI HTTP Driver for Bun

[![npm version](https://img.shields.io/npm/v/@hyperapi/driver-http-bun.svg)](https://www.npmjs.com/package/@hyperapi/driver-http-bun)
[![license](https://img.shields.io/npm/l/@hyperapi/driver-bun.svg?color=blue)](https://github.com/hyperapi/driver-http-bun/blob/main/LICENSE)

HyperAPI HTTP driver for [Bun](https://bun.sh).

This driver connects your HyperAPI application to HTTP clients using Bun's built-in server capabilities, offering high-performance request handling.

## Features

- 🚀 **High Performance** - Built on Bun's ultra-fast HTTP server
- 🔄 **Content Type Support** - Handles JSON, form data, and multipart requests
- 🛡️ **Error Handling** - Seamless integration with HyperAPI error system
- 🧩 **Comprehensive Typing** - Full TypeScript support with HyperAPI Core

## Installation

```bash
bun i @hyperapi/core @hyperapi/driver-bun @kirick/ip
```

## Quick Start

### 1. Create your HTTP server

```typescript
import { HyperAPI } from '@hyperapi/core';
import { HyperAPIBunDriver } from '@hyperapi/driver-bun';

// Create a driver instance
const driver = new HyperAPIBunDriver({
  port: 3000,                        // HTTP server port
  path: '/api/',                     // Base path for API endpoints (default: '/api/')
  multipart_formdata_enabled: false  // Enable multipart/form-data parsing (default: false)
});

// Initialize HyperAPI with the driver
const hyperApiCore = new HyperAPI(
  driver,
  // Optional: custom root path for API methods (default: 'hyper-api' in project root)
  // path.join(import.meta.dir, 'api')
);

console.log('API server running on http://localhost:3000');
```

### 2. Create your API handlers

Example endpoint (`hyper-api/hello.get.ts`):

```typescript
import { HyperAPIInvalidParametersError } from '@hyper-api/core';
import * as v from 'valibot';
import { hyperApi } from '../main.js';

// Define your validation library
export function valibot<S extends v.BaseSchema<any, any, any>>(schema: S) {
  return (request: HyperAPIRequest) => {
    const result = v.safeParse(schema, request.args);
    if (result.success) {
      return { args: result.data };
    }
    throw new HyperAPIInvalidParametersError();
  };
}

// Define your API method code
export default hyperApi.module()
  .use(valibot(
    v.object({ name: v.string() }),
  ))
  .action((request) => {
    return {
      message: `Hello, ${request.args.name}!`,
      timestamp: new Date().toISOString()
    };
  });
```

## Request Properties

The `HyperAPIBunRequest` interface extends the base `HyperAPIRequest` from [HyperAPI Core](https://github.com/hyperapi/core) and adds HTTP-specific properties:

```typescript
interface HyperAPIBunRequest<A extends Record<string, unknown>> extends HyperAPIRequest<A> {
  url: URL;         // Full URL object of the request
  headers: Headers; // HTTP headers
  ip: IP;           // Client IP address (using @kirick/ip)
}
```

## Advanced Usage

### Returning HTTP Responses

You can return a standard Response object for complete control over HTTP responses:

```typescript
// ...
export default hyperApi.module()
  .use(valibot(
    v.object({ name: v.string() }),
  ))
  .action((request) => new Response(
    `Hello, ${request.args.name}!`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  ));
```

### Handling Multipart Requests

To enable `multipart/form-data` processing for file uploads, enable it in the driver configuration:

```typescript
const driver = new HyperAPIBunDriver({
  port: 3000,
  multipart_formdata_enabled: true
});
```

Then in your handler:

```typescript
// ...
export default hyperApi.module()
  .use(valibot(
    v.object({ file: v.file() }),
  ))
  .action(async (request) => {
    const contents = await request.args.file.text();
    return { file_contents };
  });
```

## Error Handling

This driver automatically translates HyperAPI errors into appropriate HTTP responses. For example:

```typescript
import { HyperAPIRateLimitError } from '@hyperapi/core';
// ...

export default hyperApi.module()
  .action(async (request) => {
    if (isRateLimited(request.ip)) {
      throw new HyperAPIRateLimitError();
      // Will return HTTP 429 with JSON {"code":7,"description":"Rate limit exceeded"}
    }
    return { ok: true };
  });
```

## Contributing

Issues and pull requests are welcome at [our GitHub repository](https://github.com/hyperapi/driver-http-bun).
