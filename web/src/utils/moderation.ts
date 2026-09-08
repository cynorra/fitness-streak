const BAD_WORDS_TR = [
  'amk', 'aq', 'amq', 'orospu', 'piç', 'sik', 'sikerim', 'sikiş', 'göt',
  'yarrak', 'yarak', 'ibne', 'kahpe', 'puşt', 'dalyarak', 'amcık', 'yarram',
  'sikik', 'siktir', 'orospu çocuğu', 'götveren', 'taşak', 'tasak', 'yavşak',
];

const BAD_WORDS_EN = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'bastard',
  'nigger', 'faggot', 'whore', 'slut', 'cock', 'motherfucker',
];

export interface ModerationResult {
  isClean: boolean;
  reason?: string;
}

export function checkTextModeration(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { isClean: false, reason: 'İçerik boş olamaz.' };
  }

  const lowerText = text.toLowerCase();

  for (const word of [...BAD_WORDS_TR, ...BAD_WORDS_EN]) {
    if (lowerText.includes(word)) {
      return {
        isClean: false,
        reason: 'Girdiğiniz ifadeler topluluk kurallarına (argo/küfür/+18) aykırıdır.',
      };
    }
  }

  return { isClean: true };
}
