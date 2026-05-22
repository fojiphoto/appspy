import { LucideIcon, Construction } from 'lucide-react';

interface Props {
  icon?: LucideIcon;
  title: string;
  description: string;
  color?: string;
}

export default function ComingSoon({ icon: Icon = Construction, title, description, color = 'text-purple-400' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 bg-gray-800/60 border border-gray-700/60 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className={color} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">{description}</p>
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-4 py-2 rounded-full">
        <Construction size={12} />
        Coming Soon — In Development
      </div>
    </div>
  );
}
