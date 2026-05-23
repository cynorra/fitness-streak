import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">Gizlilik ve Çerez Politikası</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
          <p>
            VitaTribe ("Uygulama") olarak gizliliğinize önem veriyoruz ancak dijital ortamda sıfır riskin mümkün olmadığını hatırlatırız. Bu politika, uygulamamızı kullandığınızda verilerinizin nasıl toplandığını açıklar.
          </p>
          
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">1. Toplanan Veriler ve Kullanımı</h2>
          <p>
            Platformu kullanırken oluşturduğunuz profil bilgileri, antrenman verileri, özel mesajlar ve diğer her türlü kullanıcı içeriği kendi rızanızla sunulmaktadır. VitaTribe, kullanıcılar arası mesajlaşmalarda veya profillerde paylaşılan verilerin güvenliği, doğruluğu veya sızdırılması konusunda hiçbir yasal veya maddi sorumluluk kabul etmez. Tüm sorumluluk kullanıcıya aittir.
          </p>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">2. Çerezler (Cookies) ve Üçüncü Taraf Reklam Politikası (Google AdMob / AdSense)</h2>
          <p>
            Uygulamamız, hizmetlerimizi sunmak ve analiz etmek amacıyla çeşitli çerezler (cookies) kullanmaktadır. Ayrıca, uygulamamızda Google AdMob ve Google AdSense gibi üçüncü taraf reklam ağları kullanılmaktadır. 
            Bu üçüncü taraf sağlayıcılar (Google dahil), önceki ziyaretlerinize veya internet üzerindeki diğer sitelere yaptığınız ziyaretlere dayalı olarak kişiselleştirilmiş reklamlar sunmak için tarayıcı çerezlerinizi ve mobil reklam kimliklerinizi (IDFA, AAID vb.) kullanabilir.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Google'ın reklam çerezlerini kullanması, Google ve iş ortaklarının (third-party vendors) sitemize veya internetteki diğer sitelere yaptığınız ziyaretleri temel alarak size özel reklamlar (personalized ads) göstermesine olanak tanır.</li>
            <li>Kullanıcılar, <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Google Reklam Ayarları</a> sayfasını ziyaret ederek kişiselleştirilmiş reklamcılığı devre dışı bırakabilirler.</li>
            <li>Üçüncü taraf reklam ağlarının cihazınızda topladığı veriler ve kullanım şekli tamamen bu firmaların kendi gizlilik politikalarına tabidir. VitaTribe, üçüncü taraf reklam ağlarının veri işleme pratiklerinden dolayı hiçbir sorumluluk kabul etmez.</li>
          </ul>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">3. Yasal Zorunluluklar</h2>
          <p>
            VitaTribe, yasal bir zorunluluk (mahkeme kararları vb.) doğması halinde kullanıcı verilerini kolluk kuvvetleri ile paylaşma hakkını saklı tutar. Uygulamayı kullanan herkes, verilerinin bu şartlar altında işlenmesini ve üçüncü taraf reklam ağlarıyla (Google dahil) anonim olarak paylaşılmasını peşinen kabul etmiş sayılır.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
