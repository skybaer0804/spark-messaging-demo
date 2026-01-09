import { useState, useEffect } from 'preact/hooks';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card, CardBody } from '@/ui-components/Card/Card';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Checkbox } from '@/ui-components/Checkbox/Checkbox';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Tabs } from '@/ui-components/Tabs/Tabs';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { useToast } from '@/core/context/ToastContext';
import { useAuth } from '@/core/hooks/useAuth';
import { workspaceApi, authApi } from '@/core/api/ApiService';
import {
  IconSettings,
  IconUsers,
  IconHierarchy,
  IconPlus,
  IconKey,
  IconWorld,
  IconLock,
  IconPencil,
} from '@tabler/icons-preact';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import './Workspace.scss';

export function Workspace() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<any>('workspace');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [structure, setStructure] = useState<any[]>([]);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showEditWorkspace, setShowEditWorkspace] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editWorkspaceData, setEditWorkspaceData] = useState({ name: '', allowPublicJoin: false });
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});

  const { showSuccess, showError } = useToast();

  const handleRevealKey = async (workspaceId: string) => {
    try {
      const res = await workspaceApi.getPrivateKey(workspaceId);
      setRevealedKeys((prev) => ({ ...prev, [workspaceId]: res.data.privateKey }));
    } catch (err) {
      showError('비밀키 조회 권한이 없습니다.');
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.getWorkspaces();
      setWorkspaces(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      updateUser(res.data);
    } catch (err) {
      console.error('Failed to refresh user data', err);
    }
  };

  const fetchStructure = async () => {
    if (!currentWorkspaceId.value) return;
    try {
      const res = await workspaceApi.getWorkspaceStructure(currentWorkspaceId.value);
      setStructure(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (activeTab === 'structure') {
      fetchStructure();
    }
  }, [activeTab, currentWorkspaceId.value]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      await workspaceApi.createWorkspace({ name: newWorkspaceName });
      showSuccess('워크스페이스가 생성되었습니다.');
      setShowCreateWorkspace(false);
      setNewWorkspaceName('');
      fetchWorkspaces();
      refreshUser();
    } catch (err) {
      showError('생성 실패');
    }
  };

  const handleJoinWorkspace = async (workspaceId: string) => {
    try {
      await workspaceApi.joinWorkspace(workspaceId);
      showSuccess('워크스페이스에 참여하였습니다.');
      refreshUser();
    } catch (err: any) {
      showError(err.response?.data?.message || '참여 실패');
    }
  };

  const handleEditWorkspace = (workspace: any) => {
    setEditingWorkspace(workspace);
    setEditWorkspaceData({
      name: workspace.name,
      allowPublicJoin: workspace.allowPublicJoin || false,
    });
    setShowEditWorkspace(true);
  };

  const handleUpdateWorkspace = async () => {
    if (!editingWorkspace) return;
    try {
      await workspaceApi.updateWorkspace(editingWorkspace._id, editWorkspaceData);
      showSuccess('워크스페이스 정보가 수정되었습니다.');
      setShowEditWorkspace(false);
      fetchWorkspaces();
    } catch (err) {
      showError('수정 실패');
    }
  };

  const isJoined = (workspaceId: string) => {
    return user?.workspaces?.includes(workspaceId);
  };

  const tabItems = [
    {
      value: 'workspace',
      label: (
        <Flex align="center" gap="xs">
          <IconSettings size={18} /> 워크스페이스
        </Flex>
      ),
      content: (
        <Flex direction="column" gap="lg" style={{ marginTop: '20px' }}>
          <Flex justify="space-between" align="center">
            <Typography variant="h3">워크스페이스 목록</Typography>
            <Button variant="primary" size="sm" onClick={() => setShowCreateWorkspace(true)}>
              <Flex align="center" gap="xs">
                <IconPlus size={16} /> 새 워크스페이스
              </Flex>
            </Button>
          </Flex>

          <Flex direction="column" gap="md">
            {workspaces.map((ws) => (
              <Card key={ws._id}>
                <CardBody>
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap="md">
                      <Avatar style={{ backgroundColor: ws.color }}>{ws.initials}</Avatar>
                      <Box>
                        <Flex align="center" gap="xs">
                          <Typography variant="h4">{ws.name}</Typography>
                          {ws.allowPublicJoin ? (
                            <IconWorld size={14} color="var(--color-primary)" title="누구나 참여 가능" />
                          ) : (
                            <IconLock size={14} color="var(--color-text-secondary)" title="초대 전용" />
                          )}
                        </Flex>
                        <Typography variant="caption" color="text-secondary">
                          Created at {new Date(ws.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Flex>
                    <Flex gap="sm">
                      {isJoined(ws._id) ? (
                        <>
                          {(ws.ownerId === user?.id || !ws.ownerId) && (
                            <Button variant="secondary" size="sm" onClick={() => handleEditWorkspace(ws)}>
                              <Flex align="center" gap="xs">
                                <IconPencil size={14} /> 설정
                              </Flex>
                            </Button>
                          )}
                        </>
                      ) : (
                        ws.allowPublicJoin && (
                          <Button variant="primary" size="sm" onClick={() => handleJoinWorkspace(ws._id)}>
                            참여하기
                          </Button>
                        )
                      )}
                    </Flex>
                  </Flex>

                  {isJoined(ws._id) && ws._id === currentWorkspaceId.value && (
                    <Box
                      style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: '8px',
                      }}
                    >
                      <Typography
                        variant="body-medium"
                        color="primary"
                        style={{ marginBottom: '8px', display: 'block', fontWeight: 'bold' }}
                      >
                        연동 정보 (현재 활성)
                      </Typography>
                      <Flex direction="column" gap="sm">
                        <Flex align="center" gap="sm">
                          <IconKey size={16} color="var(--color-text-secondary)" />
                          <Typography variant="body-small">
                            <strong>Public Key:</strong> {ws.projectPublicKey}
                          </Typography>
                        </Flex>
                        <Flex align="center" gap="sm">
                          <IconLock size={16} color="var(--color-text-secondary)" />
                          <Typography variant="body-small">
                            <strong>Private Key:</strong> {revealedKeys[ws._id] || '********'}
                          </Typography>
                          {!revealedKeys[ws._id] && (
                            <Button variant="secondary" size="sm" onClick={() => handleRevealKey(ws._id)}>
                              조회
                            </Button>
                          )}
                        </Flex>
                        <Flex align="center" gap="sm">
                          <IconWorld size={16} color="var(--color-text-secondary)" />
                          <Typography variant="body-small">
                            <strong>Integration URL:</strong> {ws.projectUrl || 'Not set'}
                          </Typography>
                        </Flex>
                      </Flex>
                    </Box>
                  )}
                </CardBody>
              </Card>
            ))}
          </Flex>
        </Flex>
      ),
    },
    {
      value: 'structure',
      label: (
        <Flex align="center" gap="xs">
          <IconHierarchy size={18} /> 조직도 관리
        </Flex>
      ),
      content: (
        <Flex direction="column" gap="lg" style={{ marginTop: '20px' }}>
          <Flex justify="space-between" align="center">
            <Typography variant="h3">조직도 (회사 및 부서)</Typography>
            <Flex gap="sm">
              <Button variant="secondary" size="sm">
                회사 추가
              </Button>
              <Button variant="primary" size="sm">
                부서 추가
              </Button>
            </Flex>
          </Flex>

          {structure.length === 0 ? (
            <Card style={{ padding: '40px', textAlign: 'center' }}>
              <Typography color="text-secondary">등록된 회사나 부서 정보가 없습니다.</Typography>
            </Card>
          ) : (
            <Flex direction="column" gap="md">
              {structure.map((company) => (
                <Card key={company._id}>
                  <CardBody>
                    <Typography variant="h4" style={{ marginBottom: '12px' }}>
                      {company.name}
                    </Typography>
                    <List>
                      {company.departments?.map((dept: any) => (
                        <ListItem key={dept._id} style={{ paddingLeft: '24px' }}>
                          <ListItemAvatar>
                            <IconHierarchy size={18} />
                          </ListItemAvatar>
                          <ListItemText primary={dept.name} secondary={`${dept.order}순위`} />
                        </ListItem>
                      ))}
                      {(!company.departments || company.departments.length === 0) && (
                        <Typography variant="caption" color="text-secondary" style={{ marginLeft: '24px' }}>
                          부서 정보가 없습니다.
                        </Typography>
                      )}
                    </List>
                  </CardBody>
                </Card>
              ))}
            </Flex>
          )}
        </Flex>
      ),
    },
    {
      value: 'members',
      label: (
        <Flex align="center" gap="xs">
          <IconUsers size={18} /> 멤버 관리
        </Flex>
      ),
      content: (
        <Flex direction="column" gap="lg" style={{ marginTop: '20px' }}>
          <Typography variant="h3">멤버 관리</Typography>
          <Typography color="text-secondary">준비 중인 기능입니다.</Typography>
        </Flex>
      ),
    },
  ];

  return (
    <div className="workspace">
      <header className="workspace__header">
        <Typography variant="h2">워크스페이스 관리</Typography>
        <Typography variant="body-medium" color="text-secondary">
          워크스페이스 설정 및 회사의 조직 구조를 관리합니다.
        </Typography>
      </header>

      <Box style={{ marginTop: '24px' }}>
        <Tabs items={tabItems} value={activeTab} onChange={(val) => setActiveTab(val)} />
      </Box>

      <Dialog
        open={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        title="새 워크스페이스 생성"
        actions={
          <Flex gap="sm">
            <Button onClick={() => setShowCreateWorkspace(false)}>취소</Button>
            <Button variant="primary" onClick={handleCreateWorkspace}>
              생성
            </Button>
          </Flex>
        }
      >
        <Box style={{ padding: '8px 0' }}>
          <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block' }}>
            워크스페이스 이름
          </Typography>
          <Input
            fullWidth
            placeholder="예: Spark Enterprise"
            value={newWorkspaceName}
            onInput={(e) => setNewWorkspaceName(e.currentTarget.value)}
          />
        </Box>
      </Dialog>

      <Dialog
        open={showEditWorkspace}
        onClose={() => setShowEditWorkspace(false)}
        title="워크스페이스 수정"
        actions={
          <Flex gap="sm">
            <Button onClick={() => setShowEditWorkspace(false)}>취소</Button>
            <Button variant="primary" onClick={handleUpdateWorkspace}>
              저장
            </Button>
          </Flex>
        }
      >
        <Box style={{ padding: '8px 0' }}>
          <Flex direction="column" gap="md">
            <Box>
              <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block' }}>
                워크스페이스 이름
              </Typography>
              <Input
                fullWidth
                value={editWorkspaceData.name}
                onInput={(e) => setEditWorkspaceData({ ...editWorkspaceData, name: e.currentTarget.value })}
              />
            </Box>
            <Box>
              <Checkbox
                label="누구나 참여 허용"
                checked={editWorkspaceData.allowPublicJoin}
                onChange={(checked) => setEditWorkspaceData({ ...editWorkspaceData, allowPublicJoin: checked })}
              />
              <Typography variant="caption" color="text-secondary" style={{ display: 'block', marginTop: '4px' }}>
                체크하면 다른 사용자가 초대 없이 워크스페이스에 참여할 수 있습니다.
              </Typography>
            </Box>
          </Flex>
        </Box>
      </Dialog>
    </div>
  );
}
