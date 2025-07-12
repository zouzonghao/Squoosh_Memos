import { h } from 'preact';
import { useState } from 'preact/hooks';

interface MemosSettingsModalProps {
  open: boolean;
  defaultUrl: string;
  defaultToken: string;
  onSave: (domain: string, token: string) => void;
  onClose: () => void;
}

export default function MemosSettingsModal({ open, defaultUrl, defaultToken, onSave, onClose }: MemosSettingsModalProps) {
  // 只保留域名部分
  let defaultDomain = '';
  try {
    if (defaultUrl) {
      const url = new URL(defaultUrl);
      defaultDomain = url.hostname;
    }
  } catch {
    defaultDomain = defaultUrl.replace(/^https?:\/\//, '').replace(/\/api\/v1\/memos$/, '');
  }
  const [domain, setDomain] = useState(defaultDomain);
  const [token, setToken] = useState(defaultToken);

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
        <h2 style={{margin: '0 0 1.1em 0', fontSize: '1.5em', fontWeight: 700, textAlign: 'center', letterSpacing: '0.01em', color: '#6e4b3a'}}>Memo API 设置</h2>
        <div style={{marginBottom: '1.1em'}}>
          <div style={{fontWeight: 600, fontSize: '1.08em', marginBottom: '0.35em', color: '#333'}}>API 域名</div>
          <input
            type="text"
            value={domain}
            onInput={e => setDomain((e.target as HTMLInputElement).value)}
            placeholder="如：memos.domain.com"
            style={{width: '100%', padding: '0.55em', fontSize: '1.08em', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'}}
          />
          <div style={{color: '#888', fontSize: '0.97em', marginTop: '0.22em', marginLeft: '2px'}}>请输入 Memos 域名，如 <b>memos.domain.com</b></div>
        </div>
        <div style={{marginBottom: '1.3em'}}>
          <div style={{fontWeight: 600, fontSize: '1.08em', marginBottom: '0.35em', color: '#333'}}>API Token</div>
          <input
            type="text"
            value={token}
            onInput={e => setToken((e.target as HTMLInputElement).value)}
            placeholder="如：eyJhbGciOiJIUz....."
            style={{width: '100%', padding: '0.55em', fontSize: '1.08em', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'}}
          />
          <div style={{color: '#888', fontSize: '0.97em', marginTop: '0.22em', marginLeft: '2px'}}>请输入 Memos Token，无需加 Bearer 前缀</div>
        </div>
        <div style={{display: 'flex', justifyContent: 'right', gap: '1.5em', marginTop: '1.3em'}}>
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
            onClick={() => onSave(domain, token)}
            onMouseOver={e => (e.currentTarget.style.background='#3e8e41')}
            onMouseOut={e => (e.currentTarget.style.background='#4CAF50')}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
} 