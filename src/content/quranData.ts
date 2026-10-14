/**
 * Mushaf (Hafs) sure verileri: numara, ayet sayısı, adlar, indiği yer.
 * Kaynak doğrulayıcı (`lint.ts`) ve yapısal sorular için DOĞRULUK TABANI. Toplam 6236 ayet (aşağıda assert edilir).
 * `place`: yalnızca ulemanın büyük çoğunlukla ittifak ettiği sureler işaretlenir (tartışmalılar boş bırakılır).
 */
export interface Surah {
  n: number;
  verses: number;
  tr: string;
  en: string;
  ar: string;
  place?: 'mecca' | 'medina';
}

// n, ayet, TR (Diyanet), EN, AR, yer
const RAW: [number, number, string, string, string, ('mecca' | 'medina')?][] = [
  [1, 7, 'Fâtiha', 'Al-Fatihah', 'الفاتحة', 'mecca'],
  [2, 286, 'Bakara', 'Al-Baqarah', 'البقرة', 'medina'],
  [3, 200, 'Âl-i İmrân', 'Al Imran', 'آل عمران', 'medina'],
  [4, 176, 'Nisâ', 'An-Nisa', 'النساء', 'medina'],
  [5, 120, 'Mâide', "Al-Ma'idah", 'المائدة', 'medina'],
  [6, 165, "En'âm", "Al-An'am", 'الأنعام', 'mecca'],
  [7, 206, "A'râf", "Al-A'raf", 'الأعراف', 'mecca'],
  [8, 75, 'Enfâl', 'Al-Anfal', 'الأنفال', 'medina'],
  [9, 129, 'Tevbe', 'At-Tawbah', 'التوبة', 'medina'],
  [10, 109, 'Yûnus', 'Yunus', 'يونس', 'mecca'],
  [11, 123, 'Hûd', 'Hud', 'هود', 'mecca'],
  [12, 111, 'Yûsuf', 'Yusuf', 'يوسف', 'mecca'],
  [13, 43, "Ra'd", "Ar-Ra'd", 'الرعد'],
  [14, 52, 'İbrâhîm', 'Ibrahim', 'إبراهيم', 'mecca'],
  [15, 99, 'Hicr', 'Al-Hijr', 'الحجر', 'mecca'],
  [16, 128, 'Nahl', 'An-Nahl', 'النحل', 'mecca'],
  [17, 111, 'İsrâ', 'Al-Isra', 'الإسراء', 'mecca'],
  [18, 110, 'Kehf', 'Al-Kahf', 'الكهف', 'mecca'],
  [19, 98, 'Meryem', 'Maryam', 'مريم', 'mecca'],
  [20, 135, 'Tâhâ', 'Ta-Ha', 'طه', 'mecca'],
  [21, 112, 'Enbiyâ', 'Al-Anbiya', 'الأنبياء', 'mecca'],
  [22, 78, 'Hac', 'Al-Hajj', 'الحج'],
  [23, 118, "Mü'minûn", "Al-Mu'minun", 'المؤمنون', 'mecca'],
  [24, 64, 'Nûr', 'An-Nur', 'النور', 'medina'],
  [25, 77, 'Furkân', 'Al-Furqan', 'الفرقان', 'mecca'],
  [26, 227, 'Şuarâ', "Ash-Shu'ara", 'الشعراء', 'mecca'],
  [27, 93, 'Neml', 'An-Naml', 'النمل', 'mecca'],
  [28, 88, 'Kasas', 'Al-Qasas', 'القصص', 'mecca'],
  [29, 69, 'Ankebût', 'Al-Ankabut', 'العنكبوت', 'mecca'],
  [30, 60, 'Rûm', 'Ar-Rum', 'الروم', 'mecca'],
  [31, 34, 'Lokmân', 'Luqman', 'لقمان', 'mecca'],
  [32, 30, 'Secde', 'As-Sajdah', 'السجدة', 'mecca'],
  [33, 73, 'Ahzâb', 'Al-Ahzab', 'الأحزاب', 'medina'],
  [34, 54, "Sebe'", 'Saba', 'سبأ', 'mecca'],
  [35, 45, 'Fâtır', 'Fatir', 'فاطر', 'mecca'],
  [36, 83, 'Yâsîn', 'Ya-Sin', 'يس', 'mecca'],
  [37, 182, 'Sâffât', 'As-Saffat', 'الصافات', 'mecca'],
  [38, 88, 'Sâd', 'Sad', 'ص', 'mecca'],
  [39, 75, 'Zümer', 'Az-Zumar', 'الزمر', 'mecca'],
  [40, 85, "Mü'min", 'Ghafir', 'غافر', 'mecca'],
  [41, 54, 'Fussilet', 'Fussilat', 'فصلت', 'mecca'],
  [42, 53, 'Şûrâ', 'Ash-Shura', 'الشورى', 'mecca'],
  [43, 89, 'Zuhruf', 'Az-Zukhruf', 'الزخرف', 'mecca'],
  [44, 59, 'Duhân', 'Ad-Dukhan', 'الدخان', 'mecca'],
  [45, 37, 'Câsiye', 'Al-Jathiyah', 'الجاثية', 'mecca'],
  [46, 35, 'Ahkāf', 'Al-Ahqaf', 'الأحقاف', 'mecca'],
  [47, 38, 'Muhammed', 'Muhammad', 'محمد', 'medina'],
  [48, 29, 'Fetih', 'Al-Fath', 'الفتح', 'medina'],
  [49, 18, 'Hucurât', 'Al-Hujurat', 'الحجرات', 'medina'],
  [50, 45, 'Kāf', 'Qaf', 'ق', 'mecca'],
  [51, 60, 'Zâriyât', 'Adh-Dhariyat', 'الذاريات', 'mecca'],
  [52, 49, 'Tûr', 'At-Tur', 'الطور', 'mecca'],
  [53, 62, 'Necm', 'An-Najm', 'النجم', 'mecca'],
  [54, 55, 'Kamer', 'Al-Qamar', 'القمر', 'mecca'],
  [55, 78, 'Rahmân', 'Ar-Rahman', 'الرحمن'],
  [56, 96, 'Vâkıa', "Al-Waqi'ah", 'الواقعة', 'mecca'],
  [57, 29, 'Hadîd', 'Al-Hadid', 'الحديد', 'medina'],
  [58, 22, 'Mücâdele', 'Al-Mujadila', 'المجادلة', 'medina'],
  [59, 24, 'Haşr', 'Al-Hashr', 'الحشر', 'medina'],
  [60, 13, 'Mümtehine', 'Al-Mumtahanah', 'الممتحنة', 'medina'],
  [61, 14, 'Saff', 'As-Saff', 'الصف', 'medina'],
  [62, 11, 'Cuma', "Al-Jumu'ah", 'الجمعة', 'medina'],
  [63, 11, 'Münâfikûn', 'Al-Munafiqun', 'المنافقون', 'medina'],
  [64, 18, 'Tegābün', 'At-Taghabun', 'التغابن', 'medina'],
  [65, 12, 'Talâk', 'At-Talaq', 'الطلاق', 'medina'],
  [66, 12, 'Tahrîm', 'At-Tahrim', 'التحريم', 'medina'],
  [67, 30, 'Mülk', 'Al-Mulk', 'الملك', 'mecca'],
  [68, 52, 'Kalem', 'Al-Qalam', 'القلم', 'mecca'],
  [69, 52, 'Hâkka', 'Al-Haqqah', 'الحاقة', 'mecca'],
  [70, 44, "Meâric", "Al-Ma'arij", 'المعارج', 'mecca'],
  [71, 28, 'Nûh', 'Nuh', 'نوح', 'mecca'],
  [72, 28, 'Cin', 'Al-Jinn', 'الجن', 'mecca'],
  [73, 20, 'Müzzemmil', 'Al-Muzzammil', 'المزمل', 'mecca'],
  [74, 56, 'Müddessir', 'Al-Muddaththir', 'المدثر', 'mecca'],
  [75, 40, 'Kıyâme', 'Al-Qiyamah', 'القيامة', 'mecca'],
  [76, 31, 'İnsân', 'Al-Insan', 'الإنسان'],
  [77, 50, 'Mürselât', 'Al-Mursalat', 'المرسلات', 'mecca'],
  [78, 40, "Nebe'", 'An-Naba', 'النبأ', 'mecca'],
  [79, 46, "Nâzi'ât", "An-Nazi'at", 'النازعات', 'mecca'],
  [80, 42, 'Abese', "'Abasa", 'عبس', 'mecca'],
  [81, 29, 'Tekvîr', 'At-Takwir', 'التكوير', 'mecca'],
  [82, 19, 'İnfitâr', 'Al-Infitar', 'الانفطار', 'mecca'],
  [83, 36, 'Mutaffifîn', 'Al-Mutaffifin', 'المطففين', 'mecca'],
  [84, 25, 'İnşikāk', 'Al-Inshiqaq', 'الانشقاق', 'mecca'],
  [85, 22, 'Bürûc', 'Al-Buruj', 'البروج', 'mecca'],
  [86, 17, 'Târık', 'At-Tariq', 'الطارق', 'mecca'],
  [87, 19, "A'lâ", "Al-A'la", 'الأعلى', 'mecca'],
  [88, 26, 'Gâşiye', 'Al-Ghashiyah', 'الغاشية', 'mecca'],
  [89, 30, 'Fecr', 'Al-Fajr', 'الفجر', 'mecca'],
  [90, 20, 'Beled', 'Al-Balad', 'البلد', 'mecca'],
  [91, 15, 'Şems', 'Ash-Shams', 'الشمس', 'mecca'],
  [92, 21, 'Leyl', 'Al-Layl', 'الليل', 'mecca'],
  [93, 11, 'Duhâ', 'Ad-Duha', 'الضحى', 'mecca'],
  [94, 8, 'İnşirâh', 'Ash-Sharh', 'الشرح', 'mecca'],
  [95, 8, 'Tîn', 'At-Tin', 'التين', 'mecca'],
  [96, 19, 'Alak', "Al-'Alaq", 'العلق', 'mecca'],
  [97, 5, 'Kadir', 'Al-Qadr', 'القدر'],
  [98, 8, 'Beyyine', 'Al-Bayyinah', 'البينة'],
  [99, 8, 'Zilzâl', 'Az-Zalzalah', 'الزلزلة'],
  [100, 11, 'Âdiyât', "Al-'Adiyat", 'العاديات', 'mecca'],
  [101, 11, 'Kāria', "Al-Qari'ah", 'القارعة', 'mecca'],
  [102, 8, 'Tekâsür', 'At-Takathur', 'التكاثر', 'mecca'],
  [103, 3, 'Asr', "Al-'Asr", 'العصر', 'mecca'],
  [104, 9, 'Hümeze', 'Al-Humazah', 'الهمزة', 'mecca'],
  [105, 5, 'Fîl', 'Al-Fil', 'الفيل', 'mecca'],
  [106, 4, 'Kureyş', 'Quraysh', 'قريش', 'mecca'],
  [107, 7, 'Mâûn', "Al-Ma'un", 'الماعون', 'mecca'],
  [108, 3, 'Kevser', 'Al-Kawthar', 'الكوثر', 'mecca'],
  [109, 6, 'Kâfirûn', 'Al-Kafirun', 'الكافرون', 'mecca'],
  [110, 3, 'Nasr', 'An-Nasr', 'النصر', 'medina'],
  [111, 5, 'Tebbet', 'Al-Masad', 'المسد', 'mecca'],
  [112, 4, 'İhlâs', 'Al-Ikhlas', 'الإخلاص', 'mecca'],
  [113, 5, 'Felak', 'Al-Falaq', 'الفلق', 'mecca'],
  [114, 6, 'Nâs', 'An-Nas', 'الناس', 'mecca'],
];

