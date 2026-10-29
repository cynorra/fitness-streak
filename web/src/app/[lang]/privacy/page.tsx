import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Locale } from "@/i18n";

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <Navbar lang={lang} />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">Gizlilik ve Çerez Politikası</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
          <p className="text-sm">Son güncelleme: 8 Eylül 2026</p>
          <p>
            DietitianFit (&quot;Uygulama&quot;, &quot;biz&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) ve Avrupa Birliği Genel Veri Koruma Tüzüğü&apos;ne (&quot;GDPR&quot;) uygun şekilde, veri sorumlusu sıfatıyla kişisel verilerinizi işliyoruz. Bu politika, DietitianFit mobil uygulamasını ve web sitesini kullandığınızda hangi verilerin toplandığını, nasıl kullanıldığını, kimlerle paylaşıldığını ve haklarınızı açıklar.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">1. Topladığımız Veriler</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Hesap verileri:</strong> e-posta adresi, kullanıcı adı, şifre (şifrelenmiş olarak saklanır).</li>
            <li><strong>Profil verileri:</strong> ad, profil fotoğrafı, rol (kullanıcı/diyetisyen) ve profilde paylaştığınız diğer bilgiler.</li>
            <li><strong>Antrenman ve beslenme verileri:</strong> antrenman kayıtları, streak (seri) geçmişi, beslenme/diyet planları, diyetisyen randevuları ve paketleri.</li>
            <li><strong>Sosyal veriler:</strong> arkadaş listesi, kudos (alkış) etkileşimleri, liderlik tablosu verileri ve uygulama içi mesajlar.</li>
            <li><strong>Konum verisi:</strong> açık hava antrenmanlarınızı (mesafe, rota, tempo) ölçmek amacıyla, izniniz dahilinde hassas konum (fine location) ve isteğe bağlı olarak arka plan konumu (background location) toplanır. Arka plan konumu yalnızca aktif bir antrenman takibi sürerken kullanılır.</li>
            <li><strong>Bildirim verisi:</strong> hatırlatma bildirimleri gönderebilmek için cihaz push-notification token&apos;ı.</li>
            <li><strong>Reklam ve cihaz tanımlayıcıları:</strong> Google AdMob aracılığıyla gösterilen reklamlar için mobil reklam kimliği (AAID/IDFA) ve cihaz/teknik veriler (işletim sistemi, uygulama sürümü).</li>
          </ul>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">2. Verilerin Kullanım Amaçları ve Hukuki Sebebi</h2>
          <p>
            Verileriniz; hesabınızı oluşturmak ve kimliğinizi doğrulamak, streak/antrenman/beslenme takibi sunmak, arkadaşlarınızla sosyal etkileşimi (kudos, liderlik tablosu, mesajlaşma) sağlamak, diyetisyen randevu ve paket hizmetlerini yürütmek, hatırlatma bildirimleri göndermek ve reklam gelirleriyle uygulamayı ücretsiz tutabilmek amacıyla işlenir. İşleme, KVKK m.5 ve GDPR m.6 uyarınca sözleşmenin ifası, açık rızanız ve meşru menfaatimiz hukuki sebeplerine dayanır.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">3. Kullanıcı İçerikleri</h2>
          <p>
            Profilinizde veya arkadaşlarınızla paylaştığınız içerikler (antrenman paylaşımları, mesajlar, profil bilgileri) kendi tercihinizle görünür kılınır. Bu içerikleri kimlerle paylaşacağınızı uygulama ayarlarından siz kontrol edersiniz; paylaşmayı tercih ettiğiniz bilgilerin görünürlüğünden siz sorumlusunuz, ancak verilerinizin güvenliğini sağlamak bizim sorumluluğumuzdadır ve bunun için sektör standardı güvenlik önlemlerini uygularız.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">4. Verilerin Paylaşıldığı Üçüncü Taraflar</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Supabase:</strong> kimlik doğrulama, veritabanı ve dosya depolama altyapımızı sağlar; verileriniz AB (Frankfurt) bölgesindeki sunucularda barındırılır.</li>
            <li><strong>Google AdMob:</strong> uygulama içi reklamları göstermek için kullanılır. Avrupa Ekonomik Alanı, İngiltere ve İsviçre&apos;deki kullanıcılara, Google&apos;ın Kullanıcı Rızası Platformu (UMP) aracılığıyla reklam rızası sorulur; kişiselleştirilmiş reklamları istediğiniz zaman uygulama içi rıza ekranından veya <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Google Reklam Ayarları</a> üzerinden yönetebilirsiniz.</li>
            <li><strong>Google Maps / konum servisleri:</strong> antrenman rotanızı haritada gösterebilmek için kullanılır.</li>
          </ul>
          <p>
            Verileriniz, yukarıdakiler dışında yalnızca yasal bir zorunluluk (mahkeme kararı, resmi makam talebi) bulunması hâlinde yetkili mercilerle paylaşılır. Verileriniz hiçbir şekilde satılmaz.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">5. Çerezler (Web Sitesi)</h2>
          <p>
            Web sitemiz oturum yönetimi için zorunlu çerezler kullanır. AdMob/AdSense üzerinden yerleştirilen üçüncü taraf çerezleri, önceki ziyaretlerinize dayalı kişiselleştirilmiş reklam sunabilir; bu çerezleri tarayıcı ayarlarınızdan veya yukarıdaki Google Reklam Ayarları sayfasından kapatabilirsiniz.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">6. Veri Saklama Süresi</h2>
          <p>
            Verileriniz, hesabınız aktif olduğu sürece ve hesap silme talebinizden itibaren en geç 30 gün içinde silinir. Yasal saklama yükümlülüğü bulunan veriler (ör. muhasebe kayıtları), ilgili mevzuatta öngörülen süre kadar saklanır.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">7. Haklarınız</h2>
          <p>
            KVKK m.11 ve GDPR uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını öğrenme, yurt içi/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini/yok edilmesini isteme ve bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme haklarına sahipsiniz. Taleplerinizi aşağıdaki iletişim adresinden bize iletebilirsiniz.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">8. Hesap ve Veri Silme</h2>
          <p>
            Hesabınızı ve tüm verilerinizi silmek için uygulama içinde <strong>Profil &gt; Hesabımı Sil</strong> adımını izleyerek veya doğrudan <a href="mailto:support@vitatribe.com" className="text-emerald-500 hover:underline">support@vitatribe.com</a> adresine e-posta göndererek talepte bulunabilirsiniz. Talebiniz alındıktan sonra tüm verileriniz en geç 30 gün içinde kalıcı olarak silinir.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">9. Çocukların Gizliliği</h2>
          <p>
            DietitianFit, 16 yaşın altındaki kişilere yönelik değildir ve bu kullanıcılardan bilerek veri toplamaz. 16 yaşından küçük bir kullanıcının verilerini topladığımızı fark edersek, bu verileri derhal sileriz.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">10. Politika Değişiklikleri</h2>
          <p>
            Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişikliklerde uygulama içi bildirim veya e-posta yoluyla sizi bilgilendiririz. Güncel sürüm her zaman bu sayfada yayınlanır.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">11. İletişim</h2>
          <p>
            Gizlilikle ilgili sorularınız, talepleriniz veya şikayetleriniz için bize <a href="mailto:support@vitatribe.com" className="text-emerald-500 hover:underline">support@vitatribe.com</a> adresinden ulaşabilirsiniz.
          </p>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
