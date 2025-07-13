import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface InputFileNameModalProps {
  open: boolean;
  defaultFileName: string;
  extension: string;
  onConfirm: (fileName: string, content: string, visibility: 'PRIVATE' | 'PUBLIC') => void;
  onClose: () => void;
}

const modalAnim = `@keyframes popupIn {0%{transform:scale(0.92) translateY(30px);opacity:0;}100%{transform:scale(1) translateY(0);opacity:1;}}`;
const rippleAnim = `@keyframes ripple {to{transform:scale(2.5);opacity:0;}}`;
const MAIN_COLOR = '#5FB4E4'; // rgb(95,180,228)
const ACCENT_COLOR = '#D00B5A'; // rgb(208,11,90)
const BG_DARK = '#333';
const FG_LIGHT = '#f7f7f7';
const FG_SUBTLE = '#bfc9d1';
const FIELD_BG = '#232323';
const FIELD_BORDER = '#444';
const FIELD_BORDER_FOCUS = MAIN_COLOR;
const ERROR_COLOR = ACCENT_COLOR;
const BTN_GREEN = '#70c38f'; // rgb(112,195,143)
const BTN_GREEN_HOVER = '#4fa36e';
const LABEL_COLOR = '#c8d0db';

export default function InputFileNameModal({ open, defaultFileName, extension, onConfirm, onClose }: InputFileNameModalProps) {
  const [fileName, setFileName] = useState(defaultFileName);
  const [content, setContent] = useState(defaultFileName);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PUBLIC');
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState<'content'|'fileName'|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setFileName(defaultFileName);
      setContent('');
      setVisibility('PUBLIC');
      setError('');
      setFocusField(null);
      // 阻止页面滚动
      document.body.style.overflow = 'hidden';
      // 禁用expand-arrow pointer事件，防止视觉高亮
      document.querySelectorAll('.expand-arrow').forEach(el => {
        (el as HTMLElement).style.pointerEvents = 'none';
      });
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    } else {
      document.body.style.overflow = '';
      // 恢复expand-arrow pointer事件
      document.querySelectorAll('.expand-arrow').forEach(el => {
        (el as HTMLElement).style.pointerEvents = '';
      });
    }
    // 关闭弹窗时恢复滚动和pointer事件
    return () => {
      document.body.style.overflow = '';
      document.querySelectorAll('.expand-arrow').forEach(el => {
        (el as HTMLElement).style.pointerEvents = '';
      });
    };
  }, [open, defaultFileName]);

  const handleConfirm = () => {
    const trimmed = fileName.trim().replace(/\s+/g, '_');
    let trimmedContent = content.trim();
    if (!trimmed) {
      setError('文件名不能为空！');
      setFocusField('fileName');
      return;
    }
    const validFileNameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/;
    if (!validFileNameRegex.test(trimmed)) {
      setError('文件名只能包含中文、字母、数字、下划线和短横线！');
      setFocusField('fileName');
      return;
    }
    // 如果内容为空，则用文件名作为内容
    if (!trimmedContent) trimmedContent = trimmed;
    setError('');
    onConfirm(trimmed, trimmedContent, visibility);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  // 动态注入动画样式
  if (typeof window !== 'undefined' && !document.getElementById('modal-anim-style')) {
    const style = document.createElement('style');
    style.id = 'modal-anim-style';
    style.innerHTML = modalAnim + rippleAnim;
    document.head.appendChild(style);
  }

  // ripple 效果
  const createRipple = (e: any) => {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    circle.style.width = circle.style.height = diameter + 'px';
    circle.style.left = e.clientX - btn.getBoundingClientRect().left - diameter/2 + 'px';
    circle.style.top = e.clientY - btn.getBoundingClientRect().top - diameter/2 + 'px';
    circle.style.position = 'absolute';
    circle.style.background = 'rgba(255,255,255,0.5)';
    circle.style.borderRadius = '50%';
    circle.style.pointerEvents = 'none';
    circle.style.transform = 'scale(0)';
    circle.style.animation = 'ripple 0.5s linear';
    circle.style.zIndex = '2';
    btn.appendChild(circle);
    setTimeout(()=>circle.remove(), 500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.32)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2.5px)',
        WebkitBackdropFilter: 'blur(2.5px)'
      }}
      onTouchMove={e => e.preventDefault()}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <div style={{
        background: BG_DARK,
        borderRadius: '20px',
        boxShadow: `0 8px 40px rgba(0,0,0,0.45)`,
        padding: '1.8em 1.6em 1.8em 1.6em',
        minWidth: '320px',
        fontFamily: 'inherit',
        position: 'relative',
        animation: 'popupIn 0.25s cubic-bezier(.4,2,.6,1) both',
        width: '100%',
        maxWidth: 420,
        boxSizing: 'border-box',
      }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      >
        {/* 右上角关闭按钮 */}
        <button
          onClick={onClose}
          aria-label="关闭"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: 'none',
            background: '#232323',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: ACCENT_COLOR,
            transition: 'background 0.18s, color 0.18s',
            zIndex: 10
          }}
          onMouseOver={e => {e.currentTarget.style.background='#3a2a2a';e.currentTarget.style.color=MAIN_COLOR;}}
          onMouseOut={e => {e.currentTarget.style.background='#232323';e.currentTarget.style.color=ACCENT_COLOR;}}
        >
          ×
        </button>
        <h2 style={{
          margin: '0 0 1em 0',
          fontSize: '1.5em',
          fontWeight: 700,
          textAlign: 'left',
          letterSpacing: '0.01em',
          color: LABEL_COLOR
        }}>上传到 Memos</h2>
        {/* 1. 内容（多行文本） */}
        <div style={{marginBottom: '0.8em'}}>
          <label style={{
            display: 'block',
            color: LABEL_COLOR,
            fontSize: '1em',
            marginBottom: '0.5em',
            textAlign: 'left',
            fontWeight: 500,
          }}>内容（可选）</label>
          <textarea
            ref={contentRef}
            value={content}
            onInput={e => setContent((e.target as HTMLTextAreaElement).value)}
            onFocus={()=>setFocusField('content')}
            onBlur={()=>setFocusField(null)}
            placeholder="空则使用文件名作为内容"
            style={{
              width: '100%',
              padding: '1em',
              fontSize: '1em',
              border: 'none',
              borderBottom: `2px solid ${focusField==='content' ? MAIN_COLOR : FIELD_BORDER}`,
              outline: 'none',
              borderRadius: '10px 10px 0 0',
              boxSizing: 'border-box',
              minHeight: '5em',
              resize: 'vertical',
              fontFamily: 'inherit',
              background: FIELD_BG,
              color: FG_LIGHT,
              transition: 'border-color 0.18s',
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        {/* 2. 文件名（单行文本） */}
        <div style={{marginBottom: '0.8em'}}>
          <label style={{
            display: 'block',
            color: LABEL_COLOR,
            fontSize: '1em',
            marginBottom: '0.5em',
            textAlign: 'left',
            fontWeight: 500,
          }}>文件名（无需加后缀 .{extension}）</label>
          <input
            ref={inputRef}
            type="text"
            value={fileName}
            onInput={e => setFileName((e.target as HTMLInputElement).value)}
            onFocus={()=>setFocusField('fileName')}
            onBlur={()=>setFocusField(null)}
            onKeyDown={handleKeyDown}
            placeholder=" "
            style={{
              width: '100%',
              padding: '1em',
              fontSize: '1em',
              border: 'none',
              borderBottom: `2px solid ${focusField==='fileName' ? MAIN_COLOR : FIELD_BORDER}`,
              outline: 'none',
              borderRadius: '10px 10px 0 0',
              boxSizing: 'border-box',
              background: FIELD_BG,
              color: FG_LIGHT,
              transition: 'border-color 0.18s',
            }}
          />
          {error && <div style={{color: ERROR_COLOR, fontSize: '1em', marginTop: '0.5em'}}>{error}</div>}
        </div>
        {/* 3. 是否公开（选项）+ 上传按钮同行 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1em', marginTop: '1.5em', marginBottom: '0em', justifyContent: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {[{label:'公开',value:'PUBLIC',color:MAIN_COLOR},{label:'私有',value:'PRIVATE',color:ACCENT_COLOR}].map(opt=>(
            <label key={opt.value} style={{
              display: 'flex', alignItems: 'center', gap: '0.3em', cursor: 'pointer',
              fontWeight: visibility===opt.value?700:400, color: visibility===opt.value?opt.color:FG_SUBTLE,
              fontSize: '0.95em',
              padding: '0.3em 0.7em 0.3em 0.4em', borderRadius: '8px',
              background: visibility===opt.value?'#232323':'transparent',
              border: `2px solid ${visibility===opt.value?opt.color:FIELD_BORDER}`,
              transition: 'all 0.18s',
              position:'relative',
              minWidth: 40,
            }}>
              <span style={{
                display:'inline-block', width:16, height:16, borderRadius:'50%', border:`6px solid ${visibility===opt.value?opt.color:FIELD_BORDER}`,
                background: 'transparent',
                marginRight: 2, position:'relative', transition:'all 0.18s',
                boxShadow: visibility===opt.value?`0 0 0 2px ${opt.color}33`:'none',
              }}>
              </span>
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={visibility === opt.value}
                onChange={() => setVisibility(opt.value as 'PUBLIC'|'PRIVATE')}
                style={{display:'none'}}
              />
              {opt.label}
            </label>
          ))}
          <button
            type="button"
            style={{
              marginLeft: 'auto',
              padding: '0.7em 2.2em',
              borderRadius: '8px',
              border: 'none',
              background: BTN_GREEN,
              color: '#fff',
              fontSize: '1.2em',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'none',
              position:'relative',
              overflow:'hidden',
              transition: 'background 0.18s',
              minWidth: 100,
              height: '2.2em',
              lineHeight: '1.2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleConfirm}
            onMouseDown={createRipple}
            onMouseOver={e => (e.currentTarget.style.background=BTN_GREEN_HOVER)}
            onMouseOut={e => (e.currentTarget.style.background=BTN_GREEN)}
          >
            上传
          </button>
        </div>
      </div>
    </div>
  );
} 