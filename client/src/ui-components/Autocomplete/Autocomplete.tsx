import { JSX } from 'preact';
import { useState, useRef, useEffect, useMemo } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import { Input } from '../Input/Input';
import './Autocomplete.scss';

export interface AutocompleteOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface AutocompleteProps<T = any> extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'onInput'> {
  options: AutocompleteOption<T>[];
  value?: T | T[];
  onChange?: (value: T | T[] | null) => void;
  onInputChange?: (inputValue: string) => void;
  multiple?: boolean;
  getOptionLabel?: (option: AutocompleteOption<T>) => string;
  renderOption?: (option: AutocompleteOption<T>, state: { selected: boolean; inputValue: string }) => preact.ComponentChildren;
  filterOptions?: (options: AutocompleteOption<T>[], inputValue: string) => AutocompleteOption<T>[];
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  openOnFocus?: boolean;
  autoHighlight?: boolean;
  clearOnEscape?: boolean;
  disableClearable?: boolean;
  limitTags?: number;
  renderValue?: (value: T | T[], getItemProps: (index: number) => JSX.HTMLAttributes<HTMLDivElement>) => preact.ComponentChildren;
}

const defaultFilterOptions = <T,>(options: AutocompleteOption<T>[], inputValue: string): AutocompleteOption<T>[] => {
  if (!inputValue.trim()) return options;
  const lowerInput = inputValue.toLowerCase();
  return options.filter((option) => option.label.toLowerCase().includes(lowerInput));
};

const defaultGetOptionLabel = <T,>(option: AutocompleteOption<T>): string => option.label;

