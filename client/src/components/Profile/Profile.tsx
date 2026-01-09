import { useState, useEffect } from 'preact/hooks';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card } from '@/ui-components/Card/Card';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Select } from '@/ui-components/Select/Select';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { authApi } from '@/core/api/ApiService';
import { IconUser, IconMail, IconShield, IconDeviceFloppy, IconEdit } from '@tabler/icons-react';
import './Profile.scss';

export function Profile() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'Normal',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 실제 API endpoint는 프로젝트 상황에 맞춰 조정 필요
      // 현재는 테스트용이므로 성공 가정 후 로컬 상태 업데이트
      const response = await authApi.updateNotificationSettings({
        // 예시로 notification settings API 사용 또는 유저 정보 수정 API 호출
      } as any);
      
      const updatedUser = { ...user, ...formData };
      updateUser(updatedUser as any);
      
      showSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
    } catch (err) {
      showError('업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'Admin', label: '관리자' },
    { value: 'Normal', label: '일반 사용자' },
    { value: 'Guest', label: '게스트' },
  ];

  return (
    <div className="profile">
      <Card className="profile__card">
        <Flex direction="column" gap="xl">
          <header className="profile__header">
            <Flex align="center" justify="space-between" fullWidth>
              <Flex align="center" gap="lg">
                <Avatar size="xl" className="profile__avatar">
                  {formData.username.substring(0, 1)}
                </Avatar>
                <Box>
                  <Typography variant="h2">{formData.username}</Typography>
                  <Typography variant="body-medium" color="text-secondary">
                    {formData.role} Account
                  </Typography>
                </Box>
              </Flex>
              {!isEditing ? (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  <IconEdit size={18} /> 수정하기
                </Button>
              ) : (
                <Flex gap="sm">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>취소</Button>
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
                    <IconDeviceFloppy size={18} /> 저장
                  </Button>
                </Flex>
              )}
            </Flex>
          </header>

          <Box className="profile__body">
            <Flex direction="column" gap="lg">
              <div className="profile__field">
                <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                  <IconUser size={18} color="var(--color-text-secondary)" />
                  <Typography variant="label-medium" color="secondary">이름</Typography>
                </Flex>
                {isEditing ? (
                  <Input 
                    fullWidth 
                    value={formData.username} 
                    onInput={(e) => setFormData({...formData, username: e.currentTarget.value})}
                  />
                ) : (
                  <Typography variant="body-large" className="profile__value">{formData.username}</Typography>
                )}
              </div>

              <div className="profile__field">
                <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                  <IconMail size={18} color="var(--color-text-secondary)" />
                  <Typography variant="label-medium" color="secondary">이메일</Typography>
                </Flex>
                {isEditing ? (
                  <Input 
                    fullWidth 
                    value={formData.email} 
                    onInput={(e) => setFormData({...formData, email: e.currentTarget.value})}
                  />
                ) : (
                  <Typography variant="body-large" className="profile__value">{formData.email}</Typography>
                )}
              </div>

              <div className="profile__field">
                <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                  <IconShield size={18} color="var(--color-text-secondary)" />
                  <Typography variant="label-medium" color="secondary">권한 설정 (테스트)</Typography>
                </Flex>
                {isEditing ? (
                  <Select 
                    fullWidth
                    options={roleOptions}
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: (e.currentTarget as HTMLSelectElement).value})}
                  />
                ) : (
                  <Typography variant="body-large" className="profile__value">
                    {roleOptions.find(r => r.value === formData.role)?.label}
                  </Typography>
                )}
              </div>
            </Flex>
          </Box>
        </Flex>
      </Card>
    </div>
  );
}
