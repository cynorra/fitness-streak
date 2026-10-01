import { Redirect } from 'expo-router';

// Google OAuth dönüş adresi (vitatribe://auth-callback). Oturum login.tsx içinde kurulur;
// router bu adrese düşerse ana yönlendirmeye geri atılır.
export default function AuthCallback() {
  return <Redirect href="/" />;
}
