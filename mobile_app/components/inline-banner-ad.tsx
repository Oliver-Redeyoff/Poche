import { Platform } from 'react-native'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'
import Constants from 'expo-constants'

const adUnitId = __DEV__
  ? TestIds.BANNER
  : (Platform.OS === 'ios'
      ? Constants.expoConfig?.extra?.admobBannerIos
      : Constants.expoConfig?.extra?.admobBannerAndroid)

export function InlineBannerAd() {
  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  )
}
