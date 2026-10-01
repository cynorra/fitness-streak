import { login } from './login';
import { onboarding } from './onboarding';
import { friends } from './friends';
import { workoutTypes } from './workoutTypes';
import { workouts } from './workouts';
import { feed2 } from './feed2';
import { home } from './home';
import { profile2 } from './profile2';
import { log } from './log';
import { history } from './history';
import { challenges } from './challenges';
import { leaderboard } from './leaderboard';
import { measurements } from './measurements';
import { analytics } from './analytics';
import { appointments } from './appointments';
import { sessionNotes } from './sessionNotes';
import { messages } from './messages';
import { chat } from './chat';
import { workoutPlayer } from './workoutPlayer';
import { nutritionLog } from './nutritionLog';
import { notifSettings } from './notifSettings';
import { store } from './store';
import { tracker } from './tracker';
import { tabs } from './tabs';
import { ad } from './ad';
import { water } from './water';
import { fasting } from './fasting';
import { blog } from './blog';
import { gyms } from './gyms';
import { clients } from './clients';
import { packages } from './packages';
import { plan } from './plan';
import { streakNumber } from './streakNumber';
import { net } from './net';
import { dietitianCare } from './dietitianCare';

const modules: Record<string, { tr: Record<string, string>; en: Record<string, string> }> = { dietitianCare, net, streakNumber, plan, packages, clients, gyms, blog, fasting, water, ad, tabs, tracker, store, notifSettings, nutritionLog, workoutPlayer, chat, messages, sessionNotes, appointments, analytics, measurements, leaderboard, challenges, history, log, workoutTypes, profile2, home, feed2, workouts, friends, login, onboarding };

type Locale = 'tr' | 'en';
const build = (l: Locale) =>
  Object.fromEntries(Object.entries(modules).map(([k, v]) => [k, v[l]])) as Record<string, any>;

export const screenStrings = { tr: build('tr'), en: build('en') };
