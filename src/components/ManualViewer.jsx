import { useState, useMemo } from 'react';
import { updateManual, deleteManual, moveManual } from '../api/manuals';
import { getCategories, addCategory, deleteCategory,updateCategory } from '../api/categories';
import { useEffect } from 'react';

function parseToTree(content) {
  if (!content) return [];
  const lines = content.split('\n').filter(l => l.trim());
  const tree = [];
  let currentH2 = null;
  let currentH3 = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentH2 = { id: Math.random().toString(36).slice(2), label: line.replace('## ', '').trim(), children: [], level: 2 };
      currentH3 = null;
      tree.push(currentH2);
    } else if (line.startsWith('### ')) {
      if (!currentH2) continue;
      currentH3 = { id: Math.random().toString(36).slice(2), label: line.replace('### ', '').trim(), children: [], level: 3 };
      currentH2.children.push(currentH3);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const item = { id: Math.random().toString(36).slice(2), label: line.replace(/^[-*]\s+/, '').trim(), children: [], level: 4 };
      if (currentH3) currentH3.children.push(item);
      else if (currentH2) currentH2.children.push(item);
      else tree.push(item);
    }
  }
  return tree;
}

function TreeNode({ node, depth = 0, searchQuery }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isMatch = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());

  const highlight = (text) => {
    if (!searchQuery) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (<>{text.slice(0, idx)}<mark style={{ background:'#ffe5a0', borderRadius:'3px', padding:'0 2px' }}>{text.slice(idx, idx + searchQuery.length)}</mark>{text.slice(idx + searchQuery.length)}</>);
  };

  const colors    = ['#1a1a1a', '#3d6b8a', '#6b8a3d', '#8a6b3d'];
  const sizes     = ['1rem', '.95rem', '.88rem', '.83rem'];
  const weights   = [700, 600, 500, 400];

  return (
    <div style={{ marginLeft: depth > 0 ? '1rem' : '0' }}>
      <div
        onClick={() => hasChildren && setOpen(!open)}
        style={{
          display:'flex', alignItems:'center', gap:'.5rem',
          padding:'.4rem .75rem', borderRadius:'8px',
          cursor: hasChildren ? 'pointer' : 'default',
          background: isMatch ? '#fffbe8' : 'transparent',
          border: isMatch ? '1px solid #ffe5a0' : '1px solid transparent',
          marginBottom:'.1rem'
        }}
      >
        <span style={{ fontSize:'.72rem', color:'#a09b94', width:'14px', flexShrink:0 }}>
          {hasChildren ? (open ? '▼' : '▶') : '•'}
        </span>
        <span style={{ fontSize: sizes[Math.min(depth, 3)], fontWeight: weights[Math.min(depth, 3)], color: colors[Math.min(depth, 3)], lineHeight:1.5 }}>
          {highlight(node.label)}
        </span>
        {hasChildren && (
          <span style={{ marginLeft:'auto', fontSize:'.68rem', color:'#a09b94', background:'#f0ede6', padding:'1px 6px', borderRadius:'10px', flexShrink:0 }}>
            {node.children.length}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div style={{ borderLeft:'2px solid #e2ddd5', marginLeft:'.85rem', paddingLeft:'.25rem', marginBottom:'.2rem' }}>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManualViewer({ storeId, manuals, onUpdate }) {
  const [searchQuery, setSearchQuery]     = useState('');
  const [categories, setCategories]       = useState([]);
  const [newCatName, setNewCatName]       = useState('');
  const [editingId, setEditingId]         = useState(null);
  const [editContent, setEditContent]     = useState('');
  const [selectedId, setSelectedId]       = useState(null);
  const [movingId, setMovingId]           = useState(null);
  const [loading, setLoading]             = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);

  const [editingCatId, setEditingCatId]   = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  useEffect(() => {
    loadCategories();
  }, [storeId]);

  const handleUpdateCategory = async (catId) => {
  if (!editingCatName.trim()) return;
  await updateCategory(storeId, catId, editingCatName.trim());
  setEditingCatId(null);
  setEditingCatName('');
  await loadCategories();
};

  const loadCategories = async () => {
    const res = await getCategories(storeId);
    setCategories(res.data);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory(storeId, newCatName.trim());
    setNewCatName('');
    await loadCategories();
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm('카테고리를 삭제할까요? 매뉴얼은 유지돼요.')) return;
    await deleteCategory(storeId, catId);
    await loadCategories();
  };

  const handleMove = async (manualId, categoryId) => {
    await moveManual(storeId, manualId, categoryId);
    setMovingId(null);
    await onUpdate();
  };

  const handleSave = async (manualId) => {
    if (!editContent.trim()) return;
    setLoading(true);
    try {
      await updateManual(manualId, { content: editContent });
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
    if (selectedId === manualId) setSelectedId(null);
    await onUpdate();
  };

  // 카테고리별로 매뉴얼 그룹핑
  const grouped = useMemo(() => {
    const filtered = searchQuery
      ? manuals.filter(m =>
          m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : manuals;

    const groups = {};
    const uncategorized = [];

    for (const m of filtered) {
      if (m.category_id) {
        const cat = categories.find(c => c.id === m.category_id);
        const key = cat?.name || '기타';
        if (!groups[key]) groups[key] = { name: key, id: m.category_id, manuals: [] };
        groups[key].manuals.push(m);
      } else {
        uncategorized.push(m);
      }
    }

    const result = Object.values(groups);
    if (uncategorized.length > 0) {
      result.push({ name: '미분류', id: null, manuals: uncategorized });
    }
    return result;
  }, [manuals, categories, searchQuery]);

  if (manuals.length === 0) return (
    <div style={{ background:'#fff', border:'1px solid #e2ddd5', borderRadius:'14px', padding:'3rem', textAlign:'center' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📖</div>
      <p style={{ fontWeight:700, marginBottom:'.4rem' }}>아직 매뉴얼이 없어요</p>
      <p style={{ fontSize:'.88rem', color:'#6b6560' }}>매뉴얼 입력 탭에서 추가해주세요</p>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

      {/* 검색 + 카테고리 관리 버튼 */}
      <div style={{ display:'flex', gap:'.75rem', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'#a09b94' }}>🔍</span>
          <input
            placeholder="매뉴얼 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width:'100%', padding:'.8rem 1rem .8rem 2.75rem',
              borderRadius:'10px', border:'1.5px solid #e2ddd5',
              fontSize:'.9rem', outline:'none', fontFamily:'inherit',
              background:'#fff', boxSizing:'border-box'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position:'absolute', right:'.75rem', top:'50%',
              transform:'translateY(-50%)', background:'none',
              border:'none', cursor:'pointer', color:'#a09b94', fontSize:'1.1rem'
            }}>×</button>
          )}
        </div>
        <button
          onClick={() => setShowCatManager(!showCatManager)}
          style={{
            background: showCatManager ? '#1a1a1a' : '#fff',
            color: showCatManager ? '#fff' : '#1a1a1a',
            border:'1.5px solid #1a1a1a', borderRadius:'10px',
            padding:'.8rem 1rem', fontSize:'.85rem',
            fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
            fontFamily:'inherit'
          }}
        >
          📁 카테고리 관리
        </button>
      </div>

      {/* 카테고리 관리 패널 */}
      {showCatManager && (
        <div style={{
          background:'#fff', border:'1.5px solid #1a1a1a',
          borderRadius:'14px', padding:'1.25rem'
        }}>
          <div style={{ fontWeight:700, fontSize:'.95rem', marginBottom:'1rem' }}>
            카테고리 관리
          </div>

          {/* 카테고리 목록 */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', marginBottom:'1rem' }}>
            {categories.map(cat => (
            <div key={cat.id}>
              {editingCatId === cat.id ? (
                <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                  <input
                    value={editingCatName}
                    onChange={e => setEditingCatName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                    autoFocus
                    style={{
                      padding:'.3rem .6rem', borderRadius:'6px',
                      border:'1px solid #1a1a1a', fontSize:'.85rem',
                      outline:'none', fontFamily:'inherit', width:'100px'
                    }}
                  />
                  <button onClick={() => handleUpdateCategory(cat.id)} style={{
                    background:'#1a1a1a', color:'#fff', border:'none',
                    borderRadius:'6px', padding:'.3rem .6rem',
                    fontSize:'.78rem', cursor:'pointer'
                  }}>✓</button>
                  <button onClick={() => setEditingCatId(null)} style={{
                    background:'transparent', border:'1px solid #e2ddd5',
                    borderRadius:'6px', padding:'.3rem .6rem',
                    fontSize:'.78rem', cursor:'pointer', color:'#6b6560'
                  }}>✕</button>
                </div>
              ) : (
                <div style={{
                  display:'flex', alignItems:'center', gap:'.4rem',
                  background:'#f0ede6', borderRadius:'100px',
                  padding:'.35rem .85rem', fontSize:'.85rem'
                }}>
                  <span>{cat.name}</span>
                  <button
                    onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                    style={{
                      background:'none', border:'none', cursor:'pointer',
                      color:'#6b6560', fontSize:'.78rem', padding:'0'
                    }}
                  >✏️</button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{
                      background:'none', border:'none', cursor:'pointer',
                      color:'#a09b94', fontSize:'.9rem', padding:'0', lineHeight:1
                    }}
                  >×</button>
                </div>
              )}
            </div>
          ))}
            {categories.length === 0 && (
              <span style={{ fontSize:'.85rem', color:'#a09b94' }}>
                아직 카테고리가 없어요
              </span>
            )}
          </div>

          {/* 카테고리 추가 폼 */}
          <form onSubmit={handleAddCategory} style={{ display:'flex', gap:'.5rem' }}>
            <input
              placeholder="새 카테고리 이름 (예: 청소, 담배 관리)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              style={{
                flex:1, padding:'.65rem 1rem', borderRadius:'8px',
                border:'1px solid #e2ddd5', fontSize:'.88rem',
                outline:'none', fontFamily:'inherit'
              }}
            />
            <button type="submit" style={{
              background:'#1a1a1a', color:'#fff',
              fontWeight:700, padding:'.65rem 1rem',
              borderRadius:'8px', border:'none',
              cursor:'pointer', fontFamily:'inherit',
              whiteSpace:'nowrap'
            }}>+ 추가</button>
          </form>
        </div>
      )}

      {/* 검색 결과 수 */}
      {searchQuery && (
        <div style={{ fontSize:'.82rem', color:'#6b6560' }}>
          "{searchQuery}" 검색 결과 {manuals.filter(m =>
            m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.content?.toLowerCase().includes(searchQuery.toLowerCase())
          ).length}개
        </div>
      )}

      {/* 카테고리별 매뉴얼 */}
      {grouped.map(group => (
        <div key={group.name} style={{
          background:'#fff', border:'1px solid #e2ddd5',
          borderRadius:'14px', overflow:'hidden'
        }}>
          {/* 카테고리 헤더 */}
          <div style={{
            background:'#f7f6f2', borderBottom:'1px solid #e2ddd5',
            padding:'.85rem 1.25rem',
            display:'flex', alignItems:'center', gap:'.75rem'
          }}>
            <span style={{ fontSize:'1.1rem' }}>📁</span>
            <span style={{ fontWeight:700, fontSize:'1rem' }}>{group.name}</span>
            <span style={{
              background:'#e2ddd5', color:'#6b6560',
              fontSize:'.72rem', fontWeight:700,
              padding:'2px 8px', borderRadius:'100px'
            }}>{group.manuals.length}</span>
          </div>

          {/* 매뉴얼 목록 */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            {group.manuals.map((m, i) => (
              <div key={m.id} style={{
                borderBottom: i < group.manuals.length - 1 ? '1px solid #f0ede6' : 'none'
              }}>
                {/* 매뉴얼 헤더 */}
                <div
                  onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
                  style={{
                    padding:'.85rem 1.25rem',
                    display:'flex', justifyContent:'space-between',
                    alignItems:'center', cursor:'pointer',
                    background: selectedId === m.id ? '#f7f6f2' : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight:600, fontSize:'.9rem' }}>{m.title}</div>
                    <div style={{ fontSize:'.75rem', color:'#a09b94', marginTop:'.15rem' }}>
                      {new Date(m.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                    <button onClick={e => { e.stopPropagation(); setMovingId(movingId === m.id ? null : m.id); }} style={{
                      background:'transparent', border:'1px solid #e2ddd5',
                      borderRadius:'6px', padding:'.25rem .6rem',
                      fontSize:'.72rem', cursor:'pointer', color:'#6b6560'
                    }}>📂 이동</button>
                    <button onClick={e => { e.stopPropagation(); setEditingId(m.id); setEditContent(m.content); setSelectedId(null); }} style={{
                      background:'transparent', border:'1px solid #e2ddd5',
                      borderRadius:'6px', padding:'.25rem .6rem',
                      fontSize:'.72rem', cursor:'pointer', color:'#6b6560'
                    }}>✏️ 수정</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(m.id); }} style={{
                      background:'transparent', border:'1px solid #ffc9c9',
                      borderRadius:'6px', padding:'.25rem .6rem',
                      fontSize:'.72rem', cursor:'pointer', color:'#ff3b3b'
                    }}>삭제</button>
                    <span style={{ color:'#a09b94', fontSize:'.8rem' }}>
                      {selectedId === m.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* 카테고리 이동 패널 */}
                {movingId === m.id && (
                  <div style={{
                    padding:'.75rem 1.25rem',
                    background:'#f7f6f2', borderTop:'1px solid #e2ddd5'
                  }}>
                    <div style={{ fontSize:'.82rem', fontWeight:600, marginBottom:'.5rem' }}>
                      카테고리 이동
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleMove(m.id, cat.id)}
                          style={{
                            background: m.category_id === cat.id ? '#1a1a1a' : '#fff',
                            color: m.category_id === cat.id ? '#fff' : '#1a1a1a',
                            border:'1px solid #e2ddd5', borderRadius:'100px',
                            padding:'.35rem .85rem', fontSize:'.82rem',
                            cursor:'pointer', fontFamily:'inherit'
                          }}
                        >
                          {m.category_id === cat.id ? '✓ ' : ''}{cat.name}
                        </button>
                      ))}
                      <button
                        onClick={() => handleMove(m.id, null)}
                        style={{
                          background: !m.category_id ? '#1a1a1a' : '#fff',
                          color: !m.category_id ? '#fff' : '#6b6560',
                          border:'1px solid #e2ddd5', borderRadius:'100px',
                          padding:'.35rem .85rem', fontSize:'.82rem',
                          cursor:'pointer', fontFamily:'inherit'
                        }}
                      >
                        미분류
                      </button>
                    </div>
                  </div>
                )}

                {/* 수정 모드 */}
                {editingId === m.id && (
                  <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #e2ddd5' }}>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={8}
                      style={{
                        width:'100%', padding:'.75rem 1rem',
                        borderRadius:'8px', border:'1px solid #1a1a1a',
                        fontSize:'.88rem', outline:'none', resize:'vertical',
                        fontFamily:'inherit', lineHeight:1.7, boxSizing:'border-box'
                      }}
                    />
                    <div style={{ display:'flex', gap:'.5rem', marginTop:'.75rem' }}>
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
                )}

                {/* 트리 뷰 */}
                {selectedId === m.id && editingId !== m.id && (
                  <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #f0ede6' }}>
                    {parseToTree(m.content).length > 0 ? (
                      parseToTree(m.content).map(node => (
                        <TreeNode key={node.id} node={node} depth={0} searchQuery={searchQuery} />
                      ))
                    ) : (
                      <div style={{ whiteSpace:'pre-wrap', fontSize:'.88rem', color:'#3d3d3a', lineHeight:1.8 }}>
                        {m.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
