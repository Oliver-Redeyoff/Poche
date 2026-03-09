// Load environment variables
const API_URL = process.env.API_URL || 'http://localhost:3000';
const REVENUECAT_IOS_KEY = process.env.REVENUECAT_IOS_KEY || '';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: API_URL,
    revenueCatIosKey: REVENUECAT_IOS_KEY,
  },
});

