const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '../shared');

const config = getDefaultConfig(projectRoot);

// Watch the shared folder for changes
config.watchFolders = [sharedRoot];

// Ensure Metro can resolve modules from the shared folder
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(sharedRoot, 'node_modules'),
];

// Add shared folder to extra node modules
config.resolver.extraNodeModules = {
  '@poche/shared': sharedRoot,
};

module.exports = config;

