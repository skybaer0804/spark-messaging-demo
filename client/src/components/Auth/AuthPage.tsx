import { useState } from 'preact/hooks';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState';
import { Box } from '@/ui-components/Layout/Box';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { TextField } from '@/ui-components/TextField/TextField';
import { Button } from '@/ui-components/Button/Button';
import { Stack } from '@/ui-components/Layout/Stack';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });
  const { signIn, signUp, loading } = useAuth();
  const { navigate } = useRouterState();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signIn({ email: formData.email, password: formData.password });
      } else {
        await signUp(formData);
      }
      navigate('/chatapp');
    } catch (error) {
      console.error('Authentication failed:', error);
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
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
            </Button>
            <Button variant="text" fullWidth onClick={() => setIsLogin(!isLogin)} disabled={loading}>
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
