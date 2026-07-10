import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/playwright';
import { createRsbuild } from '@rsbuild/core';
import { pluginBasicSsl } from '../../dist';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should print HTTPS server URLs when custom output path', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [
        pluginBasicSsl({
          outputPath: join(__dirname, 'dist'),
        }),
      ],
      server: {
        port: 3200,
      },
    },
  });

  const { server, urls } = await rsbuild.startDevServer();

  await new Promise((resolve) => {
    rsbuild.onDevCompileDone(resolve);
  });

  expect(urls.every((url) => url.startsWith('https'))).toBeTruthy();

  await server.close();
});
