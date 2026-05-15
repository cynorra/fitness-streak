import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar />
      <main className="max-w-3xl mx-auto pt-32 pb-20 px-6">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">Kullanım Şartları</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
          <p>
            Streak-Fit platformuna hoş geldiniz. Bu hizmeti kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.
          </p>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">1. Hizmet Kullanımı</h2>
          <p>
            Streak-Fit, kişisel gelişim ve fitness takibi amaçlı bir platformdur. Kullanıcılar oluşturdukları içeriklerden kendileri sorumludur. Topluluk kurallarına aykırı, hakaret içeren veya spam amaçlı içerikler moderatörler tarafından kaldırılabilir.
          </p>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">2. Hesap Güvenliği</h2>
          <p>
            Hesap şifrenizin güvenliğinden siz sorumlusunuz. Şüpheli bir durum fark ettiğinizde lütfen bize bildirin.
          </p>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">3. Sorumluluk Sınırı</h2>
          <p>
            Sağlık ve spor faaliyetleri sırasında oluşabilecek yaralanmalardan Streak-Fit sorumlu tutulamaz. Herhangi bir egzersiz programına başlamadan önce doktorunuza danışmanız önerilir.
          </p>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-12 mb-4">4. Değişiklik Hakları</h2>
          <p>
            Streak-Fit, bu şartları dilediği zaman güncelleme hakkını saklı tutar.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
