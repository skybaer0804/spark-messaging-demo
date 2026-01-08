import { useState } from 'preact/hooks';
import { useAuth } from '@/hooks/useAuth';
import { route } from 'preact-router';
import { Box } from '@/ui-component/Layout/Box';
import { Paper } from '@/ui-component/Paper/Paper';
import { Typography } from '@/ui-component/Typography/Typography';
import { TextField } from '@/ui-component/TextField/TextField';
import { Button } from '@/ui-component/Button/Button';
import { Stack } from '@/ui-component/Layout/Stack';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const { login, register, loading } = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    let success = false;
    if (isLogin) {
      success = await login({ email: formData.email, password: formData.password });
    } else {
      success = await register(formData);
    }
    if (success) {
      route('/chatapp');
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-default)',
      }}
    >
      <Paper elevation={0} padding="xl" style={{ width: '100%', maxWidth: '400px' }}>
        <Typography variant="h2" align="center" style={{ marginBottom: '24px' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing="md">
            {!isLogin && (
              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onInput={handleInputChange}
                required
                fullWidth
              />
            )}
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onInput={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onInput={handleInputChange}
              required
              fullWidth
            />
            <Button type="submit" variant="primary" fullWidth disabled={loading.value}>
              {loading.value ? 'Processing...' : isLogin ? 'Login' : 'Register'}
            </Button>
            <Button variant="text" fullWidth onClick={() => setIsLogin(!isLogin)} disabled={loading.value}>
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

