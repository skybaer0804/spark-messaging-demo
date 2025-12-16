import { JSX } from 'preact';
import { useTheme } from '../../context/ThemeProvider';
import './Table.scss';

export type TableAlign = 'left' | 'center' | 'right';

export interface TableColumn<Row> {
  key: string;
  header: preact.ComponentChildren;
  width?: string;
  minWidth?: string;
  align?: TableAlign;
  render?: (row: Row, rowIndex: number) => preact.ComponentChildren;
  value?: (row: Row, rowIndex: number) => preact.ComponentChildren;
}

export interface TableProps<Row> extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: Array<TableColumn<Row>>;
  rows: Row[];
  rowKey?: (row: Row, rowIndex: number) => string | number;
  caption?: preact.ComponentChildren;
  stickyHeader?: boolean;
  striped?: boolean;
  hover?: boolean;
  size?: 'sm' | 'md';
  emptyText?: preact.ComponentChildren;
}

export function Table<Row>({
  columns,
  rows,
  rowKey,
  caption,
  stickyHeader = false,
  striped = false,
  hover = false,
  size = 'md',
  emptyText = '데이터가 없습니다.',
  className = '',
  ...props
}: TableProps<Row>) {
  const { theme, contrast } = useTheme();

  const classes = [
    'table',
    stickyHeader ? 'table--sticky-header' : '',
    striped ? 'table--striped' : '',
    hover ? 'table--hover' : '',
    `table--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-theme={theme} data-contrast={contrast} {...props}>
      <div className="table__container" role="region" aria-label="table">
        <table className="table__table">
          {caption && <caption className="table__caption">{caption}</caption>}
          <thead className="table__head">
            <tr className="table__row table__row--head">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`table__cell table__cell--head table__cell--align-${col.align ?? 'left'}`}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  scope="col"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="table__body">
            {rows.length === 0 ? (
              <tr className="table__row table__row--empty">
                <td className="table__cell table__cell--empty" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const key = rowKey?.(row, rowIndex) ?? rowIndex;
                return (
                  <tr key={String(key)} className="table__row">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`table__cell table__cell--align-${col.align ?? 'left'}`}
                        style={{ width: col.width, minWidth: col.minWidth }}
                      >
                        {col.render?.(row, rowIndex) ?? col.value?.(row, rowIndex) ?? (row as any)?.[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



