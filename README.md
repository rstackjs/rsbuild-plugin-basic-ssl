# @rsbuild/plugin-basic-ssl

Generate an untrusted, self-signed certificate for the HTTPS server.

The Basic SSL plugin will automatically generate a self-signed certificate and set the [server.https](https://rsbuild.rs/config/server/https) option. When you visit the page, your browser will indicate that the certificate is not trusted. You can access the HTTPS page after manually confirming this.

<p>
  <a href="https://npmjs.com/package/@rsbuild/plugin-basic-ssl">
   <img src="https://img.shields.io/npm/v/@rsbuild/plugin-basic-ssl?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
</p>

## Usage

Install:

```bash
npm add @rsbuild/plugin-basic-ssl -D
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginBasicSsl } from "@rsbuild/plugin-basic-ssl";

export default {
  plugins: [pluginBasicSsl()],
};
```

Then visit the https URL of the page, and confirm in your browser.

## Options

### filename

Filename of the generated certificate.

- **Type:** `string`
- **Default:** `'fake-cert.pem'`
- **Example:**

```ts
pluginBasicSsl({
  filename: "foo.pem",
});
```

### outputPath

Output path of the generated certificate.

- **Type:** `string`
- **Default:** `__dirname`
- **Example:**

```ts
import path from "node:path";

pluginBasicSsl({
  outputPath: path.join(__dirname, "node_modules/.cache/cert"),
});
```

### selfsignedAttrs

Attributes passing to `selfsigned`, see [selfsigned](https://github.com/jfromaniello/selfsigned) for details.

- **Type:** `CertificateField[]`
- **Default:**

```ts
const defaultAttrs = [{ name: "commonName", value: "localhost" }];
```

- **Example:**

```ts
pluginBasicSsl({
  selfsignedAttrs: [{ name: "commonName", value: "example.com" }],
});
```

### selfsignedOptions

Options passing to `selfsigned`, see [selfsigned - Options](https://github.com/jfromaniello/selfsigned?tab=readme-ov-file#options) for details.

- **Type:** `SelfsignedOptions`
- **Default:**

```ts
const defaultOptions = {
  days: 30,
  keySize: 2048,
};
```

- **Example:**

```ts
pluginBasicSsl({
  selfsignedOptions: {
    days: 100,
  },
});
```

## License

[MIT](./LICENSE).
