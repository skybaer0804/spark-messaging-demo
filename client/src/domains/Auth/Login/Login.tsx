import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState';
import { TextField } from '@/ui-components/TextField/TextField';
import { Button } from '@/ui-components/Button/Button';
import { Grid } from '@/ui-components/Layout/Grid';
import { Checkbox } from '@/ui-components/Checkbox/Checkbox';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';
import { IconEye, IconEyeOff, IconMail, IconLock } from '@tabler/icons-preact';
import './Login.scss';

export function Login() {
  const [email, setEmail] = useState('test@naver.com');
  const [password, setPassword] = useState('test2026,.');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, loading } = useAuth();
  const { navigate } = useRouterState();

  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      await signIn({ email, password });

      if (rememberMe) {
        localStorage.setItem('saved_email', email);
      } else {
        localStorage.removeItem('saved_email');
      }

      navigate('/chatapp');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AuthLayout title="환영합니다!" subtitle="계정에 로그인하여 시작하세요.">
      <form onSubmit={handleSubmit} className="login-form">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="이메일 주소"
              type="email"
              value={email}
              onInput={(e: any) => setEmail(e.target.value)}
              placeholder="example@spark.com"
              required
              fullWidth
              className="login-form__input"
              startAdornment={<IconMail size={20} />}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onInput={(e: any) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              fullWidth
              className="login-form__input"
              startAdornment={<IconLock size={20} />}
              endAdornment={
                <button
                  type="button"
                  className="login-form__password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </button>
              }
            />
          </Grid>

          <Grid item xs={12}>
            <div className="login-form__options">
              <Checkbox label="아이디 저장" checked={rememberMe} onChange={(checked) => setRememberMe(checked)} />
              <Button variant="text" size="sm" className="login-form__forgot-password">
                비밀번호를 잊으셨나요?
              </Button>
            </div>
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="primary" fullWidth disabled={loading} className="login-form__submit">
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Grid>

          <Grid item xs={12}>
            <div className="login-form__footer">
              <span>계정이 없으신가요?</span>
              <Button variant="text" onClick={() => navigate('/signup')}>
                회원가입
              </Button>
            </div>
          </Grid>
        </Grid>
      </form>
    </AuthLayout>
  );
}
