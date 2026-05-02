import { useState, useMemo, useEffect, useRef } from 'react';
import { updateManual, deleteManual, moveManual } from '../api/manuals';
import { getCategories, addCategory, deleteCategory, updateCategory } from '../api/categories';
import { uploadNodeMedia, deleteNodeMedia } from '../api/media';

// 트리 → 텍스트 변환
function treeToText(nodes, depth = 0) {
  return nodes.map(n => {
    const prefix = depth === 0 ? '## ' : depth === 1 ? '### ' : '- ';
    const line = prefix + n.label;
    const children = n.children?.length > 0
      ? '\n' + treeToText(n.children, depth + 1)
      : '';
    return line + children;
  }).join('\n');
}

// 텍스트 → 트리 변환
function parseToTree(content) {
  if (!content) return [];
  const lines = content.split('\n').filter(l => l.trim());
  const tree = [];
  let currentH2 = null;
  let currentH3 = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentH2 = { id: Math.random().toString(36).slice(2), label: line.replace('## ', '').trim(), children: [] };
      currentH3 = null;
      tree.push(currentH2);
    } else if (line.startsWith('### ')) {
      if (!currentH2) continue;
      currentH3 = { id: Math.random().toString(36).slice(2), label: line.replace('### ', '').trim(), children: [] };
      currentH2.children.push(currentH3);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const item = { id: Math.random().toString(36).slice(2), label: line.replace(/^[-*]\s+/, '').trim(), children: [] };
      if (currentH3) currentH3.children.push(item);
      else if (currentH2) currentH2.children.push(item);
      else tree.push(item);
    }
  }
  return tree;
}

// 트리에서 특정 노드 삭제
function removeNodeFromTree(nodes, targetLabel) {
  return nodes
    .filter(n => n.label !== targetLabel)
    .map(n => ({ ...n, children: removeNodeFromTree(n.children || [], targetLabel) }));
}

// 트리에서 특정 노드 수정 (label 기준)
function updateNodeInTree(nodes, targetLabel, newLabel) {
  return nodes.map(n => {
    if (n.label === targetLabel) return { ...n, label: newLabel };
    return { ...n, children: updateNodeInTree(n.children || [], targetLabel, newLabel) };
  });
}

