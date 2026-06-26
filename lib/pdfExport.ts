import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const exportNutritionPlanToPDF = async (plan: any, meals: any[], clientName: string) => {
  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica', sans-serif; color: #333; padding: 20px; }
          h1 { color: #10b981; text-align: center; }
          h2 { color: #555; border-bottom: 2px solid #10b981; padding-bottom: 5px; }
          .meal-card { background-color: #f9f9f9; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #10b981; }
          .meal-title { font-weight: bold; font-size: 16px; margin-bottom: 5px; text-transform: uppercase; color: #10b981; }
          .meal-content { margin: 10px 0; }
          .macros { font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <h1>${clientName} - Beslenme Planı</h1>
        <p><strong>Plan Adı:</strong> ${plan.title || 'İsimsiz Plan'}</p>
        <p><strong>Tarih:</strong> ${plan.start_date || '-'} / ${plan.end_date || '-'}</p>
        
        <h2>Öğünler</h2>
        ${meals.length === 0 ? '<p>Öğün bulunmuyor.</p>' : ''}
        ${meals.map(meal => `
          <div class="meal-card">
            <div class="meal-title">${
              meal.meal_type === 'breakfast' ? 'Kahvaltı' : 
              meal.meal_type === 'lunch' ? 'Öğle Yemeği' : 
              meal.meal_type === 'dinner' ? 'Akşam Yemeği' : 'Ara Öğün'
            } (Gün: ${meal.day_of_week || 'Her Gün'})</div>
            <div class="meal-content">${meal.content.replace(/\n/g, '<br/>')}</div>
            <div class="macros">
              Kalori: ${meal.calories || 0} kcal | 
              Makrolar: ${JSON.stringify(meal.macros || {})}
            </div>
          </div>
        `).join('')}
        
        <br/><hr/>
        <p style="text-align: center; font-size: 12px; color: #aaa;">Bu plan VitaTribe uygulaması üzerinden otomatik oluşturulmuştur.</p>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      alert('Paylaşım bu cihazda desteklenmiyor.');
    }
  } catch (error) {
    console.error('PDF Export Hatası:', error);
    alert('PDF oluşturulurken bir hata oluştu.');
  }
};
