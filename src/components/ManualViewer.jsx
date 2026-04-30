import { useState } from 'react';
import { updateManual, deleteManual } from '../api/manuals';

export default function ManualViewer({ storeId, manuals, onUpdate }) {
  const [editingId, setEditingId]     = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading]         = useState(false);

  const handleEdit = (manual) => {
    setEditingId(manual.id);
    setEditContent(manual.content);
  };

  const handleSave = async (manualId) => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await updateManual(storeId, manualId, { content: editContent });
      setEditingId(null);
      await onUpdate();
    } catch (err) {
      alert('수정 실패: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (manualId) => {
    if (!confirm('삭제할까요?')) return;
    await deleteManual(storeId, manualId);
    await onUpdate();
  };

  if (manuals.length === 0) return (
    <div style={{
      background:'#fff', border:'1px solid #e2ddd5',
      borderRadius:'14px', padding:'3rem', textAlign:'center',
      color:'#6b6560', fontSize:'.88rem'
    }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📖</div>
      <p style={{ fontWeight:700, marginBottom:'.4rem' }}>아직 매뉴얼이 없어요</p>
      <p>매뉴얼 입력 탭에서 추가해주세요</p>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {manuals.map(m => (
        <div key={m.id} style={{
          background:'#fff', border:'1px solid #e2ddd5',
          borderRadius:'14px', padding:'1.5rem'
        }}>
          {/* 제목 + 버튼 */}
          <div style={{
            display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'1rem'
          }}>
            <div style={{ fontWeight:700, fontSize:'1rem' }}>
              {m.title}
            </div>
            <div style={{ display:'flex', gap:'.5rem' }}>
              {editingId !== m.id && (
                <>
                  <button onClick={() => handleEdit(m)} style={{
                    background:'transparent', border:'1px solid #e2ddd5',
                    borderRadius:'6px', padding:'.3rem .7rem',
                    fontSize:'.78rem', cursor:'pointer', color:'#6b6560'
                  }}>✏️ 수정</button>
                  <button onClick={() => handleDelete(m.id)} style={{
                    background:'transparent', border:'1px solid #ffc9c9',
                    borderRadius:'6px', padding:'.3rem .7rem',
                    fontSize:'.78rem', cursor:'pointer', color:'#ff3b3b'
                  }}>삭제</button>
                </>
              )}
            </div>
          </div>

          {/* 내용 */}
          {editingId === m.id ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={10}
                style={{
                  padding:'.75rem 1rem', borderRadius:'8px',
                  border:'1px solid #1a1a1a', fontSize:'.88rem',
                  outline:'none', resize:'vertical',
                  fontFamily:'inherit', lineHeight:1.7
                }}
              />
              <div style={{ display:'flex', gap:'.5rem' }}>
                <button onClick={() => handleSave(m.id)} disabled={loading} style={{
                  flex:1, background:'#1a1a1a', color:'#fff',
                  fontWeight:700, padding:'.75rem', borderRadius:'8px',
                  border:'none', cursor:'pointer', fontFamily:'inherit'
                }}>
                  {loading ? '저장 중...' : '저장하기'}
                </button>
                <button onClick={() => setEditingId(null)} style={{
                  padding:'.75rem 1.25rem', borderRadius:'8px',
                  border:'1px solid #e2ddd5', background:'transparent',
                  cursor:'pointer', fontFamily:'inherit'
                }}>취소</button>
              </div>
            </div>
          ) : (
            <div style={{
              fontSize:'.88rem', color:'#3d3d3a',
              lineHeight:1.8, whiteSpace:'pre-wrap'
            }}>
              {m.content}
            </div>
          )}

          <div style={{
            marginTop:'1rem', fontSize:'.75rem', color:'#a09b94'
          }}>
            {new Date(m.created_at).toLocaleDateString('ko-KR')} 등록
          </div>
        </div>
      ))}
    </div>
  );
}
