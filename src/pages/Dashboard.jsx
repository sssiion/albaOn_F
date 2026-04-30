import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getStores, createStore, getStoreStats } from '../api/stores'; 

import { removeToken } from '../lib/auth';

export default function Dashboard() {
  const [user, setUser]         = useState(null);
  const [stores, setStores]     = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', business_type: '' });
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/auth/me').then(r => setUser(r.data));
    loadStores();
  }, []);

  const loadStores = async () => {
    const res = await getStores();
    setStores(res.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await createStore(form);
    setForm({ name: '', business_type: '' });
    setShowForm(false);
    await loadStores();
    setLoading(false);
  };

  const TYPES = ['편의점', '카페', '식당', 'PC방', '노래방', '기타'];

  return (
    <div style={{ minHeight:'100vh', background:'#f7f6f2', fontFamily:'Noto Sans KR, sans-serif' }}>

      {/* 헤더 */}
      <header style={{
        background:'#1a1a1a', color:'#fff',
        padding:'1rem 2rem',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'1.1rem' }}>🤖</span>
          <span style={{ fontWeight:700, fontSize:'1rem' }}>알바온</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ fontSize:'.85rem', color:'rgba(255,255,255,.6)' }}>
            {user?.name}님
          </span>
          <button onClick={() => { removeToken(); navigate('/login'); }} style={{
            background:'rgba(255,255,255,.1)', color:'#fff',
            border:'1px solid rgba(255,255,255,.15)',
            borderRadius:'8px', padding:'.4rem .9rem',
            fontSize:'.82rem', cursor:'pointer'
          }}>로그아웃</button>
        </div>
      </header>

      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'2rem' }}>

        {/* 인삿말 */}
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontSize:'1.6rem', fontWeight:900, letterSpacing:'-1px' }}>
            안녕하세요, {user?.name}님 👋
          </h1>
          <p style={{ fontSize:'.9rem', color:'#6b6560', marginTop:'.35rem' }}>
            매장을 선택하거나 새로 추가해주세요.
          </p>
        </div>

        {/* 매장 추가 버튼 */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
          <button onClick={() => setShowForm(!showForm)} style={{
            background:'#1a1a1a', color:'#fff', fontWeight:700,
            fontSize:'.88rem', padding:'.65rem 1.25rem',
            borderRadius:'10px', border:'none', cursor:'pointer'
          }}>+ 매장 추가</button>
        </div>

        {/* 매장 추가 폼 */}
        {showForm && (
          <form onSubmit={handleCreate} style={{
            background:'#fff', border:'1.5px solid #1a1a1a',
            borderRadius:'14px', padding:'1.5rem', marginBottom:'1.25rem'
          }}>
            <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>새 매장 등록</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
              <input
                placeholder="매장명 (예: 행복편의점 강동점)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{
                  padding:'.75rem 1rem', borderRadius:'8px',
                  border:'1px solid #e2ddd5', fontSize:'.9rem',
                  outline:'none', fontFamily:'inherit'
                }}
              />
              <select
                value={form.business_type}
                onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))}
                style={{
                  padding:'.75rem 1rem', borderRadius:'8px',
                  border:'1px solid #e2ddd5', fontSize:'.9rem',
                  background:'#fff', fontFamily:'inherit'
                }}
              >
                <option value="">업종 선택</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ display:'flex', gap:'.5rem' }}>
                <button type="submit" disabled={loading} style={{
                  flex:1, background:'#1a1a1a', color:'#fff',
                  fontWeight:700, padding:'.75rem', borderRadius:'8px',
                  border:'none', cursor:'pointer', fontFamily:'inherit'
                }}>
                  {loading ? '등록 중...' : '매장 등록하기'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding:'.75rem 1.25rem', borderRadius:'8px',
                  border:'1px solid #e2ddd5', background:'transparent',
                  cursor:'pointer', fontFamily:'inherit'
                }}>취소</button>
              </div>
            </div>
          </form>
        )}

        {/* 매장 목록 */}
        {stores.length === 0 ? (
          <div style={{
            background:'#fff', border:'1px solid #e2ddd5',
            borderRadius:'16px', padding:'4rem 2rem', textAlign:'center'
          }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🏪</div>
            <p style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'.5rem' }}>
              아직 등록된 매장이 없어요
            </p>
            <p style={{ fontSize:'.88rem', color:'#6b6560' }}>
              위에서 매장을 추가해주세요
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
            {stores.map(store => (
              <StoreCard
                key={store.id}
                store={store}
                onClick={() => navigate(`/store/${store.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 매장 카드 컴포넌트
function StoreCard({ store, onClick }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    import('../api/stores').then(m =>
      m.getStoreStats(store.id).then(r => setStats(r.data))
    );
  }, [store.id]);

  return (
    <div
      onClick={onClick}
      style={{
        background:'#fff', border:'1px solid #e2ddd5',
        borderRadius:'14px', padding:'1.25rem 1.5rem',
        cursor:'pointer', transition:'all .2s',
        display:'grid', gridTemplateColumns:'1fr auto',
        gap:'1rem', alignItems:'center'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#1a1a1a';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#e2ddd5';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.3rem' }}>
          <span style={{ fontWeight:700, fontSize:'1rem' }}>{store.name}</span>
          {store.business_type && (
            <span style={{
              background:'#f0ede6', fontSize:'.72rem', fontWeight:600,
              padding:'2px 8px', borderRadius:'6px', color:'#6b6560'
            }}>{store.business_type}</span>
          )}
        </div>
        <div style={{ fontSize:'.8rem', color:'#a09b94' }}>
          초대코드: <code style={{
            background:'#f0ede6', padding:'1px 6px',
            borderRadius:'4px', fontSize:'.78rem'
          }}>{store.invite_code}</code>
        </div>
      </div>

      {/* 통계 미니 뱃지 */}
      {stats && (
        <div style={{ display:'flex', gap:'.5rem', flexShrink:0 }}>
          <StatBadge label="오늘 질문" value={stats.todayQuestions} color="#1a1a1a" />
          {stats.unanswered > 0 && (
            <StatBadge label="미답변" value={stats.unanswered} color="#ff3b3b" />
          )}
          <StatBadge label="알바생" value={stats.workerCount} color="#00c96e" />
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      background:'#f7f6f2', border:'1px solid #e2ddd5',
      borderRadius:'10px', padding:'.4rem .75rem', minWidth:'52px'
    }}>
      <span style={{ fontWeight:900, fontSize:'1rem', color }}>{value}</span>
      <span style={{ fontSize:'.65rem', color:'#a09b94', marginTop:'1px' }}>{label}</span>
    </div>
  );
}