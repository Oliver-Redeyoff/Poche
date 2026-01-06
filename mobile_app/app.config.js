// Load environment variables
const API_URL = process.env.API_URL || 'http://localhost:3000';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: API_URL,
  },
});

