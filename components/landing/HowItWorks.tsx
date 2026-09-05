import React from 'react';
import { FileEdit, Bot, Landmark, CheckCheck, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '1',
      icon: <FileEdit className="w-8 h-8 text-gray-700" />,
      title: 'Submit',
      description: 'Submit your complaint using text, voice or image with location.',
    },
    {
      num: '2',
      icon: <Bot className="w-8 h-8 text-gray-700" />,
      title: 'AI Analysis',
      description: 'Our AI analyzes the issue, extracts details and determines priority.',
    },
    {
      num: '3',
      icon: <Landmark className="w-8 h-8 text-gray-700" />,
      title: 'Auto Route',
      description: 'Complaint is routed to the right department automatically.',
    },
    {
      num: '4',
      icon: <CheckCheck className="w-8 h-8 text-gray-700" />,
      title: 'Resolution',
      description: 'Officers resolve it and you receive real-time updates.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            How It Works
          </h2>
          <p className="mt-3 text-base text-gray-500 max-w-xl mx-auto">
            From civic hazard capture to municipal field resolution in 4 automated, transparent steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              {/* Step number badge */}
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-orange-600/30 mb-5">
                {step.num}
              </div>

              {/* Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                {step.icon}
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>

              {/* Subtle connecting arrow for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 z-10 text-gray-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
