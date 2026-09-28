export function StepIndicator({ currentStep, totalSteps, labels }) {
  return (
    <div className="step-indicator">
      {labels.map((label, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const state = isActive ? 'active' : isCompleted ? 'completed' : '';

        return (
          <div key={label} className={`step ${state}`}>
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}