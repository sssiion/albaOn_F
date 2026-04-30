import { useEffect, useRef, useState } from 'react';
import { useParams,useSearchParams } from 'react-router-dom';
import { sendMessage } from '../api/chat';
import api from '../api';
// Chat.jsx 상단에 추가
const [params] = useSearchParams();
const workerName = params.get('name') || localStorage.getItem('worker_name') || '알바생';


export default function Chat() {
  const { storeId } = useParams();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: '안녕하세요! 👋 모르는 거 있으면 편하게 물어보세요.'
    }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [store, setStore]     = useState(null);
  const bottomRef             = useRef(null);

  useEffect(() => {
    api.get(`/api/stores/${storeId}`)
      .then(r => setStore(r.data))
      .catch(() => {});
  }, [storeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await sendMessage(storeId, question);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.data.answer,
        isAnswered: res.data.isAnswered
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '죄송해요, 잠시 오류가 생겼어요. 다시 시도해주세요.'
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QUICK_QUESTIONS = [
    'POS 환불 어떻게 해요?',
    '폐기는 몇 시에 해요?',
    '담배 재고 어디서 확인해요?',
    '오픈 절차 알려주세요'
  ];

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      height:'100vh', background:'#f7f6f2',
      fontFamily:'Noto Sans KR, sans-serif', maxWidth:'600px',
      margin:'0 auto'
    }}>

      {/* 헤더 */}
      <header style={{
        background:'#1a1a1a', color:'#fff',
        padding:'1rem 1.25rem',
        display:'flex', alignItems:'center', gap:'.85rem',
        flexShrink:0
      }}>
        <div style={{
          width:'38px', height:'38px', background:'#00c96e',
          borderRadius:'10px', display:'flex',
          alignItems:'center', justifyContent:'center', fontSize:'18px'
        }}>🤖</div>
        <div>
          <div style={{ fontWeight:700, fontSize:'.95rem' }}>
            {store?.name || '알바온 AI'}
          </div>
          <div style={{ fontSize:'.72rem', color:'#00c96e', marginTop:'1px' }}>
            ● 온라인 — 24시간 응답 중
          </div>
        </div>
      </header>

      {/* 빠른 질문 버튼 */}
      <div style={{
        padding:'.75rem 1rem', background:'#fff',
        borderBottom:'1px solid #e2ddd5',
        display:'flex', gap:'.5rem', overflowX:'auto',
        flexShrink:0
      }}>
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            style={{
              background:'#f0ede6', border:'1px solid #e2ddd5',
              borderRadius:'100px', padding:'.35rem .85rem',
              fontSize:'.78rem', cursor:'pointer', whiteSpace:'nowrap',
              fontFamily:'inherit', color:'#1a1a1a',
              transition:'background .2s'
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* 메시지 목록 */}
      <div style={{
        flex:1, overflowY:'auto',
        padding:'1.25rem 1rem',
        display:'flex', flexDirection:'column', gap:'10px'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display:'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap:'8px', alignItems:'flex-end'
          }}>
            {msg.role === 'ai' && (
              <div style={{
                width:'28px', height:'28px', background:'#1a1a1a',
                borderRadius:'8px', display:'flex',
                alignItems:'center', justifyContent:'center',
                fontSize:'13px', flexShrink:0
              }}>🤖</div>
            )}
            <div style={{
              maxWidth:'75%',
              padding:'.7rem .95rem',
              borderRadius: msg.role === 'user'
                ? '12px 4px 12px 12px'
                : '4px 12px 12px 12px',
              background: msg.role === 'user' ? '#1a1a1a' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#1a1a1a',
              fontSize:'.88rem', lineHeight:1.6,
              border: msg.role === 'ai' ? '1px solid #e2ddd5' : 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,.06)'
            }}>
              {msg.content}
              {msg.role === 'ai' && msg.isAnswered === false && (
                <div style={{
                  marginTop:'.5rem', fontSize:'.75rem',
                  color:'#a09b94', borderTop:'1px solid #e2ddd5',
                  paddingTop:'.4rem'
                }}>
                  ⚠️ 점주님께 알림이 전송됐어요
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 로딩 */}
        {loading && (
          <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
            <div style={{
              width:'28px', height:'28px', background:'#1a1a1a',
              borderRadius:'8px', display:'flex',
              alignItems:'center', justifyContent:'center', fontSize:'13px'
            }}>🤖</div>
            <div style={{
              background:'#fff', border:'1px solid #e2ddd5',
              borderRadius:'4px 12px 12px 12px',
              padding:'.7rem .95rem', fontSize:'.88rem', color:'#a09b94'
            }}>
              답변 생성 중...
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* 입력창 */}
      <div style={{
        padding:'.85rem 1rem',
        background:'#fff', borderTop:'1px solid #e2ddd5',
        display:'flex', gap:'.5rem', flexShrink:0
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="무엇이든 물어보세요... (Enter로 전송)"
          rows={1}
          style={{
            flex:1, padding:'.7rem 1rem',
            borderRadius:'10px', border:'1px solid #e2ddd5',
            fontSize:'.9rem', outline:'none', resize:'none',
            fontFamily:'inherit', lineHeight:1.5,
            background:'#f7f6f2'
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            width:'44px', height:'44px', borderRadius:'10px',
            background: input.trim() ? '#1a1a1a' : '#e2ddd5',
            border:'none', cursor: input.trim() ? 'pointer' : 'default',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background .2s', flexShrink:0
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
