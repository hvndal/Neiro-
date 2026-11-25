const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Skia on web (used only for previews/tests): canvaskit-wasm references Node's fs and path.
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'fs' || moduleName === 'path')) return { type: 'empty' };
  return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
