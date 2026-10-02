import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface LocalizationStrings {
  titleSuffix: string;
  planTitleLabel: string;
  dateLabel: string;
  mealsHeading: string;
  noMeals: string;
  calorieLabel: string;
  footerNotice: string;
  mealTypes: Record<string, string>;
}

const PDF_LOCALIZATIONS: Record<string, LocalizationStrings> = {
  tr: {
    titleSuffix: 'Beslenme Planı',
    planTitleLabel: 'Plan Adı:',
    dateLabel: 'Tarih:',
    mealsHeading: 'Öğünler',
    noMeals: 'Öğün bulunmuyor.',
    calorieLabel: 'Kalori:',
    footerNotice: 'Bu plan StreakFit uygulaması üzerinden otomatik oluşturulmuştur.',
    mealTypes: {
      breakfast: 'Kahvaltı 🍳',
      lunch: 'Öğle Yemeği 🥗',
      dinner: 'Akşam Yemeği 🥩',
      snack: 'Ara Öğün 🍎',
    },
  },
  en: {
    titleSuffix: 'Nutrition Plan',
    planTitleLabel: 'Plan Title:',
    dateLabel: 'Date:',
    mealsHeading: 'Meals',
    noMeals: 'No meals specified.',
    calorieLabel: 'Calories:',
    footerNotice: 'This plan was generated automatically via StreakFit App.',
    mealTypes: {
      breakfast: 'Breakfast 🍳',
      lunch: 'Lunch 🥗',
      dinner: 'Dinner 🥩',
      snack: 'Snack 🍎',
    },
  },
  de: {
    titleSuffix: 'Ernährungsplan',
    planTitleLabel: 'Titel des Plans:',
    dateLabel: 'Datum:',
    mealsHeading: 'Mahlzeiten',
    noMeals: 'Keine Mahlzeiten angegeben.',
    calorieLabel: 'Kalorien:',
    footerNotice: 'Dieser Plan wurde automatisch über die StreakFit-App erstellt.',
    mealTypes: {
      breakfast: 'Frühstück 🍳',
      lunch: 'Mittagessen 🥗',
      dinner: 'Abendessen 🥩',
      snack: 'Snack 🍎',
    },
  },
  es: {
    titleSuffix: 'Plan de Nutrición',
    planTitleLabel: 'Título del Plan:',
    dateLabel: 'Fecha:',
    mealsHeading: 'Comidas',
    noMeals: 'No hay comidas especificadas.',
    calorieLabel: 'Calorías:',
    footerNotice: 'Este plan fue generado automáticamente a través de StreakFit App.',
    mealTypes: {
      breakfast: 'Desayuno 🍳',
      lunch: 'Almuerzo 🥗',
      dinner: 'Cena 🥩',
      snack: 'Merienda 🍎',
    },
  },
};

export const exportNutritionPlanToPDF = async (
  plan: any,
  meals: any[],
  clientName: string,
  langCode: string = 'tr'
) => {
  const loc = PDF_LOCALIZATIONS[langCode] || PDF_LOCALIZATIONS.tr;

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica', sans-serif; color: #1e293b; padding: 24px; background-color: #ffffff; }
          .header { text-align: center; margin-bottom: 24px; }
          h1 { color: #10b981; margin-bottom: 4px; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .meta { font-size: 14px; color: #64748b; margin-bottom: 20px; background-color: #f8fafc; padding: 12px; borderRadius: 8px; }
          h2 { color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 6px; font-size: 18px; margin-top: 24px; }
          .meal-card { background-color: #f1f5f9; padding: 16px; margin-bottom: 12px; border-radius: 12px; border-left: 5px solid #10b981; }
          .meal-title { font-weight: bold; font-size: 15px; margin-bottom: 6px; text-transform: uppercase; color: #059669; }
          .meal-content { margin: 8px 0; font-size: 14px; color: #334155; line-height: 1.5; }
          .macros { font-size: 12px; color: #64748b; font-weight: bold; margin-top: 8px; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${clientName} - ${loc.titleSuffix}</h1>
        </div>
        
        <div class="meta">
          <p style="margin: 4px 0;"><strong>${loc.planTitleLabel}</strong> ${plan.title || 'StreakFit Plan'}</p>
          <p style="margin: 4px 0;"><strong>${loc.dateLabel}</strong> ${plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '-'}</p>
        </div>
        
        <h2>${loc.mealsHeading}</h2>
        ${meals.length === 0 ? `<p>${loc.noMeals}</p>` : ''}
        ${meals
          .map(
            (meal) => `
          <div class="meal-card">
            <div class="meal-title">${
              loc.mealTypes[meal.meal_type] || meal.meal_type
            } (${langCode === 'tr' ? 'Gün' : 'Day'}: ${meal.day_of_week || '1'})</div>
            <div class="meal-content">${(meal.content || '').replace(/\n/g, '<br/>')}</div>
            <div class="macros">
              ⚡ ${loc.calorieLabel} ${meal.calories || 0} kcal
            </div>
          </div>
        `
          )
          .join('')}
        
        <div class="footer">
          <p>${loc.footerNotice}</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      alert(langCode === 'tr' ? 'PDF paylaşımı bu cihazda desteklenmiyor.' : 'PDF sharing is not supported on this device.');
    }
  } catch (error) {
    console.error('PDF Export Hatası:', error);
    alert(langCode === 'tr' ? 'PDF oluşturulurken bir hata oluştu.' : 'An error occurred while creating the PDF.');
  }
};
