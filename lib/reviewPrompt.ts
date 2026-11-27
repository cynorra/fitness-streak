import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const STORAGE_KEY = 'app_review_prompt_state_v1';
const PACKAGE_ID = 'com.vitatribe.fitness.spor.diyet.diyetisyen';
const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PACKAGE_ID}`;
const MIN_LAUNCHES = 3;
const MAX_PROMPTS = 2;
const COOLDOWN_MS = 21 * 24 * 60 * 60 * 1000;

interface ReviewState {
  launchCount: number;
  hasRated: boolean;
  neverAsk: boolean;
  promptCount: number;
  lastPromptAt: number;
}

const DEFAULT_STATE: ReviewState = {
  launchCount: 0,
  hasRated: false,
  neverAsk: false,
  promptCount: 0,
  lastPromptAt: 0,
};

async function loadState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function saveState(state: ReviewState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export async function recordLaunchAndShouldPrompt(): Promise<boolean> {
  const state = await loadState();
  state.launchCount += 1;
  await saveState(state);

  if (state.hasRated || state.neverAsk) return false;
  if (state.launchCount < MIN_LAUNCHES) return false;
  if (state.promptCount >= MAX_PROMPTS) return false;
  if (state.lastPromptAt > 0 && Date.now() - state.lastPromptAt < COOLDOWN_MS) {
    return false;
  }
  return true;
}

export async function markAppRated(): Promise<void> {
  const state = await loadState();
  state.hasRated = true;
  state.lastPromptAt = Date.now();
  await saveState(state);
}

export async function markReviewDismissed(): Promise<void> {
  const state = await loadState();
  state.promptCount += 1;
  state.lastPromptAt = Date.now();
  await saveState(state);
}

export async function markReviewNeverAsk(): Promise<void> {
  const state = await loadState();
  state.neverAsk = true;
  state.lastPromptAt = Date.now();
  await saveState(state);
}

export async function openPlayStoreReview(): Promise<void> {
  await markAppRated();
  Linking.openURL(`market://details?id=${PACKAGE_ID}`).catch(() => {
    Linking.openURL(PLAY_STORE_WEB_URL).catch(() => {});
  });
}
