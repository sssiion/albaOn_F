import { useRef, useState } from 'react';
import { uploadAudio } from '../api/manuals';

export default function AudioUpload({ storeId, onComplete }) {
  const [step, setStep]         = useState('idle'); // idle | uploading | preview | saving
  const [rawText, setRawText]   = useState('');
  const [organized, setOrganized] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState('');
  const fileRef = useRef();
  const [files, setFiles] = useState([]); // 선택된 파일 목록

const handleAddFile = (newFiles) => {
  if (!newFiles || newFiles.length === 0) return;
  const arr = Array.from(newFiles);
  setFiles(prev => [...prev, ...arr]);
};

const handleRemoveFile = (index) => {
  setFiles(prev => prev.filter((_, i) => i !== index));
};

const handleStart = async () => {
  if (files.length === 0) return;
  setStep('uploading');

  const allRawTexts = [];
  const allOrganized = [];

  for (let i = 0; i < files.length; i++) {
    setProgress(`음성 인식 중... (${i + 1}/${files.length})`);
    const formData = new FormData();
    formData.append('audio', files[i]);

    try {
      const res = await uploadAudio(storeId, formData);
      allRawTexts.push(res.data.rawText);
      allOrganized.push(res.data.organizedText);
    } catch (err) {
      alert(`${files[i].name} 변환 실패: ` + (err.response?.data?.error || err.message));
    }
  }

  setRawText(allRawTexts.join('\n\n---\n\n'));
  setOrganized(allOrganized.join('\n\n'));
  setFiles([]);
  setStep('preview');
};

  const handleFile = async (files) => {
  if (!files || files.length === 0) return;
  setStep('uploading');

  const allRawTexts = [];
  const allOrganized = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    setProgress(`음성 인식 중... (${i + 1}/${files.length})`);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await uploadAudio(storeId, formData);
      allRawTexts.push(res.data.rawText);
      allOrganized.push(res.data.organizedText);
    } catch (err) {
      alert(`${file.name} 변환 실패: ` + (err.response?.data?.error || err.message));
    }
  }

  setRawText(allRawTexts.join('\n\n---\n\n'));
  setOrganized(allOrganized.join('\n\n'));
  setStep('preview');
};

  const handleDrop = (e) => {
  e.preventDefault();
  setDragOver(false);
  const files = e.dataTransfer.files;
  if (files.length > 0) handleFile(files);
};

  const handleSave = () => {
  onComplete(organized);
  setStep('idle');
  setOrganized('');
  setRawText('');
  setFiles([]);
  setInputKey(k => k + 1); // ← 추가
};
  const [inputKey, setInputKey] = useState(0);

  return (
    <div style={{ marginBottom: '1.5rem' }}>

      {/* 업로드 영역 */}
      {step === 'idle' && (
  <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>

    {/* 파일 추가 버튼 */}
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); handleAddFile(e.dataTransfer.files); }}
      onClick={() => fileRef.current.click()}
      style={{
        border: `2px dashed ${dragOver ? '#1a1a1a' : '#e2ddd5'}`,
        borderRadius: '14px', padding: '2rem',
        textAlign: 'center', cursor: 'pointer',
        background: dragOver ? '#f0ede6' : '#fff',
        transition: 'all .2s'
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🎙️</div>
      <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.3rem' }}>
        녹음 파일을 추가해주세요
      </div>
      <div style={{ fontSize: '.82rem', color: '#6b6560' }}>
        MP3, MP4, WAV, M4A · 최대 25MB<br/>
        파일을 여러 번 눌러서 추가할 수 있어요
      </div>
      <input
          key={inputKey}
          ref={fileRef}
          type="file"
          accept=".mp3,.mp4,.wav,.m4a,.webm,.ogg"
          style={{ display: 'none' }}
          onChange={e => {
            handleAddFile(e.target.files);
            setInputKey(k => k + 1);
          }}
        />
    </div>

    {/* 선택된 파일 목록 */}
    {files.length > 0 && (
      <div style={{
        background:'#fff', border:'1px solid #e2ddd5',
        borderRadius:'12px', overflow:'hidden'
      }}>
        {files.map((file, i) => (
          <div key={i} style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'.75rem 1rem',
            borderBottom: i < files.length - 1 ? '1px solid #f0ede6' : 'none'
          }}>
            <div>
              <div style={{ fontSize:'.88rem', fontWeight:600 }}>{file.name}</div>
              <div style={{ fontSize:'.75rem', color:'#a09b94' }}>
                {(file.size / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
            <button onClick={() => handleRemoveFile(i)} style={{
              background:'transparent', border:'none',
              cursor:'pointer', color:'#ff3b3b', fontSize:'1rem'
            }}>×</button>
          </div>
        ))}

        {/* 변환 시작 버튼 */}
        <div style={{ padding:'.75rem 1rem' }}>
          <button onClick={handleStart} style={{
            width:'100%', background:'#1a1a1a', color:'#fff',
            fontWeight:700, padding:'.8rem', borderRadius:'8px',
            border:'none', cursor:'pointer', fontFamily:'inherit',
            fontSize:'.9rem'
          }}>
            🎙️ {files.length}개 파일 변환 시작
          </button>
        </div>
      </div>
    )}
  </div>
)}

      {/* 변환 중 */}
      {step === 'uploading' && (
        <div style={{
          background: '#fff', border: '1px solid #e2ddd5',
          borderRadius: '14px', padding: '2.5rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ fontWeight: 700, marginBottom: '.5rem' }}>AI가 분석 중이에요</div>
          <div style={{ fontSize: '.85rem', color: '#6b6560' }}>{progress}</div>
          <div style={{
            marginTop: '1.25rem', height: '4px',
            background: '#f0ede6', borderRadius: '4px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: '#1a1a1a',
              borderRadius: '4px', width: '60%',
              animation: 'loading 1.5s ease-in-out infinite'
            }} />
          </div>
          <style>{`
            @keyframes loading {
              0% { width: 10%; }
              50% { width: 80%; }
              100% { width: 10%; }
            }
          `}</style>
        </div>
      )}

      {/* 미리보기 */}
      {step === 'preview' && (
        <div style={{
          background: '#fff', border: '1.5px solid #1a1a1a',
          borderRadius: '14px', padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                ✅ AI 정리 완료
              </div>
              <div style={{ fontSize: '.8rem', color: '#6b6560', marginTop: '.2rem' }}>
                내용 확인 후 저장해주세요
              </div>
            </div>
            <button
              onClick={() => setStep('idle')}
              style={{
                background: 'transparent', border: '1px solid #e2ddd5',
                borderRadius: '8px', padding: '.4rem .85rem',
                fontSize: '.8rem', cursor: 'pointer', color: '#6b6560'
              }}
            >다시 올리기</button>
          </div>

          {/* 원본 텍스트 토글 */}
          <details style={{ marginBottom: '1rem' }}>
            <summary style={{
              fontSize: '.82rem', color: '#a09b94',
              cursor: 'pointer', marginBottom: '.5rem'
            }}>
              원본 텍스트 보기 (Whisper 변환 결과)
            </summary>
            <div style={{
              background: '#f7f6f2', borderRadius: '8px',
              padding: '.85rem', fontSize: '.8rem',
              color: '#6b6560', lineHeight: 1.65,
              maxHeight: '150px', overflowY: 'auto'
            }}>
              {rawText}
            </div>
          </details>

          {/* 정리된 매뉴얼 편집 가능 */}
          <div style={{
            fontSize: '.82rem', fontWeight: 700,
            color: '#1a1a1a', marginBottom: '.5rem'
          }}>
            AI 정리 결과 (수정 가능해요)
          </div>
          <textarea
            value={organized}
            onChange={e => setOrganized(e.target.value)}
            rows={12}
            style={{
              width: '100%', padding: '.85rem 1rem',
              borderRadius: '8px', border: '1px solid #e2ddd5',
              fontSize: '.85rem', lineHeight: 1.7,
              fontFamily: 'inherit', outline: 'none',
              resize: 'vertical'
            }}
          />
          <button
            onClick={handleSave}
            style={{
              width: '100%', marginTop: '.75rem',
              background: '#00c96e', color: '#000',
              fontWeight: 700, padding: '.85rem',
              borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '.95rem',
              fontFamily: 'inherit'
            }}
          >
            이 내용으로 매뉴얼 저장하기 →
          </button>
        </div>
      )}
    </div>
  );
}
