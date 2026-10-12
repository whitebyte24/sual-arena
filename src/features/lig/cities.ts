/** İftar vakti için seçilebilir şehirler (koordinat yaklaşık; konum izni gerekmez). Adlar her dilde. */
export interface City {
  id: string;
  lat: number;
  lon: number;
  name: { tr: string; ar: string; en: string };
}

const c = (id: string, lat: number, lon: number, tr: string, ar: string, en: string): City => ({ id, lat, lon, name: { tr, ar, en } });

export const CITIES: readonly City[] = [
  // Türkiye
  c('istanbul', 41.01, 28.98, 'İstanbul', 'إسطنبول', 'Istanbul'),
  c('ankara', 39.93, 32.86, 'Ankara', 'أنقرة', 'Ankara'),
  c('izmir', 38.42, 27.14, 'İzmir', 'إزمير', 'Izmir'),
  c('bursa', 40.19, 29.06, 'Bursa', 'بورصة', 'Bursa'),
  c('antalya', 36.9, 30.69, 'Antalya', 'أنطاليا', 'Antalya'),
  c('adana', 37.0, 35.32, 'Adana', 'أضنة', 'Adana'),
  c('konya', 37.87, 32.48, 'Konya', 'قونية', 'Konya'),
  c('gaziantep', 37.07, 37.38, 'Gaziantep', 'غازي عنتاب', 'Gaziantep'),
  c('sanliurfa', 37.16, 38.79, 'Şanlıurfa', 'شانلي أورفا', 'Şanlıurfa'),
  c('kayseri', 38.73, 35.49, 'Kayseri', 'قيصري', 'Kayseri'),
  c('diyarbakir', 37.91, 40.24, 'Diyarbakır', 'ديار بكر', 'Diyarbakır'),
  c('samsun', 41.29, 36.33, 'Samsun', 'سامسون', 'Samsun'),
  c('trabzon', 41.0, 39.72, 'Trabzon', 'طرابزون', 'Trabzon'),
  c('erzurum', 39.9, 41.27, 'Erzurum', 'أرضروم', 'Erzurum'),
  c('van', 38.49, 43.38, 'Van', 'وان', 'Van'),
  c('eskisehir', 39.78, 30.52, 'Eskişehir', 'إسكيشهير', 'Eskişehir'),
  c('mersin', 36.8, 34.64, 'Mersin', 'مرسين', 'Mersin'),
  c('kocaeli', 40.77, 29.94, 'Kocaeli', 'قوجه إيلي', 'Kocaeli'),
  c('malatya', 38.35, 38.31, 'Malatya', 'ملاطية', 'Malatya'),
  c('hatay', 36.2, 36.16, 'Hatay', 'هاتاي', 'Hatay'),
  c('mardin', 37.31, 40.74, 'Mardin', 'ماردين', 'Mardin'),
  c('sakarya', 40.69, 30.4, 'Sakarya', 'صقاريا', 'Sakarya'),
  c('denizli', 37.78, 29.09, 'Denizli', 'دنيزلي', 'Denizli'),
  c('manisa', 38.61, 27.43, 'Manisa', 'مانيسا', 'Manisa'),
  c('balikesir', 39.65, 27.89, 'Balıkesir', 'باليكسير', 'Balıkesir'),
  c('tekirdag', 40.98, 27.51, 'Tekirdağ', 'تكيرداغ', 'Tekirdağ'),
  c('edirne', 41.68, 26.56, 'Edirne', 'أدرنة', 'Edirne'),
  c('kars', 40.6, 43.1, 'Kars', 'قارص', 'Kars'),
  // Dünya
  c('mecca', 21.42, 39.83, 'Mekke', 'مكة المكرمة', 'Mecca'),
  c('medina', 24.47, 39.61, 'Medine', 'المدينة المنورة', 'Medina'),
  c('jerusalem', 31.77, 35.23, 'Kudüs', 'القدس', 'Jerusalem'),
  c('riyadh', 24.71, 46.68, 'Riyad', 'الرياض', 'Riyadh'),
  c('cairo', 30.04, 31.24, 'Kahire', 'القاهرة', 'Cairo'),
  c('dubai', 25.2, 55.27, 'Dubai', 'دبي', 'Dubai'),
  c('amman', 31.95, 35.93, 'Amman', 'عمّان', 'Amman'),
  c('baghdad', 33.31, 44.37, 'Bağdat', 'بغداد', 'Baghdad'),
  c('damascus', 33.51, 36.28, 'Şam', 'دمشق', 'Damascus'),
  c('beirut', 33.89, 35.5, 'Beyrut', 'بيروت', 'Beirut'),
  c('kuwait', 29.38, 47.99, 'Kuveyt', 'الكويت', 'Kuwait City'),
  c('doha', 25.29, 51.53, 'Doha', 'الدوحة', 'Doha'),
  c('tunis', 36.81, 10.18, 'Tunus', 'تونس', 'Tunis'),
  c('casablanca', 33.57, -7.59, 'Kazablanka', 'الدار البيضاء', 'Casablanca'),
  c('algiers', 36.75, 3.06, 'Cezayir', 'الجزائر', 'Algiers'),
  c('jakarta', -6.21, 106.85, 'Cakarta', 'جاكرتا', 'Jakarta'),
  c('kualalumpur', 3.14, 101.69, 'Kuala Lumpur', 'كوالالمبور', 'Kuala Lumpur'),
  c('karachi', 24.86, 67.01, 'Karaçi', 'كراتشي', 'Karachi'),
  c('baku', 40.41, 49.87, 'Bakü', 'باكو', 'Baku'),
  c('sarajevo', 43.86, 18.41, 'Saraybosna', 'سراييفو', 'Sarajevo'),
  c('berlin', 52.52, 13.4, 'Berlin', 'برلين', 'Berlin'),
  c('paris', 48.86, 2.35, 'Paris', 'باريس', 'Paris'),
  c('london', 51.51, -0.13, 'Londra', 'لندن', 'London'),
  c('amsterdam', 52.37, 4.9, 'Amsterdam', 'أمستردام', 'Amsterdam'),
  c('newyork', 40.71, -74.01, 'New York', 'نيويورك', 'New York'),
];

