import { useState, useEffect } from 'preact/hooks';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card, CardBody } from '@/ui-components/Card/Card';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Checkbox } from '@/ui-components/Checkbox/Checkbox';
import { useToast } from '@/core/context/ToastContext';
import { useAuth } from '@/core/hooks/useAuth';
import { workspaceApi } from '@/core/api/ApiService';
import {
  IconSettings,
  IconKey,
  IconWorld,
  IconLock,
  IconCalendar,
  IconHash,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconDeviceFloppy,
  IconArrowLeft,
} from '@tabler/icons-preact';
import { useRouterState } from '@/routes/RouterState';
import './WorkspaceDetail.scss';

interface WorkspaceDetailProps {
  id?: string;
}

export function WorkspaceDetail({ id }: WorkspaceDetailProps) {
  const { user } = useAuth();
  const { navigate } = useRouterState();
  const { showSuccess, showError } = useToast();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    initials: '',
    color: '',
    allowPublicJoin: false,
    projectUrl: '',
  });

  const fetchWorkspace = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await workspaceApi.getWorkspace(id);
      setWorkspace(res.data);
      setFormData({
        name: res.data.name,
        initials: res.data.initials || '',
        color: res.data.color || '#4f46e5',
        allowPublicJoin: res.data.allowPublicJoin || false,
        projectUrl: res.data.projectUrl || '',
      });
    } catch (err) {
      showError('워크스페이스 정보를 불러오는데 실패했습니다.');
      navigate('/workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    try {
      await workspaceApi.updateWorkspace(id, formData);
      showSuccess('워크스페이스 정보가 업데이트되었습니다.');
      setIsEditing(false);
      fetchWorkspace();
    } catch (err) {
      showError('업데이트에 실패했습니다.');
    }
  };

  const handleRevealPrivateKey = async () => {
    if (!id || privateKey) {
      setShowPrivateKey(!showPrivateKey);
      return;
    }
    try {
      const res = await workspaceApi.getPrivateKey(id);
      setPrivateKey(res.data.privateKey);
      setShowPrivateKey(true);
    } catch (err) {
      showError('비밀키 조회 권한이 없습니다.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label}가 클립보드에 복사되었습니다.`);
  };

  if (loading) {
    return (
      <Box className="workspace-detail" style={{ padding: '40px', textAlign: 'center' }}>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  if (!workspace) return null;

  const isOwner = workspace.ownerId === user?.id || !workspace.ownerId;

  return (
    <div className="workspace-detail">
      <header className="workspace-detail__header">
        <Flex align="center" gap="md">
          <Button variant="secondary" size="sm" onClick={() => navigate('/workspace')} className="workspace-detail__back">
            <IconArrowLeft size={18} />
          </Button>
          <Typography variant="h2">워크스페이스 상세</Typography>
        </Flex>
        {isOwner && (
          <Button variant={isEditing ? 'secondary' : 'primary'} onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? '취소' : <Flex align="center" gap="xs"><IconSettings size={18} /> 설정</Flex>}
          </Button>
        )}
      </header>

      <div className="workspace-detail__content">
        <div className="workspace-detail__main">
          <Card>
            <CardBody>
              <Flex direction="column" gap="xl">
                {/* 기본 정보 섹션 */}
                <section>
                  <Typography variant="h4" className="workspace-detail__section-title">기본 정보</Typography>
                  <Flex align="center" gap="lg" style={{ marginTop: '16px' }}>
                    <div 
                      className="workspace-detail__avatar-container"
                      style={{ backgroundColor: isEditing ? formData.color : workspace.color }}
                    >
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="workspace-detail__initials-input"
                          value={formData.initials}
                          maxLength={2}
                          onInput={(e) => setFormData({ ...formData, initials: e.currentTarget.value.toUpperCase() })}
                        />
                      ) : (
                        workspace.initials || workspace.name.substring(0, 1).toUpperCase()
                      )}
                    </div>
                    
                    <Box style={{ flex: 1 }}>
                      {isEditing ? (
                        <Flex direction="column" gap="sm">
                          <Input
                            fullWidth
                            label="워크스페이스 이름"
                            value={formData.name}
                            onInput={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                          />
                          <Flex align="center" gap="md">
                            <Box style={{ flex: 1 }}>
                              <Typography variant="body-small" style={{ marginBottom: '4px', display: 'block' }}>브랜드 컬러</Typography>
                              <div className="workspace-detail__color-picker">
                                <input 
                                  type="color" 
                                  value={formData.color}
                                  onInput={(e) => setFormData({ ...formData, color: e.currentTarget.value })}
                                />
                                <Typography variant="body-small">{formData.color}</Typography>
                              </div>
                            </Box>
                          </Flex>
                        </Flex>
                      ) : (
                        <>
                          <Typography variant="h3" style={{ marginBottom: '4px' }}>{workspace.name}</Typography>
                          <Typography variant="body-small" color="text-secondary">
                            {workspace.allowPublicJoin ? '공개 워크스페이스' : '비공개 워크스페이스'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Flex>
                </section>

                {/* 시스템 정보 섹션 */}
                <section>
                  <Typography variant="h4" className="workspace-detail__section-title">시스템 정보</Typography>
                  <div className="workspace-detail__grid">
                    <div className="workspace-detail__info-item">
                      <Flex align="center" gap="sm" className="workspace-detail__info-label">
                        <IconHash size={16} />
                        <Typography variant="body-small">워크스페이스 ID</Typography>
                      </Flex>
                      <Typography variant="body-medium" className="workspace-detail__info-value">{workspace._id}</Typography>
                    </div>
                    <div className="workspace-detail__info-item">
                      <Flex align="center" gap="sm" className="workspace-detail__info-label">
                        <IconCalendar size={16} />
                        <Typography variant="body-small">생성일</Typography>
                      </Flex>
                      <Typography variant="body-medium" className="workspace-detail__info-value">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </Typography>
                    </div>
                  </div>
                </section>

                {/* API 연동 섹션 */}
                <section>
                  <Typography variant="h4" className="workspace-detail__section-title">API 및 연동 설정</Typography>
                  <Flex direction="column" gap="md" style={{ marginTop: '16px' }}>
                    <div className="workspace-detail__api-box">
                      <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                        <Flex align="center" gap="sm">
                          <IconKey size={18} color="var(--color-primary)" />
                          <Typography variant="body-medium" style={{ fontWeight: 'bold' }}>Public API Key</Typography>
                        </Flex>
                        <Button variant="secondary" size="sm" onClick={() => copyToClipboard(workspace.projectPublicKey, 'Public Key')}>
                          <IconCopy size={14} />
                        </Button>
                      </Flex>
                      <code className="workspace-detail__code">{workspace.projectPublicKey}</code>
                    </div>

                    <div className="workspace-detail__api-box">
                      <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                        <Flex align="center" gap="sm">
                          <IconLock size={18} color="var(--color-error)" />
                          <Typography variant="body-medium" style={{ fontWeight: 'bold' }}>Private Secret Key</Typography>
                        </Flex>
                        <Flex gap="xs">
                          <Button variant="secondary" size="sm" onClick={handleRevealPrivateKey}>
                            {showPrivateKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                          </Button>
                          {showPrivateKey && (
                            <Button variant="secondary" size="sm" onClick={() => copyToClipboard(privateKey || '', 'Private Key')}>
                              <IconCopy size={14} />
                            </Button>
                          )}
                        </Flex>
                      </Flex>
                      <code className="workspace-detail__code">
                        {showPrivateKey ? (privateKey || '조회 권한이 없습니다.') : '••••••••••••••••••••••••••••••••'}
                      </code>
                    </div>

                    <div className="workspace-detail__api-box">
                      <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                        <Flex align="center" gap="sm">
                          <IconWorld size={18} color="var(--color-success)" />
                          <Typography variant="body-medium" style={{ fontWeight: 'bold' }}>Integration URL</Typography>
                        </Flex>
                      </Flex>
                      {isEditing ? (
                        <Input
                          fullWidth
                          placeholder="https://your-api-endpoint.com"
                          value={formData.projectUrl}
                          onInput={(e) => setFormData({ ...formData, projectUrl: e.currentTarget.value })}
                        />
                      ) : (
                        <Typography variant="body-medium" className="workspace-detail__info-value">
                          {workspace.projectUrl || '설정되지 않음'}
                        </Typography>
                      )}
                    </div>
                  </Flex>
                </section>

                {/* 보안 설정 */}
                <section>
                  <Typography variant="h4" className="workspace-detail__section-title">보안 및 정책</Typography>
                  <Box style={{ marginTop: '16px' }}>
                    <Checkbox
                      label="누구나 참여 가능 (Public Join)"
                      disabled={!isEditing}
                      checked={formData.allowPublicJoin}
                      onChange={(checked) => setFormData({ ...formData, allowPublicJoin: checked })}
                    />
                    <Typography variant="caption" color="text-secondary" style={{ display: 'block', marginTop: '4px', marginLeft: '28px' }}>
                      활성화하면 초대 링크 없이도 사용자가 이 워크스페이스를 검색하여 가입할 수 있습니다.
                    </Typography>
                  </Box>
                </section>

                {isEditing && (
                  <Button variant="primary" fullWidth size="lg" onClick={handleUpdate} style={{ marginTop: '20px' }}>
                    <IconDeviceFloppy size={20} style={{ marginRight: '8px' }} />
                    변경 사항 저장
                  </Button>
                )}
              </Flex>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
