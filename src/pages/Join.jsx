import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Join() {
  const { inviteCode } = useParams();
  const navigate       = useNavigate();
  const [store, setStore]   = useState(null);
  const [name, setName]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/api/invite/${inviteCode}`)
      .then(r => setStore(r.data))
      .catch(() => setError('유효하지 않은 초대 링크예요.'));
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!name.trim()) return;
    setLoading(true);

    // 이름을 로컬스토리지에 저장
    localStorage.setItem('worker_name', name.trim());
    localStorage.setItem('invite_code', inviteCode);

    navigate(`/chat/${store.id}?name=${encodeURIComponent(name.trim())}`);
    setLoading(false);
  };

  if (error) return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      height:'100vh', gap:'1rem',
      fontFamily:'Noto Sans KR, sans-serif'
    }}>
      <div style={{ fontSize:'3rem' }}>😥</div>
      <p style={{ fontWeight:700 }}>{error}</p>
    </div>
  );

  if (!store) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', fontFamily:'Noto Sans KR, sans-serif'
    }}>확인 중...</div>
  );

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      height:'100vh', gap:'1rem', padding:'2rem',
      fontFamily:'Noto Sans KR, sans-serif',
      background:'#f7f6f2'
    }}>
      <div style={{ fontSize:'3.5rem' }}>🏪</div>
      <h1 style={{
        fontWeight:900, fontSize:'1.5rem',
        letterSpacing:'-1px', textAlign:'center'
      }}>
        {store.name}
      </h1>
      <p style={{ color:'#6b6560', textAlign:'center', lineHeight:1.7 }}>
        이름을 입력하면 바로 입장할 수 있어요 🤖
      </p>

      <div style={{ width:'100%', maxWidth:'320px', display:'flex', flexDirection:'column', gap:'.75rem' }}>
        <input
          placeholder="이름 입력 (예: 홍길동)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          style={{
            padding:'.85rem 1rem', borderRadius:'10px',
            border:'1.5px solid #e2ddd5', fontSize:'1rem',
            outline:'none', fontFamily:'inherit',
            textAlign:'center'
          }}
          autoFocus
        />
        <button
          onClick={handleJoin}
          disabled={loading || !name.trim()}
          style={{
            background: name.trim() ? '#1a1a1a' : '#e2ddd5',
            color: name.trim() ? '#fff' : '#a09b94',
            fontWeight:700, fontSize:'1rem',
            padding:'.9rem', borderRadius:'10px',
            border:'none', cursor: name.trim() ? 'pointer' : 'default',
            fontFamily:'inherit', transition:'all .2s'
          }}
        >
          {loading ? '입장 중...' : '바로 입장하기 →'}
        </button>
      </div>
    </div>
  );
}
