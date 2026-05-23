import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">Kullanım Şartları ve Sorumluluk Reddi (KVKK)</h1>
        
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-6 rounded-2xl mb-8">
          <h2 className="text-rose-600 dark:text-rose-400 font-black text-xl mb-2">ÖNEMLİ UYARI: SIFIR SORUMLULUK PRENSİBİ</h2>
          <p className="text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
            VitaTribe uygulamasını kullanarak tüm hukuki, maddi ve manevi sorumluluğu kendi üzerinize aldığınızı peşinen kabul edersiniz. VitaTribe, kullanıcılar, içerikler, sağlık tavsiyeleri veya herhangi bir veri kaybı konusunda KESİNLİKLE hiçbir sorumluluk kabul etmez.
          </p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
         
          <div className="space-y-8">
            <section>
               <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-4">1. İçerik ve Kullanıcı Sorumluluğu</h2>
               <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
               VitaTribe, kişisel gelişim ve fitness takibi amaçlı sosyal bir platformdur. Kullanıcılar oluşturdukları tüm içeriklerden (mesajlar, gönderiler, fotoğraflar, profil bilgileri) YÜZDE YÜZ kendileri sorumludur. Platform üzerinden paylaşılan hakaret, telif hakkı ihlali, yanıltıcı bilgi veya yasadışı içerikler nedeniyle doğabilecek her türlü cezai ve hukuki yükümlülük doğrudan içeriği paylaşan kullanıcıya aittir. VitaTribe bu durumlardan dolayı taraf gösterilemez, sorumlu tutulamaz.
               </p>
            </section>

            <section>
               <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-4">2. Sağlık, Diyet ve Sakatlık Beyanı</h2>
               <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
               Uygulama içerisinde diyetisyenler, koçlar veya diğer kullanıcılar tarafından verilen tavsiyeler tamamen "bilgi" amaçlıdır. Hiçbir tavsiye tıbbi bir teşhis veya tedavi yerine geçmez. Sağlık ve spor faaliyetleri sırasında oluşabilecek sakatlıklardan, hastalık veya sağlık sorunlarından VitaTribe (veya VitaTribe geliştiricileri) KESİNLİKLE sorumlu tutulamaz. Herhangi bir diyet programına veya egzersize başlamadan önce mutlaka uzman bir tıp doktoruna danışmanız zorunludur. Tüm risk size aittir.
               </p>
            </section>

            <section>
               <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-4">3. Veri Güvenliği ve Reklam (AdMob) Kullanımı</h2>
               <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
               Uygulama, Google AdMob ve AdSense dahil olmak üzere çeşitli reklam ve analiz araçları kullanır. Kullanıcı, uygulamanın çerezleri (cookies) ve mobil reklam kimliklerini kullanmasına açıkça onay verir. Olası veri sızıntıları, teknik arızalar veya üçüncü taraf servislerin neden olduğu kesintilerden VitaTribe sorumlu tutulamaz.
               </p>
            </section>

            <section>
               <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-4">4. Şartların Değiştirilmesi</h2>
               <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
               VitaTribe, bu şartları önceden haber vermeksizin dilediği zaman güncelleme hakkını saklı tutar. Uygulamaya giriş yapan her kullanıcı, güncel şartları kayıtsız şartsız kabul etmiş sayılır. Eğer bu şartları kabul etmiyorsanız, uygulamayı ve platformu kullanmayı derhal bırakmalısınız.
               </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
