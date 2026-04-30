import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoreByInvite, joinStore } from '../api/invite';
import { getToken } from '../lib/auth';

export default function Join() {
  const { inviteCode } = useParams();
  const navigate       = useNavigate();
  const [store, setStore]   = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStoreByInvite(inviteCode)
      .then(r => setStore(r.data))
      .catch(() => setError('유효하지 않은 초대 링크예요.'));
  }, [inviteCode]);

  const handleJoin = async () => {
    // 로그인 안 했으면 로그인 먼저
    if (!getToken()) {
      localStorage.setItem('pending_invite', inviteCode);
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await joinStore(inviteCode);
      navigate(`/chat/${res.data.storeId}`);
    } catch {
      setError('합류 중 오류가 생겼어요. 다시 시도해주세요.');
    }
    setLoading(false);
  };

  if (error) return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      height:'100vh', gap:'1rem', fontFamily:'Noto Sans KR, sans-serif'
    }}>
      <div style={{ fontSize:'3rem' }}>😥</div>
      <p style={{ fontWeight:700 }}>{error}</p>
      <button onClick={() => navigate('/')} style={{
        padding:'.65rem 1.5rem', borderRadius:'8px',
        background:'#1a1a1a', color:'#fff', border:'none', cursor:'pointer'
      }}>홈으로</button>
    </div>
  );

  if (!store) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', fontFamily:'Noto Sans KR, sans-serif'
    }}>
      초대 링크 확인 중...
    </div>
  );

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      height:'100vh', gap:'1rem', padding:'2rem',
      fontFamily:'Noto Sans KR, sans-serif', background:'#f7f6f2'
    }}>
      <div style={{ fontSize:'3.5rem' }}>🏪</div>
      <h1 style={{ fontWeight:900, fontSize:'1.5rem', letterSpacing:'-1px' }}>
        {store.name}
      </h1>
      <p style={{ color:'#6b6560', textAlign:'center', lineHeight:1.7 }}>
        {store.business_type} 매장에 합류하면<br/>
        AI가 24시간 궁금한 거 답변해드려요 🤖
      </p>
      <button onClick={handleJoin} disabled={loading} style={{
        background:'#1a1a1a', color:'#fff', fontWeight:700,
        fontSize:'1rem', padding:'.9rem 2.5rem',
        borderRadius:'12px', border:'none', cursor:'pointer',
        marginTop:'.5rem', fontFamily:'inherit'
      }}>
        {loading ? '합류 중...' : '이 매장 알바로 합류하기'}
      </button>
      <p style={{ fontSize:'.78rem', color:'#a09b94' }}>
        카카오 로그인이 필요해요
      </p>
    </div>
  );
}