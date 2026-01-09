import { Container } from '@/ui-components/Layout/Container';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import './PrivacyPolicy.scss';

export function PrivacyPolicy() {
  return (
    <Container className="privacy-policy">
      <Paper className="privacy-policy__content">
        <Stack spacing="lg">
          <div className="privacy-policy__header">
            <Typography variant="h1" component="h1">
              개인정보처리방침
            </Typography>
            <Typography variant="body-small" color="text-secondary">
              최종 업데이트: 2025년 12월 19일
            </Typography>
          </div>

          <section className="privacy-policy__section">
            <Typography variant="h2" component="h2">
              1. 개인정보 수집 범위
            </Typography>
            <Typography variant="body-medium">
              본 앱 ("Spark Real-time Platform")은 다음과 같은 개인정보를 수집할 수 있습니다:
            </Typography>
            <ul className="privacy-policy__list">
              <li>사용자 이름 (채팅, 알림 기능 사용 시)</li>
              <li>기기 ID (앱 설치 및 사용 통계)</li>
              <li>연결 정보 (WebSocket 연결을 통한 실시간 통신)</li>
              <li>사용 통계 (앱 사용 패턴 분석)</li>
              <li>파일 전송 정보 (파일 업로드/다운로드 시)</li>
            </ul>
          </section>

          <section className="privacy-policy__section">
            <Typography variant="h2" component="h2">
              2. 수집 목적
            </Typography>
            <Typography variant="body-medium">수집한 개인정보는 다음 목적으로 사용됩니다:</Typography>
            <ul className="privacy-policy__list">
              <li>실시간 메시징 및 알림 서비스 제공</li>
              <li>비디오 통화 및 화상회의 기능 제공</li>
              <li>서비스 개선 및 사용자 경험 향상</li>
              <li>오류 분석 및 기술 지원</li>
              <li>법적 의무 이행</li>
            </ul>
          </section>

          <section className="privacy-policy__section">
            <Typography variant="h2" component="h2">
              3. 개인정보 보관
            </Typography>
            <Typography variant="body-medium">수집한 개인정보는 다음 기간 동안 보관됩니다:</Typography>
            <ul className="privacy-policy__list">
              <li>서비스 제공 기간 동안 보관</li>
              <li>사용자 요청 시 즉시 삭제</li>
              <li>법적 의무가 있는 경우 관련 법령에 따라 보관</li>
            </ul>
          </section>

          <section className="privacy-policy__section">
            <Typography variant="h2" component="h2">
              4. 제3자 공유
            </Typography>
            <Typography variant="body-medium">
              본 앱은 사용자의 개인정보를 제3자와 공유하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
            </Typography>
            <ul className="privacy-policy__list">
              <li>사용자가 명시적으로 동의한 경우</li>
              <li>법령에 의해 요구되는 경우</li>
              <li>서비스 제공을 위해 필요한 최소한의 정보만 제공하는 경우</li>
            </ul>
          </section>

          <section className="privacy-policy__section">
            <Typography variant="h2" component="h2">
              5. 사용자 권리
            </Typography>
            <Typography variant="body-medium">사용자는 언제든지 다음을 요청할 수 있습니다:</Typography>
            <ul className="privacy-policy__list">
              <li>개인정보 열람 요청</li>
              <li>개인정보 수정 또는 삭제 요청</li>
              <li>개인정보 수집 거부 (단, 일부 서비스 이용이 제한될 수 있음)</li>
            </ul>
          </section>

          <section className="privacy-policy__section">
            <Typography variant="h2" component="h2">
              6. 보안 조치
            </Typography>
            <Typography variant="body-medium">
              본 앱은 개인정보 보호를 위해 다음과 같은 보안 조치를 취하고 있습니다:
            </Typography>
            <ul className="privacy-policy__list">
              <li>HTTPS를 통한 암호화된 통신</li>
              <li>서버 접근 권한 관리</li>
              <li>정기적인 보안 점검 및 업데이트</li>
            </ul>
          </section>

          <section className="privacy-policy__section">
            <Typography variant="h2" component="h2">
              7. 정책 변경
            </Typography>
            <Typography variant="body-medium">
              본 개인정보처리방침은 법령 및 정책 변경에 따라 변경될 수 있습니다. 변경 사항은 앱 내 공지 또는 웹사이트를
              통해 안내합니다.
            </Typography>
          </section>

          <section className="privacy-policy__section">
            <Typography variant="h2" component="h2">
              8. 문의처
            </Typography>
            <Typography variant="body-medium">
              개인정보 처리와 관련하여 문의사항이 있으시면 다음으로 연락해 주세요:
            </Typography>
            <div className="privacy-policy__contact">
              <Typography variant="body-medium">
                <strong>이메일:</strong> support@spark-platform.com
              </Typography>
            </div>
          </section>
        </Stack>
      </Paper>
    </Container>
  );
}
