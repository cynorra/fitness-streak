/**
 * Clinical Nutrition BMR & TDEE Calculator
 * Formula: Mifflin-St Jeor (Gold Standard for Dietitians)
 */

export interface BMRParams {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_weight' | 'build_muscle';
}

export interface NutritionTargetResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };
}

export const calculateBMR = (params: BMRParams): number => {
  const { weightKg, heightCm, ageYears, gender } = params;
  if (gender === 'male') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161);
  }
};

export const calculateTDEE = (bmr: number, activityLevel: BMRParams['activityLevel']): number => {
  const multipliers: Record<BMRParams['activityLevel'], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

export const calculateNutritionTargets = (params: BMRParams): NutritionTargetResult => {
  const bmr = calculateBMR(params);
  const tdee = calculateTDEE(bmr, params.activityLevel);

  let targetCalories = tdee;
  if (params.goal === 'lose_weight') {
    targetCalories = Math.max(1200, tdee - 500);
  } else if (params.goal === 'gain_weight' || params.goal === 'build_muscle') {
    targetCalories = tdee + 400;
  }

  // Macro Distribution Ratio based on goal
  let proteinPct = 0.3; // 30%
  let carbsPct = 0.45; // 45%
  let fatPct = 0.25; // 25%

  if (params.goal === 'build_muscle') {
    proteinPct = 0.35;
    carbsPct = 0.45;
    fatPct = 0.2;
  } else if (params.goal === 'lose_weight') {
    proteinPct = 0.35;
    carbsPct = 0.35;
    fatPct = 0.3;
  }

  const proteinGrams = Math.round((targetCalories * proteinPct) / 4);
  const carbsGrams = Math.round((targetCalories * carbsPct) / 4);
  const fatGrams = Math.round((targetCalories * fatPct) / 9);

  return {
    bmr,
    tdee,
    targetCalories,
    macros: {
      proteinGrams,
      carbsGrams,
      fatGrams,
      proteinPct: Math.round(proteinPct * 100),
      carbsPct: Math.round(carbsPct * 100),
      fatPct: Math.round(fatPct * 100),
    },
  };
};

export const MEAL_TEMPLATES = [
  {
    name: '🔥 Sporcu Yüksek Protein Planı',
    desc: 'Kas kazanımı ve yağ yakımı için optimize edilmiş yüksek proteinli diyet.',
    meals: [
      {
        meal_type: 'breakfast',
        day_of_week: 1,
        content: '3 adet yumurta (2 tam, 1 beyaz) omlet, 50g lor peyniri, 50g yulaf ezmesi, 1 avuç ceviz.',
        calories: '550',
      },
      {
        meal_type: 'lunch',
        day_of_week: 1,
        content: '200g ızgara tavuk göğsü, 150g haşlanmış esmer pirinç, bol yeşillikli zeytinyağlı salata.',
        calories: '650',
      },
      {
        meal_type: 'snack',
        day_of_week: 1,
        content: '1 ölçek whey protein / 200g süzme yoğurt, 1 adet muz, 10 adet badem.',
        calories: '300',
      },
      {
        meal_type: 'dinner',
        day_of_week: 1,
        content: '200g ızgara somon veya bonfile, fırınlanmış tatlı patates (150g), buğulama brokolı.',
        calories: '600',
      },
    ],
  },
  {
    name: '🥑 Ketojenik & Düşük Karbonhidrat',
    desc: 'Hızlı yağ yakımı ve kan şekeri dengesi için sağlıklı yağ ağırlıklı beslenme.',
    meals: [
      {
        meal_type: 'breakfast',
        day_of_week: 1,
        content: '3 adet mantarlı çedar peynirli yumurta, yarım avokado, 5 adet zeytin, taze roka.',
        calories: '520',
      },
      {
        meal_type: 'lunch',
        day_of_week: 1,
        content: '180g zeytinyağlı ızgara köfte, bol cevizli ve tulum peynirli avokadolu salata.',
        calories: '680',
      },
      {
        meal_type: 'snack',
        day_of_week: 1,
        content: '15 adet kabak çekirdeği, 1 fincan sade filtre kahve (MCT yağı eklenmiş).',
        calories: '200',
      },
      {
        meal_type: 'dinner',
        day_of_week: 1,
        content: '200g fırında levrek veya somon, tereyağında sote kuşkonmaz ve karnabahar püresi.',
        calories: '580',
      },
    ],
  },
  {
    name: '🌱 Akdeniz Tipi Dengeli Diyet',
    desc: 'Uzun ömürlü sağlıklı yaşam, lif ve antioksidan zengini klasik Akdeniz beslenmesi.',
    meals: [
      {
        meal_type: 'breakfast',
        day_of_week: 1,
        content: '2 dilim tam buğday ekmeği, 60g beyaz peynir, domates, salatalık, zeytinyağlı kekikli zeytin.',
        calories: '420',
      },
      {
        meal_type: 'lunch',
        day_of_week: 1,
        content: '1 tabak zeytinyağlı taze fasulye / mercimek yemeği, 1 kase bulgur pilavı, 1 kase cacık.',
        calories: '520',
      },
      {
        meal_type: 'snack',
        day_of_week: 1,
        content: '1 adet yeşil elma, 2 adet tam ceviz içi, 1 fincan yeşil çay.',
        calories: '180',
      },
      {
        meal_type: 'dinner',
        day_of_week: 1,
        content: '150g ızgara balık veya tavuk, bol limonlu mevsim salatası, 1 dilim siyez ekmeği.',
        calories: '480',
      },
    ],
  },
];
