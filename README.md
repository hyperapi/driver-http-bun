# HyperAPI HTTP Driver for Bun

[![npm version](https://img.shields.io/npm/v/@hyperapi/driver-http-bun.svg)](https://www.npmjs.com/package/@hyperapi/driver-http-bun)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

HyperAPI HTTP driver for [Bun](https://bun.sh).

This driver connects your HyperAPI application to HTTP clients using Bun's built-in server capabilities, offering high-performance request handling.

## Features

- 🚀 **High Performance** - Built on Bun's ultra-fast HTTP server
- 🔄 **Content Type Support** - Handles JSON, form data, and multipart requests
- 🛡️ **Error Handling** - Seamless integration with HyperAPI error system
- 🧩 **Comprehensive Typing** - Full TypeScript support with HyperAPI Core

## Installation

```bash
bun i @hyperapi/core @hyperapi/driver-http-bun @kirick/ip
```

## Quick Start

### 1. Create your HTTP server

```typescript
import { HyperAPI } from '@hyperapi/core';
import { HyperAPIBunDriver } from '@hyperapi/driver-http-bun';

// Create a driver instance
const driver = new HyperAPIBunDriver({
  port: 3000,                        // HTTP server port
  path: '/api/',                     // Base path for API endpoints (default: '/api/')
  multipart_formdata_enabled: false  // Enable multipart/form-data parsing (default: false)
});

// Initialize HyperAPI with the driver
const hyperApiCore = new HyperAPI({
  driver,
  // Optional: custom root path for API methods (default: 'hyper-api' in project root)
  // root: path.join(import.meta.dir, 'api')
});

console.log('API server running on http://localhost:3000');
```

### 2. Create your API handlers

Example endpoint (`hyper-api/hello.[get].ts`):

```typescript
import type { HyperAPIResponse } from '@hyperapi/core';
import type { HyperAPIBunRequest } from '@hyperapi/driver-http-bun';
import * as v from 'valibot';

// Define your handler function
export default function(request: HyperAPIBunRequest): HyperAPIResponse {
  return {
    message: `Hello, ${request.args.name}!`,
    timestamp: new Date().toISOString()
  };
}

// Define input validation
export const argsValidator = v.parser(
  v.strictObject({
    name: v.string('Name is required'),
  })
);
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
export default function(request: HyperAPIBunRequest): Response {
  return new Response(
    `Hello, ${request.args.name}!`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  );
}
```

### Handling Multipart Requests

To enable `multipart/form-data` processing for file uploads:

```typescript
const driver = new HyperAPIBunDriver({
  port: 3000,
  multipart_formdata_enabled: true
});
```

Then in your handler:

```typescript
export default function(request: HyperAPIBunRequest): HyperAPIResponse {
  // request.args will contain parsed form data including files
  const file = request.args.myFile; // If a file was uploaded with name 'myFile', it will contain the Blob
  const file_contents = await file.text(); // Read file contents as text

  return { file_contents };
}
```

## Error Handling

This driver automatically translates HyperAPI errors into appropriate HTTP responses. For example:

```typescript
import { HyperAPIRateLimitError } from '@hyperapi/core';

export default function(request: HyperAPIBunRequest): HyperAPIResponse {
  // Check some condition
  if (isRateLimited(request.ip)) {
    throw new HyperAPIRateLimitError();
    // Will return HTTP 429 with JSON {"code":7,"description":"Rate limit exceeded"}
  }

  // Normal processing
  return {
    message: "Success"
  };
}
```

## TypeScript Support

For complete type safety, specify your argument types:

```typescript
export default function(
  request: HyperAPIBunRequest<{
    id: number;
    name: string;
  }>
): HyperAPIResponse {
  // request.args.id and request.args.name are now properly typed
  return {
    message: `Hello, ${request.args.name} (ID: ${request.args.id})!`
  };
}
```
