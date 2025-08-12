# Civil Memory

Short and long-term memory for your web applications.

## About

Civil Memory is a key-value store for storing smaller snippets of data and a blob/object store that supports large file storage. It can connect to a variety of backing data stores and provides a unified interface across platforms. Civil Memory is written in [TypeScript](https://www.typescriptlang.org/) and runs on [Node](https://nodejs.org/).

## Install

```sh
npm install --save @tagmein/civil-memory
```

## Build from source

- `npm run build` to build once
- `npm run build:watch` to watch TypeScript source files for changes and rebuild

## Supported backing stores

1. **`volatile`** &mdash; stores items in the Node process memory with a limit of 64Kib for key-value values and a limit of 5MiB for objects. No information is written to disk and as such it is permanently lost when the server process exits.

   >

   ```TypeScript
   const kv = civilMemoryKV.volatile()
   ```

2. **`disk`** &mdash; stores data in a file and folder structure with no size limits except for the limits of the available hard disk space on your computer.

   >

   ```TypeScript
   const kv = civilMemoryKV.disk({
    rootDir: '/path/to/storage/directory'
   })
   ```

3. **`http`** &mdash; proxies KV requests to any compatible KV HTTP server. The specification is as follows:

   >

   ```
   Read a value:
   GET <baseUrl>?key=<key>

   Delete a value:
   DELETE <baseUrl>?key=<key>

   Set a value:
   POST <baseUrl>?key=<key> with value as request body
   ```

   >

   ```TypeScript
   const kv = civilMemoryKV.http({
    baseUrl: 'https://my-domain.com/my-kv?foo=bar'
   })
   ```

4. **`cloudflare`** &mdash; [Cloudflare Workers KV](https://developers.cloudflare.com/kv) with a limit of 25MiB for key-value values and [Cloudflare R2](https://developers.cloudflare.com/r2) with a limit of 315MiB for objects. Note that this mode is only usable within a Cloudflare worker as Cloudflare Workers KV cannot be accessed externally.

   > See Cloudflare test suite from the `test/cloudflare` directory running here: https://civil-memory.pages.dev/

   >

   ```TypeScript
   // see https://developers.cloudflare.com/kv/learning/kv-bindings/
   const kv = civilMemoryKV.cloudflare({
    binding: env.MY_BINDING_NAME
   })
   ```

5. **`vercel`** &mdash; [Vercel KV](https://vercel.com/storage/kv) with a limit of 100MiB for key-value values and [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) with a limit of 500 MiB for objects.

   > See Vercel test suite from the `test/vercel` directory running here: https://civil-memory.vercel.app/

   >

   ```TypeScript
   // see https://vercel.com/docs/storage/vercel-kv/quickstart
   const kv = await civilMemoryKV.vercel({
    token: process.env.KV_REST_API_TOKEN,
    url: process.env.KV_REST_API_URL,
   })
   ```

6. **_`more`_** &mdash; to request a new backing store, open a pull request, even if there is no code, and it will be considered.

## KV Usage

The structure of keys is as follows:

```
<namepsace>#<key>
```

Both the `namespace` and the `key` should be URL-encoded to prevent unencoded `#` characters in them from interfering with the parsing of the key.

```TypeScript
import { civilMemoryKV } from '@tagmein/civil-memory'

// create a kv client - pick one from the 'Supported backing stores' section above
const kv = civilMemoryKV.<mode>(...)

// use the kv client to ...

// ... read a value
const temperature = await kv.get('temperature')
console.log({ temperature })

// ... write a value
await kv.set('temperature', '40.5')

// ... remove a value
await kv.delete('temperature')
```

### Run a Civil Memory http server kv client

```sh
node test/local/server.mjs
```

#### Example output

```
Test suite ready at http://localhost:3333

Valid values for the mode parameter:
 • disk
 • volatile

All API operations:

 • Read value at key
   GET ?mode=disk&key=urlEncodedKey

 • Delete value at key
   DELETE ?mode=disk&key=urlEncodedKey

 • Write value at key
   POST ?mode=disk&key=urlEncodedKey <body>
```

Now, to create a client that connects to the server, you can do the following:

```TypeScript
const kv = civilMemoryKV.http({
 baseUrl: 'http://localhost:3333?mode=disk&modeOptions.disk.basePath=./my-kv-store'
})
```

The Civil Memory http client allows you to use KV in environments that do not support the other modes, like edge functions, in a browser, or other environment that doesn't have a file system available.

## Objects Usage

_**Civil Memory Objects** is not yet released, check back later or contribute by opening a pull request._