export function Autocomplete<T = any>({
  options,
  value,
  onChange,
  onInputChange,
  multiple = false,
  getOptionLabel = defaultGetOptionLabel,
  renderOption,
  filterOptions = defaultFilterOptions,
  placeholder,
  label,
  helperText,
  error = false,
  disabled = false,
  fullWidth = true,
  openOnFocus = false,
  autoHighlight = false,
  clearOnEscape = true,
  disableClearable = false,
  limitTags,
  renderValue,
  className = '',
  ...props
}: AutocompleteProps<T>) {
  const { theme, contrast } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [popperStyle, setPopperStyle] = useState<{ top: string; left: string; width: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedValues = useMemo(() => {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const filteredOptions = useMemo(() => {
    return filterOptions(options, inputValue);
  }, [options, inputValue, filterOptions]);

  const isOptionSelected = (option: AutocompleteOption<T>): boolean => {
    return selectedValues.some((val) => {
      if (typeof val === 'object' && typeof option.value === 'object') {
        return JSON.stringify(val) === JSON.stringify(option.value);
      }
      return val === option.value;
    });
  };

  const handleInputChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    setInputValue(newValue);
    onInputChange?.(newValue);
    updatePopperPosition();
    setOpen(true);
    setHighlightedIndex(-1);
  };

  const updatePopperPosition = () => {
    if (containerRef.current) {
      // Input 컨테이너 내부의 실제 input 요소 찾기
      const inputElement = containerRef.current.querySelector('input, textarea') as HTMLElement;
      const targetElement = inputElement || containerRef.current;
      const rect = targetElement.getBoundingClientRect();
      setPopperStyle({
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
      });
    }
  };

  const handleInputFocus = () => {
    if (openOnFocus && filteredOptions.length > 0) {
      updatePopperPosition();
      setOpen(true);
    }
  };

  const handleInputBlur = (e: JSX.TargetedEvent<HTMLInputElement>) => {
    // Delay to allow option click to fire first
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    }, 200);
  };

  const handleOptionClick = (option: AutocompleteOption<T>) => {
    if (option.disabled) return;

    if (multiple) {
      const isSelected = isOptionSelected(option);
      const newValues = isSelected
        ? selectedValues.filter((val) => {
            if (typeof val === 'object' && typeof option.value === 'object') {
              return JSON.stringify(val) !== JSON.stringify(option.value);
            }
            return val !== option.value;
          })
        : [...selectedValues, option.value];
      onChange?.(newValues as T[]);
      setInputValue('');
    } else {
      onChange?.(option.value);
      setInputValue('');
      setOpen(false);
    }
  };

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (!open || filteredOptions.length === 0) {
      if (e.key === 'Enter' && clearOnEscape && !disableClearable && inputValue) {
        setInputValue('');
        onInputChange?.('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : autoHighlight ? 0 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : autoHighlight ? filteredOptions.length - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        if (clearOnEscape) {
          if (inputValue) {
            setInputValue('');
            onInputChange?.('');
          } else {
            setOpen(false);
          }
        } else {
          setOpen(false);
        }
        break;
    }
  };

  const handleClear = () => {
    setInputValue('');
    onInputChange?.('');
    onChange?.(multiple ? ([] as T[]) : (null as any));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      updatePopperPosition();
      const handleResize = () => updatePopperPosition();
      const handleScroll = () => updatePopperPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [open]);

  useEffect(() => {
    if (open && highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, open]);

  const displayValue = useMemo(() => {
    if (multiple) {
      if (selectedValues.length === 0) return '';
      if (limitTags && selectedValues.length > limitTags) {
        return `${selectedValues.slice(0, limitTags).map((v) => {
          const option = options.find((opt) => {
            if (typeof v === 'object' && typeof opt.value === 'object') {
              return JSON.stringify(v) === JSON.stringify(opt.value);
            }
            return v === opt.value;
          });
          return option ? getOptionLabel(option) : String(v);
        }).join(', ')} +${selectedValues.length - limitTags}`;
      }
      return selectedValues
        .map((v) => {
          const option = options.find((opt) => {
            if (typeof v === 'object' && typeof opt.value === 'object') {
              return JSON.stringify(v) === JSON.stringify(opt.value);
            }
            return v === opt.value;
          });
          return option ? getOptionLabel(option) : String(v);
        })
        .join(', ');
    }
    if (value === undefined || value === null) return '';
    const option = options.find((opt) => {
      if (typeof value === 'object' && typeof opt.value === 'object') {
        return JSON.stringify(value) === JSON.stringify(opt.value);
      }
      return value === opt.value;
    });
    return option ? getOptionLabel(option) : String(value);
  }, [multiple, selectedValues, value, options, getOptionLabel, limitTags]);

  const wrapperClasses = ['autocomplete-group', fullWidth ? 'fullWidth' : '', className].filter(Boolean).join(' ');

  const getItemProps = (index: number) => ({
    'data-item-index': index,
    tabIndex: -1,
  });

  return (
    <div className={wrapperClasses} data-theme={theme} data-contrast={contrast} ref={containerRef} {...props}>
      {multiple && renderValue && selectedValues.length > 0 ? (
        <div className="autocomplete__input-wrapper">
          <div className="autocomplete__chips-container">
            {renderValue(selectedValues as T[], getItemProps)}
          </div>
          <Input
            label={label}
            helperText={helperText}
            error={error}
            disabled={disabled}
            fullWidth={fullWidth}
            placeholder={placeholder}
            value={inputValue}
            onInput={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            endAdornment={
              !disableClearable && (inputValue || selectedValues.length > 0) ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="autocomplete__clear-button"
                  aria-label="지우기"
                >
                  ×
                </button>
              ) : (
                <span className="autocomplete__arrow">▼</span>
              )
            }
          />
        </div>
      ) : (
        <Input
          label={label}
          helperText={helperText}
          error={error}
          disabled={disabled}
          fullWidth={fullWidth}
          placeholder={placeholder}
          value={multiple ? inputValue : displayValue || inputValue}
          onInput={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          endAdornment={
            !disableClearable && (inputValue || (value !== undefined && value !== null)) ? (
              <button
                type="button"
                onClick={handleClear}
                className="autocomplete__clear-button"
                aria-label="지우기"
              >
                ×
              </button>
            ) : (
              <span className="autocomplete__arrow">▼</span>
            )
          }
        />
      )}
      {open && filteredOptions.length > 0 && popperStyle && (
        <div className="autocomplete__popper" style={popperStyle}>
          <ul className="autocomplete__list" ref={listRef} role="listbox">
            {filteredOptions.map((option, index) => {
              const selected = isOptionSelected(option);
              const highlighted = index === highlightedIndex;
              const optionClasses = [
                'autocomplete__option',
                selected ? 'autocomplete__option--selected' : '',
                highlighted ? 'autocomplete__option--highlighted' : '',
                option.disabled ? 'autocomplete__option--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li
                  key={index}
                  className={optionClasses}
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleOptionClick(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {renderOption ? renderOption(option, { selected, inputValue }) : getOptionLabel(option)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
