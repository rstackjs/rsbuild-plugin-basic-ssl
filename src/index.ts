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
   * @default __dirname
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
      const httpsConfig = await resolveHttpsConfig(
        config.server?.https,
        options,
      );

      config.server = {
        ...config.server,
        https: httpsConfig,
      };
    });
  },
});
