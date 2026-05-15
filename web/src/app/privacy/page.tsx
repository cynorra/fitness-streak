import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar />
      <main className="max-w-3xl mx-auto pt-32 pb-20 px-6">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">Gizlilik Politikası</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
          <p>
            Streak-Fit olarak gizliliğinize önem veriyoruz. Bu politika, uygulamamızı kullandığınızda verilerinizin nasıl toplandığını ve kullanıldığını açıklar.
          </p>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">1. Toplanan Veriler</h2>
          <p>
            Hesap oluştururken e-posta adresiniz, kullanıcı adınız ve profil bilgileriniz (biyografi, uzmanlık vb.) toplanır. Ayrıca antrenman verileriniz (süre, tür, tarih) streak takibi için kaydedilir.
          </p>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">2. Verilerin Kullanımı</h2>
          <p>
            Toplanan veriler sadece size daha iyi bir deneyim sunmak, antrenman serilerinizi takip etmek ve topluluk özelliklerini (sosyal akış, mesajlaşma) çalıştırmak için kullanılır.
          </p>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">3. Üçüncü Taraflar</h2>
          <p>
            Verileriniz asla reklam amaçlı üçüncü taraflara satılmaz. Veritabanı ve kimlik doğrulama işlemleri için güvenli bir altyapı sağlayıcısı olan Supabase kullanılır.
          </p>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">4. İletişim</h2>
          <p>
            Gizlilikle ilgili sorularınız için bizimle iletişime geçebilirsiniz.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
