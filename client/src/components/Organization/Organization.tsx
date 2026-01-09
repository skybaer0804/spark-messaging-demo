import { useState, useEffect } from 'preact/hooks';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card } from '@/ui-components/Card/Card';
import { Flex } from '@/ui-components/Layout/Flex';
import { List, ListItem } from '@/ui-components/List/List';
import './Organization.scss';

export function Organization() {
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    // 서버 orgController.js 참고: 실제 API 호출 로직이 들어갈 자리
    // fetch('/api/org').then(...)
    setOrganizations([
      { id: 1, name: '기본 조직' },
      { id: 2, name: '개발 팀' }
    ]);
  }, []);

  return (
    <div className="organization">
      <Card className="organization__card">
        <Typography variant="h4" className="organization__subtitle">내 조직 목록</Typography>
        <List>
          {organizations.map((org) => (
            <ListItem key={org.id}>
              <Typography variant="body-medium">{org.name}</Typography>
            </ListItem>
          ))}
        </List>
      </Card>
    </div>
  );
}
