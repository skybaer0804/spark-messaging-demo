import { JSX } from 'preact';
import { useTokens } from '../../context/TokenProvider';
import './Card.scss';

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: preact.ComponentChildren;
}

export function Card({ interactive = false, className = '', children, ...props }: CardProps) {
  const { theme, contrast } = useTokens();

  const classes = ['card', interactive ? 'interactive' : '', className].filter(Boolean).join(' ');

  return (
    <div className={classes} data-theme={theme} data-contrast={contrast} {...props}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: preact.ComponentChildren;
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`card__header ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardBodyProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: preact.ComponentChildren;
}

export function CardBody({ className = '', children, ...props }: CardBodyProps) {
  return (
    <div className={`card__body ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: preact.ComponentChildren;
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div className={`card__footer ${className}`} {...props}>
      {children}
    </div>
  );
}
