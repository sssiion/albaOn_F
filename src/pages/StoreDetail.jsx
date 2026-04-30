import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStore } from '../api/stores';
import { getChatLogs, reanswer } from '../api/chat';
import AudioUpload from '../components/AudioUpload';
import ManualViewer from '../components/ManualViewer';
import { getManuals, createManual, deleteManual, updateManual, getBasicManuals, createBasicManual } from '../api/manuals';
import BasicManualEditor from '../components/BasicManualEditor';

export default function StoreDetail() {
  const { storeId } = useParams();
  const navigate    = useNavigate();
  const [store, setStore]     = useState(null);
  const [manuals, setManuals] = useState([]);
  const [logs, setLogs]       = useState([]);
  const [tab, setTab]         = useState('manual'); // manual | logs
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [form, setForm] = useState({ content: '', editingId: null });

  const [basicManuals, setBasicManuals] = useState([]);
  const [basicForm, setBasicForm]       = useState({ content: '', editingId: null });
  
  const loadBasicManuals = async () => {
    const res = await getBasicManuals(storeId);
    setBasicManuals(res.data);
  };

  useEffect(() => {
    getStore(storeId).then(r => setStore(r.data));
    loadManuals();
    loadLogs();
    loadBasicManuals(); 
  }, [storeId]);
  
  const handleReanswer = async (logId) => {
  try {
    await reanswer(storeId, logId);
    await loadLogs();
    alert('✅ 재답변 완료!');
  } catch (err) {
    alert('재답변 실패: ' + err.message);
  }
};

  
  const loadManuals = async () => {
    const res = await getManuals(storeId);
    setManuals(res.data);
  };

  const loadLogs = async () => {
    const res = await getChatLogs(storeId);
    setLogs(res.data);
  };

  const handleSave = async (e) => {
  e.preventDefault();
  if (!form.content.trim()) return;
  setLoading(true);

  try {
    if (form.editingId) {
      // 수정 모드 — 기존 매뉴얼 업데이트
      await updateManual(form.editingId, { content: form.content });
    } else {
      // 새 매뉴얼 추가
      await createManual(storeId, { content: form.content });
    }
    setForm({ content: '', editingId: null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await loadManuals();
  } catch (err) {
    alert('저장 실패: ' + err.message);
  }
  setLoading(false);
};

  const handleDelete = async (manualId) => {
    if (!confirm('삭제할까요?')) return;
    await deleteManual(storeId, manualId);
    await loadManuals();
  };

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/join/${store.invite_code}`;
    navigator.clipboard.writeText(link);
    alert('초대 링크 복사됐어요! 알바생한테 카톡으로 보내주세요 📲');
  };

  const unansweredLogs = logs.filter(l => !l.is_answered);
  

  if (!store) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      로딩 중...
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f7f6f2', fontFamily:'Noto Sans KR, sans-serif' }}>

      {/* 헤더 */}
      <header style={{
        background:'#1a1a1a', color:'#fff',
        padding:'1rem 2rem',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <button onClick={() => navigate('/dashboard')} style={{
          background:'transparent', border:'none',
          color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:'.88rem'
        }}>← 대시보드</button>
        <span style={{ fontWeight:700 }}>{store.name}</span>
        <button onClick={handleCopyInvite} style={{
          background:'#00c96e', color:'#000', fontWeight:700,
          fontSize:'.82rem', padding:'.5rem 1rem',
          borderRadius:'8px', border:'none', cursor:'pointer'
        }}>🔗 초대 링크</button>
      </header>

      {/* 탭 */}
      <div style={{
        background:'#fff', borderBottom:'1px solid #e2ddd5',
        display:'flex', padding:'0 2rem'
      }}>
        {[
          { key:'manual', label:'📝 매뉴얼 관리' },
          { key:'view',   label:'📖 매뉴얼 보기' },  
          { key:'basic', label:'📗 기초 매뉴얼' },
          { key:'logs',   label:`💬 질문 로그 ${unansweredLogs.length > 0 ? `(미답변 ${unansweredLogs.length})` : ''}` }
      
      
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding:'1rem 1.25rem', border:'none',
              background:'transparent', cursor:'pointer',
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#1a1a1a' : '#6b6560',
              borderBottom: tab === t.key ? '2px solid #1a1a1a' : '2px solid transparent',
              fontSize:'.9rem', fontFamily:'inherit',
              transition:'all .2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'2rem' }}>

        {/* 매뉴얼 탭 */}
        {tab === 'manual' && (
          <>
            <AudioUpload
            storeId={storeId}
            onComplete={(text) => {
                setForm(f => ({ ...f, content: text, title: '녹음 자동 정리' }));
                // 자동으로 저장까지
                createManual(storeId, { title: '녹음 자동 정리', content: text })
                .then(() => loadManuals());
            }}
            />
            <div style={{
              background:'#fff', border:'1px solid #e2ddd5',
              borderRadius:'14px', padding:'1.5rem', marginBottom:'1.5rem'
            }}>
              <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
  <textarea
    placeholder={`자유롭게 입력해주세요.\n\n예시)\n환불은 POS에서 반품 누르고 영수증 스캔하면 돼\n담배는 계산대 뒤 2번 서랍에 있어\n새벽 폐기는 7시에 도시락부터\n카드 오류나면 뒤 전원 5초`}
    value={form.content}
    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
    rows={8}
    style={{
      padding:'.75rem 1rem', borderRadius:'8px',
      border:'1px solid #e2ddd5', fontSize:'.9rem',
      outline:'none', resize:'vertical',
      fontFamily:'inherit', lineHeight:1.65
    }}
  />
  <button type="submit" disabled={loading} style={{
    background: saved ? '#00c96e' : '#1a1a1a',
    color: saved ? '#000' : '#fff',
    fontWeight:700, padding:'.8rem', borderRadius:'8px',
    border:'none', cursor:'pointer',
    fontFamily:'inherit', transition:'background .3s'
  }}>
    {loading ? 'AI가 정리 중...' : saved ? '✅ 저장됐어요!' : 'AI가 정리해서 저장하기'}
  </button>
</form>
            </div>

            {/* 저장된 매뉴얼 */}
            <h3 style={{ fontWeight:700, fontSize:'.95rem', marginBottom:'.85rem' }}>
              저장된 매뉴얼 ({manuals.length}개)
            </h3>
            {manuals.length === 0 ? (
              <EmptyState icon="📋" text="아직 매뉴얼이 없어요" sub="위에서 입력해주세요" />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
                {manuals.map(m => (
                <div key={m.id} style={{
                  background:'#fff', border:'1px solid #e2ddd5',
                  borderRadius:'12px', padding:'1rem 1.25rem',
                  display:'flex', flexDirection:'column', gap:'.75rem'
                }}>
                  {/* 제목 + 버튼 */}
                  <div style={{
                    display:'flex', justifyContent:'space-between',
                    alignItems:'center'
                  }}>
                    <div style={{ fontWeight:700, fontSize:'.88rem' }}>
                      {m.title}
                    </div>
                    <div style={{ display:'flex', gap:'.5rem' }}>
                      <button
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            content: m.original_content || m.content,
                            editingId: m.id  // 수정 모드 표시
                          }));
                          window.scrollTo(0, 0);
                        }}
                        style={{
                          background:'transparent', border:'1px solid #e2ddd5',
                          borderRadius:'6px', padding:'.3rem .7rem',
                          fontSize:'.75rem', cursor:'pointer', color:'#6b6560'
                        }}
                      >✏️ 수정</button>
                      <button onClick={() => handleDelete(m.id)} style={{
                        background:'transparent', border:'1px solid #ffc9c9',
                        borderRadius:'6px', padding:'.3rem .7rem',
                        fontSize:'.75rem', cursor:'pointer', color:'#ff3b3b'
                      }}>삭제</button>
                    </div>
                  </div>
              
                  {/* 원본 텍스트 */}
                  <div style={{
                    fontSize:'.85rem', color:'#3d3d3a',
                    lineHeight:1.75, whiteSpace:'pre-wrap',
                    background:'#f7f6f2', padding:'.85rem 1rem',
                    borderRadius:'8px'
                  }}>
                    {m.original_content || m.content}
                  </div>
                </div>
              ))}
              </div>
            )}
          </>
        )}
        {tab === 'basic' && (
        <BasicManualEditor
          storeId={storeId}
          manuals={basicManuals}
          onUpdate={loadBasicManuals}
        />
      )}
        {/* 매뉴얼 보기 탭 */}
        {tab === 'view' && (
          <ManualViewer
            storeId={storeId}
            manuals={manuals}
            onUpdate={loadManuals}
          />
        )}
        {/* 질문 로그 탭 */}
        {tab === 'logs' && (
          <>
            {/* 미답변 알림 */}
            {unansweredLogs.length > 0 && (
              <div style={{
                background:'#fff0f0', border:'1px solid #ffc9c9',
                borderRadius:'12px', padding:'1rem 1.25rem',
                marginBottom:'1.25rem', display:'flex',
                alignItems:'center', gap:'.75rem'
              }}>
                <span style={{ fontSize:'1.5rem' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:'.9rem', color:'#ff3b3b' }}>
                    AI가 답변 못한 질문이 {unansweredLogs.length}개 있어요
                  </div>
                  <div style={{ fontSize:'.82rem', color:'#6b6560', marginTop:'.2rem' }}>
                    아래에서 확인하고 매뉴얼에 추가해주세요
                  </div>
                </div>
              </div>
            )}

            {logs.length === 0 ? (
              <EmptyState icon="💬" text="아직 질문이 없어요" sub="알바생이 채팅하면 여기 쌓여요" />
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                {logs.map(log => (
                  <div key={log.id} style={{
                    background:'#fff',
                    border: `1px solid ${log.is_answered ? '#e2ddd5' : '#ffc9c9'}`,
                    borderRadius:'12px', padding:'1.1rem 1.25rem'
                  }}>
                    {/* 질문 */}
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.6rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                        <span style={{ fontSize:'.75rem', fontWeight:700,
                          background: log.is_answered ? '#e8faf1' : '#fff0f0',
                          color: log.is_answered ? '#00a558' : '#ff3b3b',
                          padding:'2px 8px', borderRadius:'6px'
                        }}>
                          {log.is_answered ? '✅ 답변됨' : '❌ 미답변'}
                        </span>
                        <span style={{ fontSize:'.75rem', color:'#a09b94' }}>
                        {log.worker_name || '알바생'} · {new Date(log.created_at).toLocaleString('ko-KR', {
                          month:'numeric', day:'numeric',
                          hour:'numeric', minute:'numeric'
                        })}
                      </span>
                      </div>
                    </div>
                    <div style={{
                      fontWeight:600, fontSize:'.88rem',
                      marginBottom:'.5rem', color:'#1a1a1a'
                    }}>
                      Q. {log.question}
                    </div>
                    <div style={{
                      fontSize:'.83rem', color:'#6b6560',
                      lineHeight:1.6, background:'#f7f6f2',
                      padding:'.65rem .9rem', borderRadius:'8px'
                    }}>
                      A. {log.answer}
                    </div>

                    {/* 미답변이면 매뉴얼 추가 유도 */}
                    {!log.is_answered && (
                    <div style={{ display:'flex', gap:'.5rem', marginTop:'.75rem', flexWrap:'wrap' }}>
                      <button
                        onClick={() => setTab('manual')}
                        style={{
                          background:'transparent', border:'1px solid #e2ddd5',
                          borderRadius:'8px', padding:'.45rem .9rem',
                          fontSize:'.78rem', cursor:'pointer',
                          color:'#6b6560', fontFamily:'inherit'
                        }}
                      >
                        + 매뉴얼에 추가하기
                      </button>
                      <button
                        onClick={() => handleReanswer(log.id)}
                        style={{
                          background:'#1a1a1a', color:'#fff',
                          border:'none', borderRadius:'8px',
                          padding:'.45rem .9rem', fontSize:'.78rem',
                          cursor:'pointer', fontFamily:'inherit'
                        }}
                      >
                        🔄 매뉴얼로 재답변
                      </button>
                    </div>
                  )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={{
      background:'#fff', border:'1px solid #e2ddd5',
      borderRadius:'14px', padding:'3rem 2rem', textAlign:'center'
    }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>{icon}</div>
      <p style={{ fontWeight:700, marginBottom:'.4rem' }}>{text}</p>
      <p style={{ fontSize:'.85rem', color:'#6b6560' }}>{sub}</p>
    </div>
  );
}
