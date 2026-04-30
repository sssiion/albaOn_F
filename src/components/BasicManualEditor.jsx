import { useState, useRef } from 'react';
import { createBasicManual } from '../api/manuals';
import { uploadMedia, deleteMedia } from '../api/media';

export default function BasicManualEditor({ storeId, manuals, onUpdate }) {
  const [content, setContent]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [saved, setSaved]       = useState(false);
  const [selectedManual, setSelectedManual] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await createBasicManual(storeId, { content });
      setContent('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await onUpdate();
    } catch (err) {
      alert('저장 실패: ' + err.message);
    }
    setLoading(false);
  };

  const handleMediaUpload = async (manualId, file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadMedia(manualId, formData);
      await onUpdate();
    } catch (err) {
      alert('업로드 실패: ' + err.message);
    }
    setUploading(false);
  };

  const handleMediaDelete = async (mediaId) => {
    if (!confirm('삭제할까요?')) return;
    await deleteMedia(mediaId);
    await onUpdate();
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

      {/* 입력 폼 */}
      <div style={{
        background:'#fff', border:'1px solid #e2ddd5',
        borderRadius:'14px', padding:'1.5rem'
      }}>
        <h2 style={{ fontWeight:700, fontSize:'1rem', marginBottom:'.25rem' }}>
          📗 기초 매뉴얼 입력
        </h2>
        <p style={{ fontSize:'.82rem', color:'#6b6560', marginBottom:'1rem' }}>
          첫 출근하는 알바생이 봐야 할 내용을 입력해주세요
        </p>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
          <textarea
            placeholder={`첫 출근 알바생을 위한 기초 내용을 입력해주세요.\n\n예시)\n출근하면 먼저 유니폼 갈아입고...\n카운터 비밀번호는...\n POS 켜는 방법은...`}
            value={content}
            onChange={e => setContent(e.target.value)}
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

      {/* 저장된 기초 매뉴얼 목록 */}
      <h3 style={{ fontWeight:700, fontSize:'.95rem' }}>
        저장된 기초 매뉴얼 ({manuals.length}개)
      </h3>

      {manuals.length === 0 ? (
        <div style={{
          background:'#fff', border:'1px solid #e2ddd5',
          borderRadius:'14px', padding:'3rem', textAlign:'center',
          color:'#6b6560', fontSize:'.88rem'
        }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📗</div>
          <p style={{ fontWeight:700 }}>아직 기초 매뉴얼이 없어요</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
          {manuals.map(m => (
            <div key={m.id} style={{
              background:'#fff', border:'1px solid #e2ddd5',
              borderRadius:'14px', overflow:'hidden'
            }}>
              {/* 헤더 */}
              <div
                onClick={() => setSelectedManual(selectedManual === m.id ? null : m.id)}
                style={{
                  padding:'1rem 1.25rem', cursor:'pointer',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background: selectedManual === m.id ? '#f7f6f2' : '#fff'
                }}
              >
                <div>
                  <div style={{ fontWeight:700, fontSize:'.9rem' }}>{m.title}</div>
                  <div style={{ fontSize:'.75rem', color:'#a09b94', marginTop:'.2rem' }}>
                    {new Date(m.created_at).toLocaleDateString('ko-KR')}
                    {m.manual_media?.length > 0 && (
                      <span style={{ marginLeft:'.5rem' }}>
                        📎 {m.manual_media.length}개
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color:'#a09b94' }}>
                  {selectedManual === m.id ? '▲' : '▼'}
                </span>
              </div>

              {/* 내용 + 미디어 */}
              {selectedManual === m.id && (
                <div style={{ padding:'1.25rem', borderTop:'1px solid #e2ddd5' }}>

                  {/* 원본 텍스트 */}
                  <div style={{
                    fontSize:'.88rem', color:'#3d3d3a',
                    lineHeight:1.75, whiteSpace:'pre-wrap',
                    background:'#f7f6f2', padding:'.85rem 1rem',
                    borderRadius:'8px', marginBottom:'1rem'
                  }}>
                    {m.original_content || m.content}
                  </div>

                  {/* 미디어 목록 */}
                  {m.manual_media?.length > 0 && (
                    <div style={{ marginBottom:'1rem' }}>
                      <div style={{ fontWeight:700, fontSize:'.85rem', marginBottom:'.75rem' }}>
                        첨부 파일
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'.75rem' }}>
                        {m.manual_media.map(media => (
                          <div key={media.id} style={{
                            position:'relative', borderRadius:'10px',
                            overflow:'hidden', border:'1px solid #e2ddd5'
                          }}>
                            {media.type === 'image' ? (
                              <img
                                src={media.url}
                                alt={media.caption || '이미지'}
                                style={{ width:'140px', height:'100px', objectFit:'cover', display:'block' }}
                              />
                            ) : (
                              <video
                                src={media.url}
                                controls
                                style={{ width:'200px', height:'120px', display:'block' }}
                              />
                            )}
                            {media.caption && (
                              <div style={{
                                padding:'.3rem .5rem', fontSize:'.75rem',
                                color:'#6b6560', background:'#f7f6f2'
                              }}>
                                {media.caption}
                              </div>
                            )}
                            <button
                              onClick={() => handleMediaDelete(media.id)}
                              style={{
                                position:'absolute', top:'4px', right:'4px',
                                background:'rgba(0,0,0,.5)', color:'#fff',
                                border:'none', borderRadius:'50%',
                                width:'22px', height:'22px',
                                cursor:'pointer', fontSize:'.75rem',
                                display:'flex', alignItems:'center', justifyContent:'center'
                              }}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 미디어 업로드 */}
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,video/*"
                      style={{ display:'none' }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) handleMediaUpload(m.id, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => fileRef.current.click()}
                      disabled={uploading}
                      style={{
                        background:'transparent',
                        border:'1.5px dashed #e2ddd5',
                        borderRadius:'10px', padding:'.65rem 1.25rem',
                        fontSize:'.85rem', cursor:'pointer',
                        color:'#6b6560', fontFamily:'inherit',
                        width:'100%', transition:'border-color .2s'
                      }}
                    >
                      {uploading ? '업로드 중...' : '📎 이미지 / 영상 추가하기'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