// 트리 노드 컴포넌트
function TreeNode({ node, depth = 0, searchQuery, onNodeDelete, onNodeEdit, manualId, storeId, nodeMedia, onMediaUpdate }) {
  const [open, setOpen]         = useState(depth < 2);
  const [editing, setEditing]   = useState(false);
  const [editVal, setEditVal]   = useState(node.label);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption]   = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const hasChildren = node.children?.length > 0;
  const isMatch = searchQuery && node.label.toLowerCase().includes(searchQuery.toLowerCase());

  // 이 노드에 연결된 이미지들
  const myMedia = nodeMedia?.filter(m => m.node_label === node.label) || [];

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nodeLabel', node.label);
      formData.append('storeId', storeId);
      formData.append('caption', caption);
      await uploadNodeMedia(manualId, formData);
      setCaption('');
      setShowUpload(false);
      await onMediaUpdate();
    } catch (err) {
      alert('업로드 실패: ' + err.message);
    }
    setUploading(false);
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!confirm('이미지를 삭제할까요?')) return;
    await deleteNodeMedia(mediaId);
    await onMediaUpdate();
  };

  const highlight = (text) => {
    if (!searchQuery) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (<>{text.slice(0, idx)}<mark style={{ background:'#ffe5a0', borderRadius:'3px', padding:'0 2px' }}>{text.slice(idx, idx + searchQuery.length)}</mark>{text.slice(idx + searchQuery.length)}</>);
  };

  const colors  = ['#1a1a1a', '#3d6b8a', '#6b8a3d', '#8a6b3d'];
  const sizes   = ['1rem', '.95rem', '.88rem', '.83rem'];
  const weights = [700, 600, 500, 400];
  const d = Math.min(depth, 3);

  const handleEditSave = () => {
    if (editVal.trim()) onNodeEdit(node.label, editVal.trim());
    setEditing(false);
  };

  return (
    <div style={{ marginLeft: depth > 0 ? '1rem' : '0' }}>
      {/* 노드 행 */}
      <div style={{
        display:'flex', alignItems:'center', gap:'.4rem',
        padding:'.35rem .6rem', borderRadius:'8px',
        background: isMatch ? '#fffbe8' : 'transparent',
        border: isMatch ? '1px solid #ffe5a0' : '1px solid transparent',
        marginBottom:'.1rem',
      }}
        onMouseEnter={e => { if (!isMatch) e.currentTarget.style.background = '#f7f6f2'; }}
        onMouseLeave={e => { if (!isMatch) e.currentTarget.style.background = 'transparent'; }}
      >
        <span onClick={() => hasChildren && setOpen(!open)}
          style={{ fontSize:'.7rem', color:'#a09b94', width:'12px', flexShrink:0, cursor: hasChildren ? 'pointer' : 'default' }}>
          {hasChildren ? (open ? '▼' : '▶') : '•'}
        </span>

        {editing ? (
          <input
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') { setEditing(false); setEditVal(node.label); } }}
            autoFocus
            style={{ flex:1, padding:'.2rem .5rem', borderRadius:'6px', border:'1px solid #1a1a1a', fontSize: sizes[d], outline:'none', fontFamily:'inherit' }}
          />
        ) : (
          <span onClick={() => hasChildren && setOpen(!open)}
            style={{ flex:1, fontSize: sizes[d], fontWeight: weights[d], color: colors[d], lineHeight:1.5, cursor: hasChildren ? 'pointer' : 'default' }}>
            {highlight(node.label)}
          </span>
        )}

        {/* 버튼들 */}
        <div style={{ display:'flex', gap:'.2rem', flexShrink:0 }}>
          {editing ? (
            <>
              <button onClick={handleEditSave} style={{ background:'#1a1a1a', color:'#fff', border:'none', borderRadius:'4px', padding:'2px 7px', fontSize:'.7rem', cursor:'pointer' }}>✓</button>
              <button onClick={() => { setEditing(false); setEditVal(node.label); }} style={{ background:'transparent', border:'1px solid #e2ddd5', borderRadius:'4px', padding:'2px 7px', fontSize:'.7rem', cursor:'pointer', color:'#6b6560' }}>✕</button>
            </>
          ) : (
            <>
              {/* 이미지 첨부 버튼 */}
              <button
                onClick={() => setShowUpload(!showUpload)}
                style={{ background:'transparent', border:'none', cursor:'pointer', color: myMedia.length > 0 ? '#3d6b8a' : '#ccc', fontSize:'.8rem', padding:'0 2px' }}
                title="이미지 첨부"
              >🖼️</button>
              <button onClick={() => setEditing(true)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#a09b94', fontSize:'.75rem', padding:'0 3px', opacity:0.7 }} title="수정">✏️</button>
              <button onClick={() => { if (confirm(`"${node.label}" 항목을 삭제할까요?`)) onNodeDelete(node.label); }} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#a09b94', fontSize:'.8rem', padding:'0 3px', opacity:0.7 }} title="삭제">×</button>
            </>
          )}
        </div>

        {hasChildren && (
          <span style={{ fontSize:'.65rem', color:'#a09b94', background:'#f0ede6', padding:'1px 5px', borderRadius:'10px', flexShrink:0 }}>
            {node.children.length}
          </span>
        )}
      </div>

      {/* 이미지 업로드 패널 */}
      {showUpload && (
        <div style={{ marginLeft:'1.5rem', marginBottom:'.5rem', padding:'.75rem', background:'#f7f6f2', borderRadius:'8px' }}>
          <input
            placeholder="설명 (선택사항)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ width:'100%', padding:'.4rem .6rem', borderRadius:'6px', border:'1px solid #e2ddd5', fontSize:'.8rem', outline:'none', fontFamily:'inherit', marginBottom:'.5rem', boxSizing:'border-box' }}
          />
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
            onChange={e => { handleImageUpload(e.target.files[0]); e.target.value=''; }} />
          <button onClick={() => fileRef.current.click()} disabled={uploading} style={{
            background:'#1a1a1a', color:'#fff', border:'none',
            borderRadius:'6px', padding:'.4rem .85rem',
            fontSize:'.78rem', cursor:'pointer', fontFamily:'inherit'
          }}>
            {uploading ? '업로드 중...' : '📎 이미지 선택'}
          </button>
        </div>
      )}

      {/* 첨부된 이미지들 */}
      {myMedia.length > 0 && (
        <div style={{ marginLeft:'1.5rem', marginBottom:'.5rem', display:'flex', flexWrap:'wrap', gap:'.5rem' }}>
          {myMedia.map(media => (
            <div key={media.id} style={{ position:'relative' }}>
              <img
                src={media.url}
                alt={media.caption || '이미지'}
                style={{ width:'72px', height:'72px', objectFit:'cover', borderRadius:'8px', display:'block', border:'1px solid #e2ddd5' }}
              />
              {media.caption && (
                <div style={{ fontSize:'.65rem', color:'#6b6560', textAlign:'center', marginTop:'2px', maxWidth:'72px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {media.caption}
                </div>
              )}
              <button
                onClick={() => handleDeleteMedia(media.id)}
                style={{ position:'absolute', top:'-6px', right:'-6px', background:'#ff3b3b', color:'#fff', border:'none', borderRadius:'50%', width:'18px', height:'18px', cursor:'pointer', fontSize:'.65rem', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* 자식 노드 */}
      {hasChildren && open && (
        <div style={{ borderLeft:'2px solid #e2ddd5', marginLeft:'.75rem', paddingLeft:'.2rem', marginBottom:'.2rem' }}>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
              onNodeDelete={onNodeDelete}
              onNodeEdit={onNodeEdit}
              manualId={manualId}
              storeId={storeId}
              nodeMedia={nodeMedia}
              onMediaUpdate={onMediaUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManualViewer({ storeId, manuals, onUpdate }) {
  const [searchQuery, setSearchQuery]       = useState('');
  const [categories, setCategories]         = useState([]);
  const [newCatName, setNewCatName]         = useState('');
  const [editingId, setEditingId]           = useState(null);
  const [editContent, setEditContent]       = useState('');
  const [selectedId, setSelectedId]         = useState(null);
  const [movingId, setMovingId]             = useState(null);
  const [loading, setLoading]               = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [editingCatId, setEditingCatId]     = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [saving, setSaving]                 = useState(null); // 저장 중인 manualId

  useEffect(() => { loadCategories(); }, [storeId]);

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

  const handleUpdateCategory = async (catId) => {
    if (!editingCatName.trim()) return;
    await updateCategory(storeId, catId, editingCatName.trim());
    setEditingCatId(null);
    setEditingCatName('');
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

  // 트리 노드 삭제
  const handleNodeDelete = async (manual, nodeLabel) => {
  const tree = parseToTree(manual.content);
  const newTree = removeNodeFromTree(tree, nodeLabel);
  const newContent = treeToText(newTree);

  setSaving(manual.id);
  try {
    await updateManual(manual.id, { content: newContent });
    await onUpdate();
  } catch (err) {
    alert('삭제 실패: ' + err.message);
  }
  setSaving(null);
};

  // 트리 노드 수정
  const handleNodeEdit = async (manual, nodeLabel, newLabel) => {
  const tree = parseToTree(manual.content);
  const newTree = updateNodeInTree(tree, nodeLabel, newLabel);
  const newContent = treeToText(newTree);

  setSaving(manual.id);
  try {
    await updateManual(manual.id, { content: newContent });
    await onUpdate();
  } catch (err) {
    alert('수정 실패: ' + err.message);
  }
  setSaving(null);
};

  // 카테고리별 그룹핑
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
    if (uncategorized.length > 0) result.push({ name: '미분류', id: null, manuals: uncategorized });
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

      {/* 검색 + 카테고리 관리 */}
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
        <button onClick={() => setShowCatManager(!showCatManager)} style={{
          background: showCatManager ? '#1a1a1a' : '#fff',
          color: showCatManager ? '#fff' : '#1a1a1a',
          border:'1.5px solid #1a1a1a', borderRadius:'10px',
          padding:'.8rem 1rem', fontSize:'.85rem',
          fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit'
        }}>
          📁 카테고리 관리
        </button>
      </div>

      {/* 카테고리 관리 패널 */}
      {showCatManager && (
        <div style={{ background:'#fff', border:'1.5px solid #1a1a1a', borderRadius:'14px', padding:'1.25rem' }}>
          <div style={{ fontWeight:700, fontSize:'.95rem', marginBottom:'1rem' }}>카테고리 관리</div>
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
                      borderRadius:'6px', padding:'.3rem .6rem', fontSize:'.78rem', cursor:'pointer'
                    }}>✓</button>
                    <button onClick={() => setEditingCatId(null)} style={{
                      background:'transparent', border:'1px solid #e2ddd5',
                      borderRadius:'6px', padding:'.3rem .6rem', fontSize:'.78rem', cursor:'pointer', color:'#6b6560'
                    }}>✕</button>
                  </div>
                ) : (
                  <div style={{
                    display:'flex', alignItems:'center', gap:'.4rem',
                    background:'#f0ede6', borderRadius:'100px', padding:'.35rem .85rem', fontSize:'.85rem'
                  }}>
                    <span>{cat.name}</span>
                    <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} style={{
                      background:'none', border:'none', cursor:'pointer', color:'#6b6560', fontSize:'.78rem', padding:'0'
                    }}>✏️</button>
                    <button onClick={() => handleDeleteCategory(cat.id)} style={{
                      background:'none', border:'none', cursor:'pointer', color:'#a09b94', fontSize:'.9rem', padding:'0', lineHeight:1
                    }}>×</button>
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <span style={{ fontSize:'.85rem', color:'#a09b94' }}>아직 카테고리가 없어요</span>
            )}
          </div>
          <form onSubmit={handleAddCategory} style={{ display:'flex', gap:'.5rem' }}>
            <input
              placeholder="새 카테고리 이름 (예: 청소, 담배 관리)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              style={{
                flex:1, padding:'.65rem 1rem', borderRadius:'8px',
                border:'1px solid #e2ddd5', fontSize:'.88rem', outline:'none', fontFamily:'inherit'
              }}
            />
            <button type="submit" style={{
              background:'#1a1a1a', color:'#fff', fontWeight:700,
              padding:'.65rem 1rem', borderRadius:'8px', border:'none',
              cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap'
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
        <div key={group.name} style={{ background:'#fff', border:'1px solid #e2ddd5', borderRadius:'14px', overflow:'hidden' }}>

          {/* 카테고리 헤더 */}
          <div style={{
            background:'#f7f6f2', borderBottom:'1px solid #e2ddd5',
            padding:'.85rem 1.25rem', display:'flex', alignItems:'center', gap:'.75rem'
          }}>
            <span style={{ fontSize:'1.1rem' }}>📁</span>
            <span style={{ fontWeight:700, fontSize:'1rem' }}>{group.name}</span>
            <span style={{ background:'#e2ddd5', color:'#6b6560', fontSize:'.72rem', fontWeight:700, padding:'2px 8px', borderRadius:'100px' }}>
              {group.manuals.length}
            </span>
          </div>

          {/* 매뉴얼 목록 */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            {group.manuals.map((m, i) => (
              <div key={m.id} style={{ borderBottom: i < group.manuals.length - 1 ? '1px solid #f0ede6' : 'none' }}>

                {/* 매뉴얼 헤더 */}
                <div
                  onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
                  style={{
                    padding:'.85rem 1.25rem', display:'flex',
                    justifyContent:'space-between', alignItems:'center',
                    cursor:'pointer', background: selectedId === m.id ? '#f7f6f2' : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight:600, fontSize:'.9rem' }}>
                      {m.title}
                      {saving === m.id && (
                        <span style={{ fontSize:'.72rem', color:'#00a558', marginLeft:'.5rem' }}>저장 중...</span>
                      )}
                    </div>
                    <div style={{ fontSize:'.75rem', color:'#a09b94', marginTop:'.15rem' }}>
                      {new Date(m.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                    <button onClick={e => { e.stopPropagation(); setMovingId(movingId === m.id ? null : m.id); }} style={{
                      background:'transparent', border:'1px solid #e2ddd5', borderRadius:'6px',
                      padding:'.25rem .6rem', fontSize:'.72rem', cursor:'pointer', color:'#6b6560'
                    }}>📂 이동</button>
                    <button onClick={e => {
                      e.stopPropagation();
                      setEditingId(m.id);
                      setEditContent(m.content);
                      setSelectedId(null);
                    }} style={{
                      background:'transparent', border:'1px solid #e2ddd5', borderRadius:'6px',
                      padding:'.25rem .6rem', fontSize:'.72rem', cursor:'pointer', color:'#6b6560'
                    }}>📝 전체수정</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(m.id); }} style={{
                      background:'transparent', border:'1px solid #ffc9c9', borderRadius:'6px',
                      padding:'.25rem .6rem', fontSize:'.72rem', cursor:'pointer', color:'#ff3b3b'
                    }}>삭제</button>
                    <span style={{ color:'#a09b94', fontSize:'.8rem' }}>
                      {selectedId === m.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* 카테고리 이동 */}
                {movingId === m.id && (
                  <div style={{ padding:'.75rem 1.25rem', background:'#f7f6f2', borderTop:'1px solid #e2ddd5' }}>
                    <div style={{ fontSize:'.82rem', fontWeight:600, marginBottom:'.5rem' }}>카테고리 이동</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
                      {categories.map(cat => (
                        <button key={cat.id} onClick={() => handleMove(m.id, cat.id)} style={{
                          background: m.category_id === cat.id ? '#1a1a1a' : '#fff',
                          color: m.category_id === cat.id ? '#fff' : '#1a1a1a',
                          border:'1px solid #e2ddd5', borderRadius:'100px',
                          padding:'.35rem .85rem', fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit'
                        }}>
                          {m.category_id === cat.id ? '✓ ' : ''}{cat.name}
                        </button>
                      ))}
                      <button onClick={() => handleMove(m.id, null)} style={{
                        background: !m.category_id ? '#1a1a1a' : '#fff',
                        color: !m.category_id ? '#fff' : '#6b6560',
                        border:'1px solid #e2ddd5', borderRadius:'100px',
                        padding:'.35rem .85rem', fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit'
                      }}>미분류</button>
                    </div>
                  </div>
                )}

                {/* 전체 수정 모드 */}
                {editingId === m.id && (
                  <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #e2ddd5' }}>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={8}
                      style={{
                        width:'100%', padding:'.75rem 1rem', borderRadius:'8px',
                        border:'1px solid #1a1a1a', fontSize:'.88rem', outline:'none',
                        resize:'vertical', fontFamily:'inherit', lineHeight:1.7, boxSizing:'border-box'
                      }}
                    />
                    <div style={{ display:'flex', gap:'.5rem', marginTop:'.75rem' }}>
                      <button onClick={() => handleSave(m.id)} disabled={loading} style={{
                        flex:1, background:'#1a1a1a', color:'#fff', fontWeight:700,
                        padding:'.75rem', borderRadius:'8px', border:'none', cursor:'pointer', fontFamily:'inherit'
                      }}>
                        {loading ? '저장 중...' : '저장하기'}
                      </button>
                      <button onClick={() => setEditingId(null)} style={{
                        padding:'.75rem 1.25rem', borderRadius:'8px',
                        border:'1px solid #e2ddd5', background:'transparent', cursor:'pointer', fontFamily:'inherit'
                      }}>취소</button>
                    </div>
                  </div>
                )}

                {/* 트리 뷰 — 행별 수정/삭제 */}
                {selectedId === m.id && editingId !== m.id && (
                  <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid #f0ede6' }}>
                    <div style={{ fontSize:'.75rem', color:'#a09b94', marginBottom:'.75rem' }}>
                      ✏️ 항목을 클릭해서 수정하거나 × 버튼으로 삭제할 수 있어요
                    </div>
                    {parseToTree(m.content).length > 0 ? (
                      parseToTree(m.content).map(node => (
                        <TreeNode
                          key={node.id}
                          node={node}
                          depth={0}
                          searchQuery={searchQuery}
                          onNodeDelete={(nodeLabel) => handleNodeDelete(m, nodeLabel)}
                          onNodeEdit={(nodeLabel, newLabel) => handleNodeEdit(m, nodeLabel, newLabel)}
                          manualId={m.id}
                          storeId={storeId}
                          nodeMedia={m.manual_node_media || []}
                          onMediaUpdate={onUpdate}
                        />
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
