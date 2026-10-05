import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { SelfsignedOptions, generate } from 'selfsigned';
import { resolveHttpsConfig } from './util.js';

export const PLUGIN_BASIC_SSL_NAME = 'rsbuild:basic-ssl';

export type PluginBasicSslOptions = {
  /**
   * Filename of the generated certificate
   * @default 'fake-cert.pem'
   */
  filename?: string;
  /**
   * Output path of the generated certificate
   * @default '<project>/node_modules/.cache/basic-ssl'
   */
  outputPath?: string;
  /**
   * Attributes passing to `selfsigned`.
   */
  selfsignedAttrs?: Parameters<typeof generate>[0];
  /**
   * Options passing to `selfsigned`.
   */
  selfsignedOptions?: SelfsignedOptions;
};

export const pluginBasicSsl = (
  options: PluginBasicSslOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_BASIC_SSL_NAME,
  setup(api) {
    api.modifyRsbuildConfig(async (config) => {
      const httpsConfig = await resolveHttpsConfig(config.server?.https, {
        ...options,
        outputPath:
          options.outputPath ?? path.join(api.context.cachePath, 'basic-ssl'),
      });

      config.server = {
        ...config.server,
        https: {
          ...config.server?.https,
          ...httpsConfig,
        },
      };
    });
  },
});
