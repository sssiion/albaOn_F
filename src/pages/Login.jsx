import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { saveToken } from '../lib/auth';

export default function Login() {
  const [mode, setMode]     = useState('login'); // login | register
  const [name, setName]     = useState('');
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || pin.length !== 4) return;
    setError('');
    setLoading(true);

    try {
      const res = mode === 'login'
        ? await login(name.trim(), pin)
        : await register(name.trim(), pin);

      saveToken(res.data.token);
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.error || '오류가 생겼어요. 다시 시도해주세요.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#f7f6f2',
      fontFamily:'Noto Sans KR, sans-serif', padding:'2rem'
    }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🤖</div>
      <h1 style={{
        fontWeight:900, fontSize:'1.75rem',
        letterSpacing:'-1px', marginBottom:'.5rem'
      }}>알바온</h1>
      <p style={{ color:'#6b6560', marginBottom:'2rem', fontSize:'.9rem' }}>
        새벽 전화 없애는 알바 온보딩 AI
      </p>

      {/* 탭 */}
      <div style={{
        display:'flex', background:'#ede9e3',
        borderRadius:'10px', padding:'4px',
        marginBottom:'1.5rem', width:'100%', maxWidth:'320px'
      }}>
        {['login', 'register'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
            style={{
              flex:1, padding:'.6rem',
              borderRadius:'8px', border:'none', cursor:'pointer',
              background: mode === m ? '#fff' : 'transparent',
              fontWeight: mode === m ? 700 : 400,
              fontSize:'.88rem', fontFamily:'inherit',
              color: mode === m ? '#1a1a1a' : '#6b6560',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              transition:'all .2s'
            }}
          >
            {m === 'login' ? '로그인' : '회원가입'}
          </button>
        ))}
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} style={{
        width:'100%', maxWidth:'320px',
        display:'flex', flexDirection:'column', gap:'.75rem'
      }}>
        <input
          placeholder="이름 (예: 김철수)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            padding:'.85rem 1rem', borderRadius:'10px',
            border:'1.5px solid #e2ddd5', fontSize:'1rem',
            outline:'none', fontFamily:'inherit'
          }}
          autoFocus
        />
        <input
          placeholder="PIN 4자리 (예: 1234)"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          type="tel"
          maxLength={4}
          style={{
            padding:'.85rem 1rem', borderRadius:'10px',
            border:'1.5px solid #e2ddd5', fontSize:'1rem',
            outline:'none', fontFamily:'inherit',
            letterSpacing:'8px', textAlign:'center'
          }}
        />

        {error && (
          <div style={{
            background:'#fff0f0', border:'1px solid #ffc9c9',
            borderRadius:'8px', padding:'.65rem 1rem',
            fontSize:'.85rem', color:'#ff3b3b', textAlign:'center'
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !name.trim() || pin.length !== 4} style={{
          background: (name.trim() && pin.length === 4) ? '#1a1a1a' : '#e2ddd5',
          color: (name.trim() && pin.length === 4) ? '#fff' : '#a09b94',
          fontWeight:700, fontSize:'1rem',
          padding:'.9rem', borderRadius:'10px',
          border:'none', cursor:'pointer',
          fontFamily:'inherit', transition:'all .2s'
        }}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>
    </div>
  );
}
