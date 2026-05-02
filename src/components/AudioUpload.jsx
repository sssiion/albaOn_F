import { useRef, useState } from 'react';
import { uploadAudio } from '../api/manuals';

export default function AudioUpload({ storeId, onComplete }) {
  const [step, setStep]         = useState('idle'); // idle | uploading | preview | saving
  const [rawText, setRawText]   = useState('');
  const [organized, setOrganized] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState('');
  const fileRef = useRef();

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
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>

      {/* 업로드 영역 */}
      {step === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${dragOver ? '#1a1a1a' : '#e2ddd5'}`,
            borderRadius: '14px',
            padding: '2.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#f0ede6' : '#fff',
            transition: 'all .2s'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🎙️</div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.4rem' }}>
            녹음 파일을 올려주세요
          </div>
          <div style={{ fontSize: '.82rem', color: '#6b6560', lineHeight: 1.65 }}>
            통화 녹음, 음성 메모, 인수인계 녹음 등<br />
            MP3, MP4, WAV, M4A, WebM 지원 · 최대 25MB
          </div>
          <div style={{
            marginTop: '1.25rem',
            display: 'inline-block',
            background: '#1a1a1a', color: '#fff',
            padding: '.6rem 1.25rem', borderRadius: '8px',
            fontSize: '.85rem', fontWeight: 700
          }}>
            파일 선택하기
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".mp3,.mp4,.wav,.m4a,.webm,.ogg"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files)}
          />
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
