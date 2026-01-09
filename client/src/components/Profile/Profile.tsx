import { Typography } from '@/ui-component/Typography/Typography';
import { Card } from '@/ui-component/Card/Card';
import { Flex } from '@/ui-component/Layout/Flex';
import { useAuth } from '@/hooks/useAuth';
import './Profile.scss';

export function Profile() {
  const { user } = useAuth();

  return (
    <div className="profile">
      <Card className="profile__card">
        <Flex direction="column" gap="md">
          <div className="profile__field">
            <Typography variant="label-medium" color="secondary">이름</Typography>
            <Typography variant="body-large">{user?.username || 'GUEST'}</Typography>
          </div>
          <div className="profile__field">
            <Typography variant="label-medium" color="secondary">이메일</Typography>
            <Typography variant="body-large">{user?.email || 'guest@example.com'}</Typography>
          </div>
          {/* 서버 로직 참고: notification settings 등 추가 가능 */}
        </Flex>
      </Card>
    </div>
  );
}
