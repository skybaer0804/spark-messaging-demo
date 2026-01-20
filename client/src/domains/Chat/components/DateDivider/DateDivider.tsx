import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { formatDate } from '@/core/utils/messageUtils';
import './DateDivider.scss';

interface DateDividerProps {
  date: Date | number;
  classNamePrefix?: string;
}

export function DateDivider({ date, classNamePrefix = 'chat' }: DateDividerProps) {
  const dateString = formatDate(date);

  return (
    <Box className={`${classNamePrefix}__date-divider`}>
      <Typography variant="caption" className={`${classNamePrefix}__date-divider-text`}>
        {dateString}
      </Typography>
    </Box>
  );
}
