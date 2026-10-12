import { View } from 'react-native';
import { AD_UNITS } from './ids';
import { adsLib } from './adapter.native';

export function BannerView({ personalized }: { personalized: boolean }) {
  const L = adsLib();
  if (!L || !AD_UNITS.banner) return null;
  return (
    <View style={{ alignItems: 'center' }}>
      <L.BannerAd
        unitId={AD_UNITS.banner}
        size={L.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: !personalized }}
      />
    </View>
  );
}
