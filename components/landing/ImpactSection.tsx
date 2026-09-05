import React from 'react';
import { Users2, Building, ThumbsUp, Clock } from 'lucide-react';

export const ImpactSection: React.FC = () => {
  const impacts = [
    {
      icon: <Users2 className="w-6 h-6 text-orange-600" />,
      stat: '25K+',
      label: 'Complaints Resolved',
    },
    {
      icon: <Building className="w-6 h-6 text-orange-600" />,
      stat: '120+',
      label: 'Departments Connected',
    },
    {
      icon: <ThumbsUp className="w-6 h-6 text-orange-600" />,
      stat: '98%',
      label: 'Satisfaction Rate',
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      stat: '24/7',
      label: 'Smart Monitoring',
    },
  ];

  return (
    <section id="impact" className="py-20 bg-orange-50/40 border-t border-orange-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Impact at a Glance
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Real-time civic performance metrics across participating municipal corporations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {impacts.map((item, idx) => (
            <div
              key={idx}
              className="bg-white/90 backdrop-blur-xs p-6 rounded-2xl border border-orange-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <div>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  {item.stat}
                </div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
