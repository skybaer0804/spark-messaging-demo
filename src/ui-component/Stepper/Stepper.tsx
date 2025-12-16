import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTheme } from '../../context/ThemeProvider';
import './Stepper.scss';

export interface StepperStep {
  label: preact.ComponentChildren;
  description?: preact.ComponentChildren;
  content?: preact.ComponentChildren;
  disabled?: boolean;
  completed?: boolean; // nonLinear에서 수동 완료 표시용
  error?: boolean;
}

export interface StepperProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  steps: StepperStep[];
  activeStep?: number;
  defaultActiveStep?: number;
  onChange?: (nextStep: number, event: Event) => void;
  orientation?: 'horizontal' | 'vertical';
  alternativeLabel?: boolean; // label이 아이콘 아래로
  nonLinear?: boolean; // step 클릭 이동 허용
  ariaLabel?: string;
  showContent?: boolean; // active step content 표시
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function Stepper({
  steps,
  activeStep,
  defaultActiveStep = 0,
  onChange,
  orientation = 'horizontal',
  alternativeLabel = false,
  nonLinear = false,
  ariaLabel = 'stepper',
  showContent = false,
  className = '',
  ...props
}: StepperProps) {
  const { theme, contrast } = useTheme();

  const idPrefix = useMemo(() => `stepper-${Math.random().toString(36).slice(2, 9)}`, []);
  const maxIndex = Math.max(0, steps.length - 1);

  const [uncontrolledActive, setUncontrolledActive] = useState(() => clamp(defaultActiveStep, 0, maxIndex));
  const currentActive = activeStep !== undefined ? clamp(activeStep, 0, maxIndex) : uncontrolledActive;

  const setActive = (next: number, event: Event) => {
    if (activeStep === undefined) setUncontrolledActive(next);
    onChange?.(next, event);
  };

  const classes = [
    'stepper',
    `stepper--${orientation}`,
    alternativeLabel ? 'stepper--alt-label' : '',
    nonLinear ? 'stepper--non-linear' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-theme={theme} data-contrast={contrast} aria-label={ariaLabel} {...props}>
      <ol className="stepper__list" role="list">
        {steps.map((step, index) => {
          const isActive = index === currentActive;
          const isCompleted = step.completed ?? index < currentActive;
          const isDisabled = !!step.disabled;
          const isError = !!step.error;

          const stepId = `${idPrefix}-step-${index}`;
          const contentId = `${idPrefix}-content-${index}`;

          const canClick = nonLinear && !isDisabled;

          return (
            <li
              key={index}
              className={[
                'stepper__step',
                isActive ? 'stepper__step--active' : '',
                isCompleted ? 'stepper__step--completed' : '',
                isDisabled ? 'stepper__step--disabled' : '',
                isError ? 'stepper__step--error' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="stepper__header">
                {index > 0 && <span className="stepper__connector" aria-hidden="true" />}

                {canClick ? (
                  <button
                    type="button"
                    className="stepper__button"
                    onClick={(e) => setActive(index, e)}
                    aria-controls={contentId}
                    aria-expanded={showContent ? isActive : undefined}
                    disabled={isDisabled}
                  >
                    <span className="stepper__icon" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="stepper__text">
                      <span className="stepper__label" id={stepId}>
                        {step.label}
                      </span>
                      {step.description && <span className="stepper__description">{step.description}</span>}
                    </span>
                  </button>
                ) : (
                  <div className="stepper__button" aria-controls={contentId} aria-expanded={showContent ? isActive : undefined}>
                    <span className="stepper__icon" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="stepper__text">
                      <span className="stepper__label" id={stepId}>
                        {step.label}
                      </span>
                      {step.description && <span className="stepper__description">{step.description}</span>}
                    </span>
                  </div>
                )}
              </div>

              {showContent && (
                <div
                  id={contentId}
                  className={['stepper__content', isActive ? 'stepper__content--active' : ''].filter(Boolean).join(' ')}
                  role="region"
                  aria-labelledby={stepId}
                  hidden={!isActive}
                >
                  {step.content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}



