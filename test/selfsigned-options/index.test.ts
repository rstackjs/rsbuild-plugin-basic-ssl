import { X509Certificate } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/playwright';
import { createRsbuild } from '@rsbuild/core';
import { pluginBasicSsl } from '../../dist';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should apply a custom certificate expiration date', async ({
  onTestFinished,
}) => {
  const outputPath = await mkdtemp(join(tmpdir(), 'rsbuild-basic-ssl-'));
  const notAfterDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  // X.509 certificate timestamps have second precision.
  notAfterDate.setMilliseconds(0);
  onTestFinished(() => rm(outputPath, { recursive: true, force: true }));

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [
        pluginBasicSsl({
          outputPath,
          selfsignedOptions: {
            notAfterDate,
          },
        }),
      ],
      server: {
        port: 3300,
      },
    },
  });

  const { server, urls } = await rsbuild.startDevServer();
  onTestFinished(() => server.close());

  await new Promise((resolve) => {
    rsbuild.onDevCompileDone(resolve);
  });

  expect(urls.every((url) => url.startsWith('https'))).toBeTruthy();

  const content = await readFile(join(outputPath, 'fake-cert.pem'), 'utf-8');
  const certificate = new X509Certificate(content);
  expect(new Date(certificate.validTo).getTime()).toBe(notAfterDate.getTime());
});
