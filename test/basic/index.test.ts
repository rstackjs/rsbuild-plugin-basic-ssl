import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { pluginBasicSsl } from '../../dist';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should print HTTPS server URLs', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginBasicSsl()],
    },
  });

  const { server, urls } = await rsbuild.startDevServer();

  await new Promise((resolve) => {
    rsbuild.onDevCompileDone(resolve);
  });

  expect(urls.every((url) => url.startsWith('https'))).toBeTruthy();

  await server.close();
});
