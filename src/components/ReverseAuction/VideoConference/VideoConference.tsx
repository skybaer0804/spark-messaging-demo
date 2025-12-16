import { useState, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { useVideoConference } from './hooks/useVideoConference';
import type { VideoConferenceAdapter } from './types';
import { IconButton } from '@/ui-component/Button/IconButton';
import { Box } from '@/ui-component/Layout/Box';
import { Flex } from '@/ui-component/Layout/Flex';
import { Typography } from '@/ui-component/Typography/Typography';
import { Paper } from '@/ui-component/Paper/Paper';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';

interface VideoConferenceProps {
  adapter: VideoConferenceAdapter;
}

function VideoConferenceComponent({ adapter }: VideoConferenceProps) {
  const {
    localStream,
    isVideoEnabled,
    participants,
    socketId,
    localVideoRef,
    handleStartLocalStream,
    handleStopLocalStream,
    handleSetVideoRef,
    localStreamSignal,
    isVideoEnabledSignal,
    participantsSignal,
    socketIdSignal,
  } = useVideoConference(adapter);

  const effectiveLocalStream = localStreamSignal?.value ?? localStream;
  const effectiveIsVideoEnabled = isVideoEnabledSignal?.value ?? isVideoEnabled;
  const effectiveParticipants = participantsSignal?.value ?? participants;
  const effectiveSocketId = socketIdSignal?.value ?? socketId;

  const [isMobile, setIsMobile] = useState(false);
  const [mainVideoSocketId, setMainVideoSocketId] = useState<string>('local');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // mainVideoSocketId 유효성 검사 및 자동 리셋
  useEffect(() => {
    if (!isMobile) return;

    if (mainVideoSocketId === 'local') {
      // local이 유효하지 않으면 (영상이 꺼진 경우) 첫 번째 참가자로 변경
      if (!effectiveIsVideoEnabled && effectiveParticipants.length > 0) {
        setMainVideoSocketId(effectiveParticipants[0].socketId);
      }
    } else {
      // 선택된 참가자가 더 이상 존재하지 않으면 local로 리셋
      const participantExists = effectiveParticipants.some((p) => p.socketId === mainVideoSocketId);
      if (!participantExists) {
        if (effectiveIsVideoEnabled) {
          setMainVideoSocketId('local');
        } else if (effectiveParticipants.length > 0) {
          setMainVideoSocketId(effectiveParticipants[0].socketId);
        } else {
          setMainVideoSocketId('local');
        }
      }
    }
  }, [isMobile, mainVideoSocketId, effectiveIsVideoEnabled, effectiveParticipants]);

  // PC 모드: 영상 준비 레이아웃
  if (!isMobile && !effectiveIsVideoEnabled) {
    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Paper
          elevation={0}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--primitive-radius-md)',
            minHeight: '400px',
            position: 'relative',
          }}
        >
          <Flex direction="column" align="center" gap="md">
            <IconButton
              onClick={handleStartLocalStream}
              color="primary"
              size="large"
              style={{
                width: '64px',
                height: '64px',
              }}
            >
              <IconPlayerPlay size={32} />
            </IconButton>
            <Typography variant="body-medium" color="text-secondary">
              영상 시작
            </Typography>
          </Flex>
        </Paper>
      </Box>
    );
  }

  // 모바일 모드 또는 영상 활성화된 경우
  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* PC 모드: 메인 영상 + 서브 영상 하단 가로 정렬 */}
      {!isMobile ? (
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
          {/* 메인 영상 (자신) - 최대 width */}
        {effectiveIsVideoEnabled && effectiveLocalStream && (
          <Paper
            elevation={0}
            style={{
                flex: 1,
              position: 'relative',
              overflow: 'hidden',
                width: '100%',
              aspectRatio: '16/9',
                border: '2px solid var(--color-interactive-primary)',
              padding: 0,
              backgroundColor: 'black',
                minHeight: 0,
                maxWidth: '100%',
            }}
          >
            <video
              ref={(el) => {
                localVideoRef.current = el;
                if (el && effectiveSocketId) {
                  handleSetVideoRef('local', el);
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
              {/* Stop Video 버튼 우하단 */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '8px',
                  zIndex: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                  padding: '4px',
                }}
              >
                <IconButton onClick={handleStopLocalStream} color="primary" size="small" title="영상 중지">
                  <IconPlayerStop size={18} />
                </IconButton>
              </Box>
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '4px',
                textAlign: 'center',
                  zIndex: 5,
              }}
            >
              <Typography variant="caption" style={{ color: 'white' }}>
                Me ({effectiveSocketId?.substring(0, 6)})
              </Typography>
            </Box>
          </Paper>
        )}

          {/* 서브 영상들 하단 가로 정렬 */}
          {effectiveParticipants.filter((p) => p.socketId !== effectiveSocketId).length > 0 && (
            <Flex gap="sm" style={{ flexShrink: 0, overflowX: 'auto' }}>
        {effectiveParticipants
          .filter((p) => p.socketId !== effectiveSocketId)
          .map((participant) => (
            <Paper
              key={participant.socketId}
              elevation={0}
              style={{
                position: 'relative',
                overflow: 'hidden',
                      width: '200px',
                aspectRatio: '16/9',
                border: '1px solid var(--color-border-default)',
                padding: 0,
                backgroundColor: 'black',
                      flexShrink: 0,
              }}
            >
              <video
                ref={(el) => {
                  handleSetVideoRef(participant.socketId, el);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: participant.stream ? 'block' : 'none',
                }}
              />
              {participant.isVideoEnabled !== false && participant.stream ? (
                      <Box
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: '4px',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" style={{ color: 'white', fontSize: '0.7rem' }}>
                          {participant.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f0f0f0',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <Typography variant="caption" align="center" style={{ fontSize: '0.7rem' }}>
                          {participant.name}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
            </Flex>
          )}
        </Box>
      ) : (
        /* 모바일 모드: 메인 영상 크게 + 하단 서브 영상들 가로 스크롤 */
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
          {/* 메인 영상 (크게, width 꽉차도록) */}
          {mainVideoSocketId === 'local' && effectiveIsVideoEnabled && effectiveLocalStream ? (
            <Paper
              elevation={0}
              style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                aspectRatio: '16/9',
                border: '2px solid var(--color-interactive-primary)',
                padding: 0,
                backgroundColor: 'black',
                minHeight: 0,
              }}
            >
              <video
                ref={(el) => {
                  localVideoRef.current = el;
                  if (el && effectiveSocketId) {
                    handleSetVideoRef('local', el);
                  }
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Stop Video 버튼 우하단 */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '8px',
                  zIndex: 10,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                  padding: '4px',
                }}
              >
                <IconButton onClick={handleStopLocalStream} color="primary" size="small" title="영상 중지">
                  <IconPlayerStop size={18} />
                </IconButton>
              </Box>
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  padding: '4px',
                  textAlign: 'center',
                  zIndex: 5,
                }}
              >
                <Typography variant="caption" style={{ color: 'white' }}>
                  Me ({effectiveSocketId?.substring(0, 6)})
                </Typography>
              </Box>
            </Paper>
          ) : mainVideoSocketId !== 'local' ? (
            (() => {
              const mainParticipant = effectiveParticipants.find((p) => p.socketId === mainVideoSocketId);
              return mainParticipant ? (
                <Paper
                  elevation={0}
                  style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    width: '100%',
                    aspectRatio: '16/9',
                    border: '2px solid var(--color-interactive-primary)',
                    padding: 0,
                    backgroundColor: 'black',
                    minHeight: 0,
                  }}
                >
                  <video
                    ref={(el) => {
                      handleSetVideoRef(mainParticipant.socketId, el);
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: mainParticipant.stream ? 'block' : 'none',
                    }}
                  />
                  {mainParticipant.isVideoEnabled !== false && mainParticipant.stream ? (
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '4px',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" style={{ color: 'white' }}>
                        {mainParticipant.name} ({mainParticipant.role === 'demander' ? 'Host' : 'Participant'})
                  </Typography>
                </Box>
              ) : (
                <Box
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Typography variant="body-small" align="center">
                        {mainParticipant.name}
                    <br />
                    <Typography variant="caption" component="span">
                          {mainParticipant.role === 'demander' ? 'Host' : 'Participant'}
                    </Typography>
                    <br />
                    <Typography variant="caption" component="span" style={{ color: 'var(--color-primary-main)' }}>
                          {mainParticipant.isVideoEnabled === false ? 'Video Stopped' : 'Connecting...'}
                    </Typography>
                  </Typography>
                </Box>
              )}
            </Paper>
              ) : null;
            })()
          ) : (
          <Paper
            variant="outlined"
            style={{
                flex: 1,
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderStyle: 'dashed',
                minHeight: 0,
                position: 'relative',
              }}
            >
              {/* Start Video 버튼 가운데 배치 */}
              <Flex direction="column" align="center" gap="sm">
                <IconButton
                  onClick={handleStartLocalStream}
                  color="primary"
                  size="large"
                  style={{
                    width: '64px',
                    height: '64px',
            }}
          >
                  <IconPlayerPlay size={32} />
                </IconButton>
            <Typography variant="body-medium" color="text-secondary">
                  Start Video
                </Typography>
              </Flex>
            </Paper>
          )}

          {/* 서브 영상들 하단 가로 스크롤 */}
          {(effectiveIsVideoEnabled || effectiveParticipants.length > 0) && (
            <Flex
              gap="sm"
              style={{
                flexShrink: 0,
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '4px',
              }}
            >
              {/* 자신의 영상 (메인이 아닐 때만 표시) */}
              {effectiveIsVideoEnabled &&
                effectiveLocalStream &&
                mainVideoSocketId !== 'local' && (
                  <Paper
                    elevation={0}
                    onClick={() => setMainVideoSocketId('local')}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      width: '120px',
                      aspectRatio: '16/9',
                      border: '1px solid var(--color-border-default)',
                      padding: 0,
                      backgroundColor: 'black',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <video
                      ref={(el) => {
                        localVideoRef.current = el;
                        if (el && effectiveSocketId) {
                          handleSetVideoRef('local', el);
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Box
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: '2px',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" style={{ color: 'white', fontSize: '0.65rem' }}>
                        Me
            </Typography>
                    </Box>
          </Paper>
        )}

              {/* 다른 참가자들의 영상 */}
              {effectiveParticipants
                .filter((p) => p.socketId !== effectiveSocketId && p.socketId !== mainVideoSocketId)
                .map((participant) => (
                  <Paper
                    key={participant.socketId}
                    elevation={0}
                    onClick={() => setMainVideoSocketId(participant.socketId)}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      width: '120px',
                      aspectRatio: '16/9',
                      border: '1px solid var(--color-border-default)',
                      padding: 0,
                      backgroundColor: 'black',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <video
                      ref={(el) => {
                        handleSetVideoRef(participant.socketId, el);
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: participant.stream ? 'block' : 'none',
                      }}
                    />
                    {participant.isVideoEnabled !== false && participant.stream ? (
                      <Box
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: '2px',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" style={{ color: 'white', fontSize: '0.65rem' }}>
                          {participant.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f0f0f0',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <Typography variant="caption" align="center" style={{ fontSize: '0.65rem' }}>
                          {participant.name}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}

// React.memo로 메모이제이션하여 props가 변경되지 않으면 리렌더링 방지
export const VideoConference = memo(VideoConferenceComponent, (prevProps, nextProps) => {
  // adapter 참조가 같으면 리렌더링하지 않음
  // 실제 상태 변경은 adapter 내부에서 관리되므로 여기서는 참조만 비교
  return prevProps.adapter === nextProps.adapter;
});
