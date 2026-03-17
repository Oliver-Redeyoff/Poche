// Load environment variables
const API_URL = process.env.API_URL || 'http://localhost:3000';
const REVENUECAT_IOS_KEY = process.env.REVENUECAT_IOS_KEY || '';
const ADMOB_BANNER_IOS = process.env.ADMOB_BANNER_IOS ?? 'ca-app-pub-9487705441504419/3789657720';
const ADMOB_BANNER_ANDROID = process.env.ADMOB_BANNER_ANDROID ?? 'ca-app-pub-3940256099942544/6300978111';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: API_URL,
    revenueCatIosKey: REVENUECAT_IOS_KEY,
    admobBannerIos: ADMOB_BANNER_IOS,
    admobBannerAndroid: ADMOB_BANNER_ANDROID,
  },
});

