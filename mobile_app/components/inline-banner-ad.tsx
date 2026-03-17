import { Platform, View } from 'react-native'
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'
import Constants from 'expo-constants'

const adUnitId = __DEV__
  ? TestIds.BANNER
  : (Platform.OS === 'ios'
      ? Constants.expoConfig?.extra?.admobBannerIos
      : Constants.expoConfig?.extra?.admobBannerAndroid)

export function InlineBannerAd() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  )
}
