import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';
import { useTheme } from '@/core/context/ThemeProvider';
import './Pagination.scss';

type PaginationItemType = 'page' | 'ellipsis' | 'first' | 'previous' | 'next' | 'last';

interface PaginationItem {
  type: PaginationItemType;
  page?: number;
  key: string;
  disabled?: boolean;
  selected?: boolean;
}

export interface PaginationProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'onChange'> {
  count: number;
  page?: number;
  defaultPage?: number;
  onChange?: (page: number, event: Event) => void;
  disabled?: boolean;
  siblingCount?: number;
  boundaryCount?: number;
  showFirstButton?: boolean;
  showLastButton?: boolean;
  hidePrevButton?: boolean;
  hideNextButton?: boolean;
  variant?: 'text' | 'outlined';
  shape?: 'rounded' | 'circular';
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const range = (start: number, end: number) => {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
};

const createItems = (args: {
  count: number;
  page: number;
  siblingCount: number;
  boundaryCount: number;
  showFirstButton: boolean;
  showLastButton: boolean;
  hidePrevButton: boolean;
  hideNextButton: boolean;
  disabled: boolean;
}): PaginationItem[] => {
  const {
    count,
    page,
    siblingCount,
    boundaryCount,
    showFirstButton,
    showLastButton,
    hidePrevButton,
    hideNextButton,
    disabled,
  } = args;

  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length ? endPages[0] - 2 : count - 1,
  );

  const itemList: PaginationItem[] = [];

  const addControl = (type: PaginationItemType, targetPage: number, key: string, isDisabled: boolean) => {
    itemList.push({ type, page: targetPage, key, disabled: isDisabled || disabled });
  };

  if (showFirstButton) addControl('first', 1, 'first', page === 1);
  if (!hidePrevButton) addControl('previous', Math.max(1, page - 1), 'previous', page === 1);

  startPages.forEach((p) => itemList.push({ type: 'page', page: p, key: `page-${p}`, selected: p === page, disabled }));

  if (siblingsStart > boundaryCount + 2) {
    itemList.push({ type: 'ellipsis', key: 'start-ellipsis', disabled: true });
  } else if (boundaryCount + 1 < count - boundaryCount) {
    itemList.push({
      type: 'page',
      page: boundaryCount + 1,
      key: `page-${boundaryCount + 1}`,
      selected: boundaryCount + 1 === page,
      disabled,
    });
  }

  range(siblingsStart, siblingsEnd).forEach((p) => {
    itemList.push({ type: 'page', page: p, key: `page-${p}`, selected: p === page, disabled });
  });

  if (siblingsEnd < count - boundaryCount - 1) {
    itemList.push({ type: 'ellipsis', key: 'end-ellipsis', disabled: true });
  } else if (count - boundaryCount > boundaryCount) {
    itemList.push({
      type: 'page',
      page: count - boundaryCount,
      key: `page-${count - boundaryCount}`,
      selected: count - boundaryCount === page,
      disabled,
    });
  }

  endPages.forEach((p) => itemList.push({ type: 'page', page: p, key: `page-${p}`, selected: p === page, disabled }));

  if (!hideNextButton) addControl('next', Math.min(count, page + 1), 'next', page === count);
  if (showLastButton) addControl('last', count, 'last', page === count);

  return itemList;
};

export function Pagination({
  count,
  page,
  defaultPage = 1,
  onChange,
  disabled = false,
  siblingCount = 1,
  boundaryCount = 1,
  showFirstButton = false,
  showLastButton = false,
  hidePrevButton = false,
  hideNextButton = false,
  variant = 'text',
  shape = 'rounded',
  size = 'md',
  ariaLabel = 'pagination',
  className = '',
  ...props
}: PaginationProps) {
  const { theme, contrast } = useTheme();

  const safeCount = Math.max(0, count);
  const [uncontrolledPage, setUncontrolledPage] = useState(() => clamp(defaultPage, 1, Math.max(1, safeCount)));
  const currentPage = page !== undefined ? clamp(page, 1, Math.max(1, safeCount)) : uncontrolledPage;

  const setPage = (next: number, event: Event) => {
    if (disabled) return;
    const clamped = clamp(next, 1, Math.max(1, safeCount));
    if (page === undefined) setUncontrolledPage(clamped);
    onChange?.(clamped, event);
  };

  const items = useMemo(
    () =>
      createItems({
        count: safeCount,
        page: currentPage,
        siblingCount: Math.max(0, siblingCount),
        boundaryCount: Math.max(0, boundaryCount),
        showFirstButton,
        showLastButton,
        hidePrevButton,
        hideNextButton,
        disabled,
      }),
    [
      safeCount,
      currentPage,
      siblingCount,
      boundaryCount,
      showFirstButton,
      showLastButton,
      hidePrevButton,
      hideNextButton,
      disabled,
    ],
  );

  if (safeCount <= 1) return null;

  const classes = [
    'pagination',
    `pagination--${variant}`,
    `pagination--${shape}`,
    `pagination--${size}`,
    disabled ? 'pagination--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const icon = (type: PaginationItemType) => {
    if (type === 'first') return <IconChevronsLeft size={18} />;
    if (type === 'previous') return <IconChevronLeft size={18} />;
    if (type === 'next') return <IconChevronRight size={18} />;
    if (type === 'last') return <IconChevronsRight size={18} />;
    return null;
  };

  return (
    <nav className={classes} data-theme={theme} data-contrast={contrast} aria-label={ariaLabel} {...props}>
      <ul className="pagination__list">
        {items.map((item) => {
          if (item.type === 'ellipsis') {
            return (
              <li key={item.key} className="pagination__item pagination__item--ellipsis" aria-hidden="true">
                …
              </li>
            );
          }

          const isPage = item.type === 'page';
          const target = item.page ?? currentPage;
          const isSelected = !!item.selected;
          const isDisabled = !!item.disabled;

          return (
            <li key={item.key} className="pagination__item">
              <button
                type="button"
                className={[
                  'pagination__button',
                  isSelected ? 'pagination__button--selected' : '',
                  isDisabled ? 'pagination__button--disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={isDisabled}
                aria-current={isSelected ? 'page' : undefined}
                aria-label={
                  isPage
                    ? `${target} 페이지`
                    : item.type === 'first'
                      ? '첫 페이지'
                      : item.type === 'previous'
                        ? '이전 페이지'
                        : item.type === 'next'
                          ? '다음 페이지'
                          : '마지막 페이지'
                }
                onClick={(e) => setPage(target, e)}
              >
                <span className="pagination__button-inner" aria-hidden="true">
                  {isPage ? target : icon(item.type)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


