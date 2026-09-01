// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';

define.app(async () => {
  const { pluginBasicSsl } = await import('../dist/index.js');

  return {
    plugins: [pluginBasicSsl()],
  };
});
