import { useState, useMemo } from 'react';
import { updateManual, deleteManual } from '../api/manuals';

// 마크다운을 트리 구조로 파싱
function parseToTree(content) {
  if (!content) return [];
  const lines = content.split('\n').filter(l => l.trim());
  const tree = [];
  let currentH2 = null;
  let currentH3 = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentH2 = {
        id: Math.random().toString(36).slice(2),
        label: line.replace('## ', '').trim(),
        children: [],
        level: 2
      };
      currentH3 = null;
      tree.push(currentH2);
    } else if (line.startsWith('### ')) {
      if (!currentH2) continue;
      currentH3 = {
        id: Math.random().toString(36).slice(2),
        label: line.replace('### ', '').trim(),
        children: [],
        level: 3
      };
      currentH2.children.push(currentH3);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const item = {
        id: Math.random().toString(36).slice(2),
        label: line.replace(/^[-*]\s+/, '').trim(),
        children: [],
        level: 4
      };
      if (currentH3) currentH3.children.push(item);
      else if (currentH2) currentH2.children.push(item);
      else tree.push(item);
    }
  }
  return tree;
}

// 트리 노드 컴포넌트
function TreeNode({ node, depth = 0, searchQuery }) {
  const [open, setOpen] = useState(depth < 2);

  const hasChildren = node.children && node.children.length > 0;

  const isMatch = searchQuery &&
    node.label.toLowerCase().includes(searchQuery.toLowerCase());

  const highlight = (text) => {
    if (!searchQuery) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background:'#ffe5a0', borderRadius:'3px', padding:'0 2px' }}>
          {text.slice(idx, idx + searchQuery.length)}
        </mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  const nodeColors = ['#1a1a1a', '#3d6b8a', '#6b8a3d', '#8a6b3d'];
  const color = nodeColors[Math.min(depth, nodeColors.length - 1)];

  const fontSizes = ['1rem', '.95rem', '.88rem', '.83rem'];
  const fontSize = fontSizes[Math.min(depth, fontSizes.length - 1)];

  const fontWeights = [700, 600, 500, 400];
  const fontWeight = fontWeights[Math.min(depth, fontWeights.length - 1)];

  return (
    <div style={{ marginLeft: depth > 0 ? '1rem' : '0' }}>
      <div
        onClick={() => hasChildren && setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '.5rem',
          padding: '.45rem .75rem',
          borderRadius: '8px',
          cursor: hasChildren ? 'pointer' : 'default',
          background: isMatch ? '#fffbe8' : 'transparent',
          border: isMatch ? '1px solid #ffe5a0' : '1px solid transparent',
          transition: 'background .15s',
          marginBottom: '.15rem'
        }}
        onMouseEnter={e => {
          if (!isMatch) e.currentTarget.style.background = '#f7f6f2';
        }}
        onMouseLeave={e => {
          if (!isMatch) e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* 아이콘 */}
        <span style={{ fontSize: '.75rem', flexShrink: 0, color: '#a09b94', width: '14px' }}>
          {hasChildren
            ? open ? '▼' : '▶'
            : '•'}
        </span>

        {/* 라벨 */}
        <span style={{ fontSize, fontWeight, color, lineHeight: 1.5 }}>
          {highlight(node.label)}
        </span>

        {/* 자식 수 뱃지 */}
        {hasChildren && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '.7rem',
            color: '#a09b94',
            background: '#f0ede6',
            padding: '1px 6px',
            borderRadius: '10px',
            flexShrink: 0
          }}>
            {node.children.length}
          </span>
        )}
      </div>

      {/* 자식 노드 */}
      {hasChildren && open && (
        <div style={{
          borderLeft: `2px solid #e2ddd5`,
          marginLeft: '.85rem',
          paddingLeft: '.25rem',
          marginBottom: '.25rem'
        }}>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManualViewer({ storeId, manuals, onUpdate }) {
  const [searchQuery, setSearchQuery]   = useState('');
  const [editingId, setEditingId]       = useState(null);
  const [editContent, setEditContent]   = useState('');
  const [selectedManual, setSelectedManual] = useState(null);
  const [loading, setLoading]           = useState(false);

  // 검색어에 맞는 매뉴얼 필터링
  const filteredManuals = useMemo(() => {
    if (!searchQuery) return manuals;
    return manuals.filter(m =>
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [manuals, searchQuery]);

  const handleEdit = (manual) => {
    setEditingId(manual.id);
    setEditContent(manual.original_content || manual.content);
    setSelectedManual(null);
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
    if (selectedManual?.id === manualId) setSelectedManual(null);
    await onUpdate();
  };

  if (manuals.length === 0) return (
    <div style={{
      background: '#fff', border: '1px solid #e2ddd5',
      borderRadius: '14px', padding: '3rem', textAlign: 'center'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
      <p style={{ fontWeight: 700, marginBottom: '.4rem' }}>아직 매뉴얼이 없어요</p>
      <p style={{ fontSize: '.88rem', color: '#6b6560' }}>매뉴얼 입력 탭에서 추가해주세요</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* 검색바 */}
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '1rem', top: '50%',
          transform: 'translateY(-50%)', fontSize: '1rem', color: '#a09b94'
        }}>🔍</span>
        <input
          placeholder="매뉴얼 검색..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '.85rem 1rem .85rem 2.75rem',
            borderRadius: '10px', border: '1.5px solid #e2ddd5',
            fontSize: '.9rem', outline: 'none', fontFamily: 'inherit',
            background: '#fff', boxSizing: 'border-box'
          }}
          onFocus={e => e.target.style.borderColor = '#1a1a1a'}
          onBlur={e => e.target.style.borderColor = '#e2ddd5'}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: '.75rem', top: '50%',
              transform: 'translateY(-50%)', background: 'none',
              border: 'none', cursor: 'pointer', color: '#a09b94',
              fontSize: '1.1rem'
            }}
          >×</button>
        )}
      </div>

      {/* 검색 결과 수 */}
      {searchQuery && (
        <div style={{ fontSize: '.82rem', color: '#6b6560' }}>
          "{searchQuery}" 검색 결과 {filteredManuals.length}개
        </div>
      )}

      {/* 매뉴얼 목록 */}
      {filteredManuals.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2ddd5',
          borderRadius: '14px', padding: '2rem', textAlign: 'center',
          color: '#6b6560', fontSize: '.88rem'
        }}>
          검색 결과가 없어요
        </div>
      ) : (
        filteredManuals.map(m => (
          <div key={m.id} style={{
            background: '#fff', border: '1px solid #e2ddd5',
            borderRadius: '14px', overflow: 'hidden'
          }}>
            {/* 매뉴얼 헤더 */}
            <div style={{
              padding: '1rem 1.25rem',
              background: selectedManual?.id === m.id ? '#f7f6f2' : '#fff',
              borderBottom: '1px solid #e2ddd5',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer'
            }}
              onClick={() => setSelectedManual(selectedManual?.id === m.id ? null : m)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '.95rem' }}>
                  {m.title || '매뉴얼'}
                </div>
                <div style={{ fontSize: '.75rem', color: '#a09b94', marginTop: '.2rem' }}>
                  {new Date(m.created_at).toLocaleDateString('ko-KR')} 등록
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(m); }} style={{
                  background: 'transparent', border: '1px solid #e2ddd5',
                  borderRadius: '6px', padding: '.3rem .7rem',
                  fontSize: '.75rem', cursor: 'pointer', color: '#6b6560'
                }}>✏️ 수정</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} style={{
                  background: 'transparent', border: '1px solid #ffc9c9',
                  borderRadius: '6px', padding: '.3rem .7rem',
                  fontSize: '.75rem', cursor: 'pointer', color: '#ff3b3b'
                }}>삭제</button>
                <span style={{ color: '#a09b94', fontSize: '.85rem' }}>
                  {selectedManual?.id === m.id ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* 수정 모드 */}
            {editingId === m.id && (
              <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2ddd5' }}>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={10}
                  style={{
                    width: '100%', padding: '.75rem 1rem',
                    borderRadius: '8px', border: '1px solid #1a1a1a',
                    fontSize: '.88rem', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit',
                    lineHeight: 1.7, boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
                  <button onClick={() => handleSave(m.id)} disabled={loading} style={{
                    flex: 1, background: '#1a1a1a', color: '#fff',
                    fontWeight: 700, padding: '.75rem', borderRadius: '8px',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit'
                  }}>
                    {loading ? '저장 중...' : '저장하기'}
                  </button>
                  <button onClick={() => setEditingId(null)} style={{
                    padding: '.75rem 1.25rem', borderRadius: '8px',
                    border: '1px solid #e2ddd5', background: 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}>취소</button>
                </div>
              </div>
            )}

            {/* 트리 뷰 */}
            {selectedManual?.id === m.id && editingId !== m.id && (
              <div style={{ padding: '1rem 1.25rem' }}>
                {parseToTree(m.content).length > 0 ? (
                  parseToTree(m.content).map(node => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      depth={0}
                      searchQuery={searchQuery}
                    />
                  ))
                ) : (
                  <div style={{
                    whiteSpace: 'pre-wrap', fontSize: '.88rem',
                    color: '#3d3d3a', lineHeight: 1.8
                  }}>
                    {m.content}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
