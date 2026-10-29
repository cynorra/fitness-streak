/**
 * DietitianFit Anti-Spam & Profanity Moderation Utility
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

let moderationLocale = 'tr';
export function setModerationLocale(locale: string) {
  moderationLocale = locale === 'tr' ? 'tr' : 'en';
}

const MESSAGES = {
  tr: {
    empty: 'İçerik boş olamaz.',
    profanity: 'Girdiğiniz ifadeler topluluk kurallarına (argo/küfür/+18) aykırıdır.',
    phone: 'Güvenliğiniz için sosyal akışta telefon numarası paylaşımı engellenmiştir.',
  },
  en: {
    empty: 'Content cannot be empty.',
    profanity: 'Your text violates the community guidelines (profanity/explicit content).',
    phone: 'For your safety, sharing phone numbers in the social feed is not allowed.',
  },
};
const msg = (k: 'empty' | 'profanity' | 'phone') => MESSAGES[moderationLocale as 'tr' | 'en'][k];

export interface ModerationResult {
  isClean: boolean;
  reason?: string;
}

export function checkTextModeration(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { isClean: false, reason: msg('empty') };
  }

  const lowerText = text.toLowerCase();

  // 1. Check Turkish bad words
  for (const word of BAD_WORDS_TR) {
    if (lowerText.includes(word)) {
      return {
        isClean: false,
        reason: msg('profanity'),
      };
    }
  }

  // 2. Check English bad words
  for (const word of BAD_WORDS_EN) {
    if (lowerText.includes(word)) {
      return {
        isClean: false,
        reason: msg('profanity'),
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
      reason: msg('phone'),
    };
  }

  return { isClean: true };
}
