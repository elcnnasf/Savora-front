// Sentry's wrapper extends Expo's default config with source-map upload hooks
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

module.exports = config;
