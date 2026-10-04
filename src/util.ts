import { X509Certificate, createPrivateKey } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ServerConfig } from '@rsbuild/core';
import selfsigned from 'selfsigned';
import type { PluginBasicSslOptions } from './index.js';

type HttpsConfig = ServerConfig['https'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureDir(dir: string) {
  try {
    await fs.promises.access(dir);
  } catch {
    await ensureDir(path.dirname(dir));
    await fs.promises.mkdir(dir);
  }
}

function isCertValid(content: string, passphrase?: string) {
  try {
    const cert = new X509Certificate(content);
    const privateKey = createPrivateKey({ key: content, passphrase });
    const now = Date.now();
    return (
      new Date(cert.validFrom).getTime() <= now &&
      new Date(cert.validTo).getTime() > now &&
      cert.checkPrivateKey(privateKey)
    );
  } catch {
    return false;
  }
}

export const resolveHttpsConfig = async (
  config: HttpsConfig,
  options: PluginBasicSslOptions,
): Promise<{
  key: NonNullable<HttpsConfig>['key'];
  cert: NonNullable<HttpsConfig>['cert'];
}> => {
  const { key, cert } = config ?? {};

  if (key && cert) {
    return { key, cert };
  }

  const certPath = path.join(
    options.outputPath ?? __dirname,
    options.filename ?? 'fake-cert.pem',
  );

  const selfsignedOptions = {
    keySize: 2048,
    notAfterDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...options.selfsignedOptions,
  };

  if (fs.existsSync(certPath)) {
    const content = await fs.promises.readFile(certPath, {
      encoding: 'utf-8',
    });

    // Reuse only a currently valid certificate with a matching private key.
    if (
      isCertValid(
        content,
        config?.passphrase ?? options.selfsignedOptions?.passphrase,
      )
    ) {
      return {
        key: content,
        cert: content,
      };
    }
  }

  const pem = await selfsigned.generate(
    options.selfsignedAttrs ?? [{ name: 'commonName', value: 'localhost' }],
    selfsignedOptions,
  );

  const content = pem.private + pem.cert;

  if (options.outputPath) {
    await ensureDir(options.outputPath);
  }

  await fs.promises.writeFile(certPath, content, { encoding: 'utf-8' });

  return {
    key: content,
    cert: content,
  };
};
