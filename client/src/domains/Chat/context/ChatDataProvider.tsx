import { useChat } from './ChatContext';
import { Loading } from '@/ui-components/Loading/Loading';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { Flex } from '@/ui-components/Layout/Flex';

export function ChatDataProvider({ children }: { children: any }) {
  const { isLoading, isConnected } = useChat();

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: '100%', width: '100%' }}>
        <Loading size="large" />
        <Box padding="md">
          <Typography variant="body-medium">초기화 중...</Typography>
        </Box>
      </Flex>
    );
  }

  // 연결이 되지 않았더라도 UI는 보여줄 수 있지만,
  // 여기서는 사용자가 "준비된" 상태에서만 진입하도록 Guard 역할을 할 수 있습니다.
  // 만약 연결 필수라면 여기서 처리:
  /*
  if (!isConnected) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: '100%', width: '100%' }}>
        <Typography variant="h3" color="error">서버에 연결할 수 없습니다.</Typography>
        <Typography variant="body-medium">잠시 후 다시 시도해주세요.</Typography>
      </Flex>
    );
  }
  */

  return <>{children}</>;
}