export const cityById = (id: string | undefined): City | undefined => CITIES.find((x) => x.id === id);

const TZ_TO_CITY: Record<string, string> = {
  'Europe/Istanbul': 'istanbul',
  'Asia/Riyadh': 'riyadh',
  'Asia/Dubai': 'dubai',
  'Africa/Cairo': 'cairo',
  'Asia/Amman': 'amman',
  'Asia/Baghdad': 'baghdad',
  'Asia/Damascus': 'damascus',
  'Asia/Beirut': 'beirut',
  'Asia/Kuwait': 'kuwait',
  'Asia/Qatar': 'doha',
  'Africa/Tunis': 'tunis',
  'Africa/Casablanca': 'casablanca',
  'Africa/Algiers': 'algiers',
  'Asia/Jakarta': 'jakarta',
  'Asia/Kuala_Lumpur': 'kualalumpur',
  'Asia/Karachi': 'karachi',
  'Asia/Baku': 'baku',
  'Europe/Sarajevo': 'sarajevo',
  'Europe/Berlin': 'berlin',
  'Europe/Paris': 'paris',
  'Europe/London': 'london',
  'Europe/Amsterdam': 'amsterdam',
  'America/New_York': 'newyork',
  'Asia/Jerusalem': 'jerusalem',
};

/** Cihaz saat diliminden ve arayüz dilinden makul bir varsayılan şehir. */
export function guessCityId(timeZone: string | undefined, lang: 'tr' | 'ar' | 'en'): string {
  const byTz = timeZone ? TZ_TO_CITY[timeZone] : undefined;
  if (byTz) return byTz;
  return lang === 'tr' ? 'istanbul' : lang === 'ar' ? 'mecca' : 'london';
}
