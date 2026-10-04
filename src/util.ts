import { X509Certificate } from 'node:crypto';
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

  const commonName =
    options.selfsignedAttrs?.find(
      (attr) => attr.name === 'commonName' || attr.shortName === 'CN',
    )?.value ?? 'localhost';
  const selfsignedOptions = {
    keySize: 2048,
    notAfterDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...options.selfsignedOptions,
  };

  if (commonName === 'localhost' && !selfsignedOptions.extensions?.length) {
    selfsignedOptions.extensions = [
      { name: 'basicConstraints', cA: false, critical: true },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
        critical: true,
      },
      { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
          { type: 7, ip: '::1' },
        ],
      },
    ];
  }

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
