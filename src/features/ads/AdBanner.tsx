import { useEffect, useState } from 'react';
import { usePremium } from '@/features/premium/entitlement';
import { getRemoteConfig } from '@/lib/remoteConfig';
import { BannerView } from './BannerView';
import { useAdsStatus } from './index';
import { DEFAULT_ADS_CONFIG, bannerAllowed, type AdsConfig, type BannerSurface } from './policy';

/** Yalnızca ana menü ve sonuç ekranları (`BannerSurface`). Soru/düello/Söyleme! tur ekranlarına KOYMA. */
export function AdBanner({ surface }: { surface: BannerSurface }) {
  const premium = usePremium();
  const { ready, personalized } = useAdsStatus();
  const [cfg, setCfg] = useState<AdsConfig>(DEFAULT_ADS_CONFIG);

  useEffect(() => {
    getRemoteConfig().then((r) => setCfg(r.ads));
  }, []);

  if (!ready || !bannerAllowed(surface, cfg, premium)) return null;
  return <BannerView personalized={personalized} />;
}
