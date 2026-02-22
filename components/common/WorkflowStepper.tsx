import React from 'react';
import { Check } from 'lucide-react';

export type WorkflowStep = 'assessment' | 'plan' | 'monitoring' | 'records';

interface Step {
  id: WorkflowStep;
  label: string;
  shortLabel: string;
}

const STEPS: Step[] = [
  { id: 'assessment', label: 'アセスメント', shortLabel: '課題分析' },
  { id: 'plan', label: 'ケアプラン', shortLabel: 'プラン' },
  { id: 'monitoring', label: 'モニタリング', shortLabel: '経過観察' },
  { id: 'records', label: '支援経過', shortLabel: '記録' },
];

interface WorkflowStepperProps {
  completedSteps: WorkflowStep[];
  activeStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  completedSteps,
  activeStep,
  onStepClick,
}) => {
  return (
    <nav aria-label="ワークフロー進捗" className="flex items-center gap-0 overflow-x-auto">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isActive = step.id === activeStep;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onStepClick(step.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-colors min-w-[60px] min-h-[44px] justify-center ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : isCompleted
                  ? 'text-emerald-700 hover:bg-emerald-50'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted && !isActive ? <Check className="w-3 h-3" /> : index + 1}
              </span>
              <span className="text-xs font-medium whitespace-nowrap hidden sm:block">
                {step.label}
              </span>
              <span className="text-xs font-medium whitespace-nowrap sm:hidden">
                {step.shortLabel}
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={`w-4 h-0.5 shrink-0 ${
                  isCompleted ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
