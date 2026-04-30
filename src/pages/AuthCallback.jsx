import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthCallback 실행됨');
    console.log('전체 URL:', window.location.href);
    console.log('search:', window.location.search);

    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    console.log('token:', token);

    if (token) {
      saveToken(token);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}