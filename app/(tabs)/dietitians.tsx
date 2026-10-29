import { useAuth } from '../../lib/auth';
import FindDietitian from '../find-dietitian';
import DietitianClients from '../dietitian/clients';

// Dietitian hub tab: clients see the dietitian directory, dietitians see their client panel.
export default function DietitiansTab() {
  const { profile } = useAuth();
  return profile?.role === 'dietitian' ? <DietitianClients hideBack /> : <FindDietitian hideBack />;
}
