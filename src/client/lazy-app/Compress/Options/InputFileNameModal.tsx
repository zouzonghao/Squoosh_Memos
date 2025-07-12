import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface InputFileNameModalProps {
  open: boolean;
  defaultFileName: string;
  extension: string;
  onConfirm: (fileName: string) => void;
  onClose: () => void;
}

export default function InputFileNameModal({ open, defaultFileName, extension, onConfirm, onClose }: InputFileNameModalProps) {
  const [fileName, setFileName] = useState(defaultFileName);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 当弹窗打开时，重置状态并聚焦输入框
  useEffect(() => {
    if (open) {
      setFileName(defaultFileName);
      setError('');
      // 延迟聚焦，确保 DOM 已渲染
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // 选中所有文本，方便用户直接输入
        }
      }, 100);
    }
  }, [open, defaultFileName]);

  const handleConfirm = () => {
    const trimmed = fileName.trim().replace(/\s+/g, '_');
    console.log('验证文件名:', trimmed, '原始输入:', fileName);
    
    if (!trimmed) {
      setError('文件名不能为空！');
      return;
    }
    
    // 更明确的正则表达式：中文、字母、数字、下划线、短横线
    const validFileNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/;
    const isValid = validFileNameRegex.test(trimmed);
    console.log('正则验证结果:', isValid);
    
    if (!isValid) {
      console.log('文件名验证失败:', trimmed, '长度:', trimmed.length);
      // 找出第一个无效字符
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        const charCode = char.charCodeAt(0);
        const charIsValid = /[\u4e00-\u9fa5a-zA-Z0-9_-]/.test(char);
        console.log(`位置 ${i}: "${char}" (编码: ${charCode}) - 有效: ${charIsValid}`);
        if (!charIsValid) {
          setError(`文件名包含无效字符: "${char}" (位置: ${i + 1})`);
          return;
        }
      }
      setError('文件名只能包含中文、字母、数字、下划线和短横线！');
      return;
    }
    
    console.log('文件名验证通过:', trimmed);
    setError('');
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.35)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        padding: '2.2rem 2.2rem 1.7rem 2.2rem',
        minWidth: '340px',
        maxWidth: '92vw',
        fontFamily: 'inherit',
      }}>
        <h2 style={{margin: '0 0 1.1em 0', fontSize: '1.3em', fontWeight: 700, textAlign: 'center', letterSpacing: '0.01em', color: '#6e4b3a'}}>输入上传文件名</h2>
        <div style={{marginBottom: '1.1em'}}>
          <div style={{fontWeight: 600, fontSize: '1.08em', marginBottom: '0.35em', color: '#333'}}>文件名（无需加后缀 .{extension}）</div>
          <input
            ref={inputRef}
            type="text"
            value={fileName}
            onInput={e => setFileName((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入文件名"
            style={{width: '100%', padding: '0.55em', fontSize: '1.08em', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'}}
          />
          <div style={{color: '#888', fontSize: '0.97em', marginTop: '0.22em', marginLeft: '2px'}}>可含中文、字母、数字、下划线、短横线</div>
          {error && <div style={{color: '#d32f2f', fontSize: '0.98em', marginTop: '0.3em'}}>{error}</div>}
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: '1.5em', marginTop: '1.3em'}}>
          <button 
            type="button" 
            style={{ 
              padding: '0.55em 1.5em', 
              borderRadius: '6px', 
              border: 'none', 
              background: '#f2f2f2',
              color: '#444',
              fontSize: '1.08em', 
              fontWeight: 400, 
              cursor: 'pointer', 
              transition: 'background 0.2s' 
            }} 
            onClick={onClose} 
            onMouseOver={e => (e.currentTarget.style.background='#e0e0e0')}
            onMouseOut={e => (e.currentTarget.style.background='#f2f2f2')}
          >
            取消
          </button>
          <button 
            type="button" 
            style={{ 
              padding: '0.55em 1.5em', 
              borderRadius: '6px', 
              border: 'none', 
              background: '#4CAF50',
              color: '#FFFFFF',
              fontSize: '1.08em', 
              fontWeight: 400, 
              cursor: 'pointer', 
              transition: 'background 0.2s'
            }} 
            onClick={handleConfirm}
            onMouseOver={e => (e.currentTarget.style.background='#3e8e41')}
            onMouseOut={e => (e.currentTarget.style.background='#4CAF50')}
          >
            上传
          </button>
        </div>
      </div>
    </div>
  );
} 