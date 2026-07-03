import { useState, useEffect } from "react";
import { Copyleft as Spinner } from "lucide-react"; // Using something that spins

interface ProcessingOverlayProps {
  onComplete: () => void;
}

const steps = [
  "Extracting clauses...",
  "Identifying legal sections...",
  "Running risk analysis...",
  "Generating suggestions...",
];

const UploadProcessingOverlay = ({ onComplete }: ProcessingOverlayProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // total duration between 1800ms and 3200ms
    const totalDuration = Math.random() * (3200 - 1800) + 1800;
    const stepDuration = totalDuration / steps.length;

    const runSteps = () => {
      if (currentStepIndex < steps.length - 1) {
        timeout = setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
        }, stepDuration);
      } else {
        timeout = setTimeout(() => {
          onComplete();
        }, stepDuration);
      }
    };

    runSteps();

    return () => clearTimeout(timeout);
  }, [currentStepIndex, onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#ebe9e1]/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10 flex flex-col items-center w-[400px] border border-black/5">
        <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#e6e2d8]" />
          <div className="absolute inset-0 rounded-full border-4 border-[#111] border-t-transparent animate-spin" />
        </div>
        
        <h2 className="font-serif text-[22px] font-medium text-[#222] mb-2 text-center">
          Analyzing Document
        </h2>
        
        <div className="h-6 overflow-hidden w-full relative">
          <div className="flex flex-col transition-transform duration-500 ease-out absolute w-full"
               style={{ transform: `translateY(-${currentStepIndex * 24}px)` }}>
            {steps.map((step, idx) => (
              <span key={idx} className={`h-6 text-[14px] text-center font-sans tracking-wide transition-colors duration-300 ${idx === currentStepIndex ? 'text-[#555] font-semibold' : 'text-[#aaa]'}`}>
                {step}
              </span>
            ))}
          </div>
        </div>
        
        <div className="w-full bg-[#f0eee9] h-1.5 rounded-full mt-6 overflow-hidden">
          <div 
            className="h-full bg-[#353b49] transition-all duration-300 ease-in-out" 
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadProcessingOverlay;
