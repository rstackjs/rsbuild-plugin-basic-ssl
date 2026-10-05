import { X509Certificate } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ServerConfig } from '@rsbuild/core';
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

function isCertValid(content: string) {
  try {
    const { validTo } = new X509Certificate(content);
    return new Date(validTo).getTime() > Date.now();
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
    algorithm: 'sha256',
    keySize: 2048,
    notAfterDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...options.selfsignedOptions,
  };

  if (fs.existsSync(certPath)) {
    const content = await fs.promises.readFile(certPath, {
      encoding: 'utf-8',
    });

    // Reuse the cached certificate until it expires
    if (isCertValid(content)) {
      return {
        key: content,
        cert: content,
      };
    }
  }

  const { default: selfsigned } = await import('selfsigned');
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
