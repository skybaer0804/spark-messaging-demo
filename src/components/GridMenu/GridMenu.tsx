import './GridMenu.scss';

interface GridMenuProps {
  buttons: string[];
  onButtonClick?: (index: number, label: string) => void;
}

export function GridMenu({ buttons, onButtonClick }: GridMenuProps) {
  return (
    <div className="grid-menu">
      {buttons.map((label, index) => (
        <button key={index} className="grid-menu__button" onClick={() => onButtonClick?.(index, label)}>
          {label}
        </button>
      ))}
    </div>
  );
}
