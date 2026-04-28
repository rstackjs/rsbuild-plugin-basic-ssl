import { defineConfig } from '@rsbuild/core';
import { pluginBasicSsl } from '../src';

export default defineConfig({
  plugins: [pluginBasicSsl()],
});
