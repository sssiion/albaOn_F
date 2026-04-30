export default function Login() {
  const handleKakaoLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/kakao`;
  };

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      justifyContent:'center', alignItems:'center',
      height:'100vh', gap:'1rem', background:'#f7f6f2'
    }}>
      <h1 style={{ fontSize:'2rem', fontWeight:900 }}>🤖 알바온</h1>
      <p style={{ color:'#6b6560' }}>새벽 전화 없애는 알바 온보딩 AI</p>
      <button
        onClick={handleKakaoLogin}
        style={{
          background:'#FEE500', color:'#000',
          fontWeight:700, fontSize:'1rem',
          padding:'0.85rem 2rem', borderRadius:'10px',
          border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', gap:'8px'
        }}
      >
        카카오로 시작하기
      </button>
    </div>
  );
}