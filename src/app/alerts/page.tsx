import ComingSoon from '@/components/ComingSoon';
import { Bell } from 'lucide-react';
export default function AlertsPage() {
  return <ComingSoon icon={Bell} title="Alerts" description="Set up custom alerts for rank changes, rating drops, competitor updates, and new app releases." color="text-yellow-400" />;
}
