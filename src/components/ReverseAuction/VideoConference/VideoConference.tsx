import { memo } from 'preact/compat';
import { useVideoConference } from './hooks/useVideoConference';
import type { VideoConferenceAdapter } from './types';
import { Button } from '@/ui-component/Button/Button';
import { Box } from '@/ui-component/Layout/Box';
import { Grid } from '@/ui-component/Layout/Grid';
import { Typography } from '@/ui-component/Typography/Typography';
import { Paper } from '@/ui-component/Paper/Paper';

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

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Box style={{ display: 'flex', justifyContent: 'center' }}>
        {!effectiveIsVideoEnabled ? (
          <Button onClick={handleStartLocalStream} variant="primary">
            📹 Start Video
          </Button>
        ) : (
          <Button onClick={handleStopLocalStream} variant="secondary">
            🛑 Stop Video
          </Button>
        )}
      </Box>

      <Grid columns={2} gap="sm" style={{ minHeight: '300px' }}>
        {/* Local Video */}
        {effectiveIsVideoEnabled && effectiveLocalStream && (
          <Paper
            elevation={0}
            style={{
              position: 'relative',
              overflow: 'hidden',
              aspectRatio: '16/9',
              border: '2px solid var(--primitive-primary-500)',
              padding: 0,
              backgroundColor: 'black',
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
                padding: '4px',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" style={{ color: 'white' }}>
                Me ({effectiveSocketId?.substring(0, 6)})
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Remote Videos */}
        {effectiveParticipants
          .filter((p) => p.socketId !== effectiveSocketId)
          .slice(0, 4 - (effectiveIsVideoEnabled ? 1 : 0))
          .map((participant) => (
            <Paper
              key={participant.socketId}
              elevation={0}
              style={{
                position: 'relative',
                overflow: 'hidden',
                aspectRatio: '16/9',
                border: '1px solid var(--color-border-default)',
                padding: 0,
                backgroundColor: 'black',
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
                  <Typography variant="caption" style={{ color: 'white' }}>
                    {participant.name} ({participant.role === 'demander' ? 'Host' : 'Participant'})
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
                    {participant.name}
                    <br />
                    <Typography variant="caption" component="span">
                      {participant.role === 'demander' ? 'Host' : 'Participant'}
                    </Typography>
                    <br />
                    <Typography variant="caption" component="span" style={{ color: 'var(--color-primary-main)' }}>
                      {participant.isVideoEnabled === false ? 'Video Stopped' : 'Connecting...'}
                    </Typography>
                  </Typography>
                </Box>
              )}
            </Paper>
          ))}

        {/* Empty Slot */}
        {effectiveParticipants.length === 0 && !effectiveIsVideoEnabled && (
          <Paper
            variant="outlined"
            style={{
              gridColumn: 'span 2',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderStyle: 'dashed',
            }}
          >
            <Typography variant="body-medium" color="text-secondary">
              Video Area (Start video to begin)
            </Typography>
          </Paper>
        )}
      </Grid>
    </Box>
  );
}

// React.memo로 메모이제이션하여 props가 변경되지 않으면 리렌더링 방지
export const VideoConference = memo(VideoConferenceComponent, (prevProps, nextProps) => {
  // adapter 참조가 같으면 리렌더링하지 않음
  // 실제 상태 변경은 adapter 내부에서 관리되므로 여기서는 참조만 비교
  return prevProps.adapter === nextProps.adapter;
});
