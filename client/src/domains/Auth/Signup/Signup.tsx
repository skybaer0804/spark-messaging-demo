import { useState } from 'preact/hooks';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState';
import { TextField } from '@/ui-components/TextField/TextField';
import { Button } from '@/ui-components/Button/Button';
import { Grid } from '@/ui-components/Layout/Grid';
import { AuthLayout } from '../components/AuthLayout/AuthLayout';
import { IconCircleCheckFilled, IconUser, IconMail, IconLock, IconMessage } from '@tabler/icons-preact';
import './Signup.scss';

export function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    statusText: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp, loading } = useAuth();
  const { navigate } = useRouterState();

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = '사용자 이름을 입력해주세요.';
    if (!formData.email) newErrors.email = '이메일을 입력해주세요.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = '유효한 이메일 형식이 아닙니다.';
    
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (formData.password.length < 6) newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await signUp({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        statusText: formData.statusText,
      });
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      navigate('/login');
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      if (error.message?.includes('User already exists')) {
        setErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }));
      } else {
        alert('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const RequiredBadge = () => (
    <span className="signup-form__required-badge" title="필수 입력 항목">
      <IconCircleCheckFilled size={14} />
    </span>
  );

  return (
    <AuthLayout title="계정 만들기" subtitle="Spark Messaging의 회원이 되어보세요.">
      <form onSubmit={handleSubmit} className="signup-form">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">사용자 이름</label>
              <RequiredBadge />
            </div>
            <TextField
              name="username"
              value={formData.username}
              onInput={handleInputChange}
              placeholder="홍길동"
              error={!!errors.username}
              helperText={errors.username}
              fullWidth
              startAdornment={<IconUser size={20} />}
            />
          </Grid>

          <Grid item xs={12}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">이메일 주소</label>
              <RequiredBadge />
            </div>
            <TextField
              name="email"
              type="email"
              value={formData.email}
              onInput={handleInputChange}
              placeholder="example@spark.com"
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
              startAdornment={<IconMail size={20} />}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">비밀번호</label>
              <RequiredBadge />
            </div>
            <TextField
              name="password"
              type="password"
              value={formData.password}
              onInput={handleInputChange}
              placeholder="6자 이상 입력"
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              startAdornment={<IconLock size={20} />}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">비밀번호 확인</label>
              <RequiredBadge />
            </div>
            <TextField
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onInput={handleInputChange}
              placeholder="다시 입력"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              fullWidth
              startAdornment={<IconLock size={20} />}
            />
          </Grid>

          <Grid item xs={12}>
            <div className="signup-form__field-header">
              <label className="signup-form__label">상태 메시지 (선택)</label>
            </div>
            <TextField
              name="statusText"
              value={formData.statusText}
              onInput={handleInputChange}
              placeholder="오늘의 상태를 입력하세요"
              fullWidth
              startAdornment={<IconMessage size={20} />}
            />
          </Grid>

          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              disabled={loading}
              className="signup-form__submit"
            >
              {loading ? '처리 중...' : '회원가입 완료'}
            </Button>
          </Grid>

          <Grid item xs={12}>
            <div className="signup-form__footer">
              <span>이미 계정이 있으신가요?</span>
              <Button variant="text" onClick={() => navigate('/login')}>
                로그인
              </Button>
            </div>
          </Grid>
        </Grid>
      </form>
    </AuthLayout>
  );
}
