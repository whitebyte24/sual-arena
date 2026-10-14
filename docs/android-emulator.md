# Android emülatör ile çalıştırma (Windows) — notlar

Durum (2026-10-13): dev build derlendi ve `Pixel_7` emülatörüne kuruldu; ana ekran, Hesap (dil değişimi) ve Günlük Soru ekranı açıldı. Gerisi (düello, Söyleme!, Arapça/RTL, Premium, Lig) **henüz Android'de denenmedi**.

## Komutlar
```bash
# 1) Emülatör (4 GB RAM şart; AVD varsayılanı 2 GB → ANR "System UI isn't responding")
emulator -avd Pixel_7 -no-snapshot -memory 4096 -cores 4 -gpu host
# 2) Dev içerik (npm install/expo install ÜRETİM içeriği yazar → 0 soru!)
npm run content:build:dev
# 3) Derleme: expo run:android Windows'ta belleği taşırdı; paralelliği kıs
cd android && ./gradlew.bat app:assembleDebug -x lint -x test --no-parallel --max-workers=3 -PreactNativeArchitectures=x86_64
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
# 4) Metro + uygulama
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client --port 8081 --clear
adb shell am start -a android.intent.action.VIEW -d "sualarena://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.sualarena.app
```
Rota deep link'leri: `sualarena:///hesap`, `/gunluk`, `/soyleme`, `/lig`, `/premium` (dev-client "Tools" düğmesi Hesap simgesinin üstüne bindiği için).

## Bulunanlar / yapılanlar
- **Derleme hatası (düzeltildi):** `react-native-google-mobile-ads` 17.2.0 `app-json.gradle:53` yanlış özellik adı atıyor; kök `app.json`'da kütüphane anahtarı yoksa Gradle düşüyor (EAS build'i de etkilerdi). Çözüm: `app.json` köküne `"react-native-google-mobile-ads": { "optimize_initialization": true, ... }` (Expo "Ignoring extra key" uyarısı verir, zararsız).
- `expo-system-ui` kuruldu (Android `userInterfaceStyle` uyarısı için). `/android` ve `/ios` `.gitignore`'a eklendi (prebuild çıktısı).
- C++ derlemesi "disk belleği dosyası çok küçük" ile düşüyordu → `--no-parallel --max-workers=3` ile geçti (~4 dk, önbellekli).
- **Açık:** Metro önbelleği yeni üretilen `src/content/generated/*.json` dosyasını almadı → Günlük Soru "yeterli soru yok" gösterdi (içerik prod/boş derlenmişti). Yarın: Metro'yu `--clear` ile (önceki Metro süreci 8081'i tutmuyorsa) başlat, dev içeriği doğrula, yeniden dene.
- **Ürün riski:** cihaz dili İngilizce ise (veya uygulama dili EN) soru yok; içerik yalnız TR+AR. EN arayüzde ya TR içeriğe düşmeli ya da EN içerik üretilmeli (karar bekliyor).
- Doğrulanmadı: gerçek AdMob/RevenueCat davranışı (test kimlikleri), Android bildirimleri, geri tuşu, klavye/inset davranışı.