export const SURAHS: readonly Surah[] = RAW.map(([n, verses, tr, en, ar, place]) => ({ n, verses, tr, en, ar, place }));

if (SURAHS.length !== 114 || SURAHS.some((s, i) => s.n !== i + 1)) throw new Error('quranData: 114 sure, sıralı olmalı');
if (SURAHS.reduce((a, s) => a + s.verses, 0) !== 6236) throw new Error('quranData: ayet toplamı 6236 olmalı');

/** Karşılaştırma için sadeleştirme: harf dışını at, Arapça harekeleri sil, Türkçe/Latin işaretlileri sadeleştir. */
export function foldName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ًͯ-ٰٟ]/g, '')
    .toLocaleLowerCase('en')
    .replace(/ı/g, 'i')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}]/gu, '')
    .replace(/(sure(si)?|surat|surah|sura|سوره)$/u, '');
}

const lev = (a: string, b: string): number => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};

/** `name`, `n` numaralı surenin (herhangi bir dildeki) adına benziyor mu? */
export function nameMatches(name: string, n: number): boolean {
  const s = SURAHS[n - 1];
  const f = foldName(name.replace(/^(el|al|an|ar|as|at|az|ad|ash|adh|ath|er|en)[-\s]/i, ''));
  if (!f) return false;
  return [s.tr, s.en, s.ar].some((cand) => {
    const g = foldName(cand.replace(/^(el|al|an|ar|as|at|az|ad|ash|adh|ath|er|en)[-\s]/i, ''));
    return g === f || g.includes(f) || f.includes(g) || lev(f, g) <= 2;
  });
}
