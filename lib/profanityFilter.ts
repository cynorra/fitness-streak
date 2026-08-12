/**
 * StreakFit Anti-Spam & Profanity Moderation Utility
 * Filters inappropriate content, offensive language (+18, Turkish & English profanity), and troll submissions.
 */

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

  // 1. Check Turkish bad words
  for (const word of BAD_WORDS_TR) {
    if (lowerText.includes(word)) {
      return {
        isClean: false,
        reason: 'Girdiğiniz ifadeler topluluk kurallarına (argo/küfür/+18) aykırıdır.',
      };
    }
  }

  // 2. Check English bad words
  for (const word of BAD_WORDS_EN) {
    if (lowerText.includes(word)) {
      return {
        isClean: false,
        reason: 'Girdiğiniz ifadeler topluluk kurallarına (argo/küfür/+18) aykırıdır.',
      };
    }
  }

  return { isClean: true };
}

export function checkContentModeration(text: string): ModerationResult {
  const textCheck = checkTextModeration(text);
  if (!textCheck.isClean) return textCheck;

  // Check for phone number sharing in social feed posts
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  if (phoneRegex.test(text)) {
    return {
      isClean: false,
      reason: 'Güvenliğiniz için sosyal akışta telefon numarası paylaşımı engellenmiştir.',
    };
  }

  return { isClean: true };
}
