import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/73faad71-80cb-4e55-ab02-8e3a6d1aacf0";

const NAV_LINKS = [
  { id: "analyzer", label: "АНАЛИЗАТОР" },
  { id: "results", label: "РЕЗУЛЬТАТЫ" },
  { id: "docs", label: "ДОКУМЕНТАЦИЯ" },
  { id: "contacts", label: "КОНТАКТЫ" },
  { id: "about", label: "О СЕРВИСЕ" },
];

interface Results {
  style: string;
  structure: string;
  notes: string;
  meta?: { title: string; source: string; url: string };
}

const VUMeter = () => (
  <div className="flex items-end gap-[2px] h-6 w-8">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="vu-bar flex-1 rounded-sm"
        style={{
          '--duration': `${0.6 + i * 0.15}s`,
          '--delay': `${i * 0.08}s`,
          background: i < 3 ? 'var(--neon)' : i === 3 ? '#ffcc00' : '#ff4444',
        } as React.CSSProperties}
      />
    ))}
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button className="copy-btn rounded-sm" onClick={() => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }}>
      {copied ? "✓ COPIED" : "COPY"}
    </button>
  );
};

export default function Index() {
  const [activeNav, setActiveNav] = useState("analyzer");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), notes: notes.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при генерации. Попробуйте ещё раз.");
        return;
      }

      setResults(data);
      setActiveNav("results");
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setError("Не удалось подключиться к серверу. Проверьте интернет-соединение.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen daw-grid" style={{ background: 'var(--panel-bg)', fontFamily: 'IBM Plex Sans, sans-serif' }}>

      {/* Top Status Bar */}
      <div className="flex items-center justify-between px-6 py-1.5 border-b" style={{ borderColor: 'var(--panel-border)', background: '#080b0e' }}>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-widest" style={{ color: '#2a3540' }}>SUNO ENGINEER PRO</span>
          <span className="font-mono text-[10px]" style={{ color: '#2a3540' }}>v1.0.0</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--neon)' }} />
            <span className="font-mono text-[10px]" style={{ color: 'var(--neon)' }}>ONLINE</span>
          </div>
          <VUMeter />
        </div>
      </div>

      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--panel-border)', background: '#0a0d10' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-sm border" style={{ background: 'var(--neon-dim)', borderColor: 'rgba(0,255,179,0.3)' }}>
              <Icon name="AudioWaveform" size={18} className="neon-text" />
            </div>
            <div>
              <div className="font-display font-bold text-lg tracking-wider leading-none" style={{ color: '#e8edf2', letterSpacing: '0.12em' }}>
                SUNO <span className="neon-text">ENGINEER</span> PRO
              </div>
              <div className="font-mono text-[9px] tracking-widest mt-0.5" style={{ color: '#2e3d4a' }}>REVERSE ENGINEERING TOOL</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <button key={link.id} className={`nav-link ${activeNav === link.id ? 'active' : ''}`} onClick={() => setActiveNav(link.id)}>
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="copy-btn rounded-sm flex items-center gap-1.5" style={{ padding: '5px 12px' }}>
              <Icon name="Settings" size={11} />
              <span>НАСТРОЙКИ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b" style={{ borderColor: 'var(--panel-border)', background: 'linear-gradient(180deg, #0a0d10 0%, var(--panel-bg) 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-6" style={{ background: 'var(--neon)' }} />
                <span className="font-mono text-[11px] tracking-widest" style={{ color: 'var(--neon)' }}>REVERSE ENGINEERING MODULE</span>
              </div>
              <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight mb-4" style={{ color: '#e8edf2', letterSpacing: '0.04em' }}>
                РЕВЕРС-ИНЖИНИРИНГ ТРЕКОВ<br />
                <span className="neon-text">ДЛЯ SUNO AI</span>
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#5a7080' }}>
                Вставьте ссылку на трек с YouTube, Suno, SoundCloud или Spotify.
                AI проанализирует его и выдаст готовый промт: стилевые теги, структуру и инженерные заметки.
              </p>
            </div>
            <div className="flex gap-6">
              {[
                { val: "120", unit: "символов", label: "Style Prompt" },
                { val: "3", unit: "блока", label: "Вывод" },
                { val: "∞", unit: "итераций", label: "Рефайнинг" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="font-display font-semibold text-2xl neon-text">{s.val}</div>
                  <div className="font-mono text-[9px] tracking-wider mt-0.5" style={{ color: '#3a5060' }}>{s.unit}</div>
                  <div className="font-mono text-[9px] tracking-wider" style={{ color: '#2a3a48' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6" id="analyzer">

        {/* Analyzer Panel */}
        <div className="daw-panel-raised rounded-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#1e2328', background: '#0f1318' }}>
            <div className="flex items-center gap-2">
              <Icon name="Link" size={13} style={{ color: 'var(--neon)' }} />
              <span className="font-mono text-[11px] tracking-widest" style={{ color: '#6a8090' }}>TRACK INPUT</span>
              <div className="w-px h-3 mx-1" style={{ background: '#1e2328' }} />
              <span className="font-mono text-[10px]" style={{ color: '#2e3d4a' }}>URL ANALYZER</span>
            </div>
            <div className="flex items-center gap-2">
              {['Suno AI', 'YouTube', 'SoundCloud', 'Spotify'].map(s => (
                <span key={s} className="tag-chip rounded-sm">{s}</span>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* URL input */}
            <div>
              <div className="font-mono text-[10px] tracking-widest mb-2" style={{ color: '#3a5060' }}>ССЫЛКА НА ТРЕК-РЕФЕРЕНС</div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon name="Link2" size={14} style={{ color: '#3a5060' }} />
                </div>
                <input
                  type="url"
                  className="daw-textarea w-full rounded-sm py-3 pl-9 pr-4"
                  style={{ height: 'auto' }}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://suno.com/song/... или https://youtube.com/watch?v=..."
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                />
              </div>
            </div>

            {/* Optional notes */}
            <div>
              <div className="font-mono text-[10px] tracking-widest mb-2" style={{ color: '#2e3d4a' }}>ДОПОЛНИТЕЛЬНЫЕ ЗАМЕТКИ <span style={{ color: '#1e2832' }}>(НЕОБЯЗАТЕЛЬНО)</span></div>
              <textarea
                className="daw-textarea w-full rounded-sm p-3"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="BPM, жанр, особенности звука, которые хотите учесть..."
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-3 px-3 py-2 rounded-sm flex items-center gap-2" style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)' }}>
              <Icon name="AlertCircle" size={13} style={{ color: '#ff4444' }} />
              <span className="font-mono text-[11px]" style={{ color: '#ff6666' }}>{error}</span>
            </div>
          )}

          {/* Generate button */}
          <div className="px-4 pb-4 flex items-center gap-4">
            <button
              className="neon-btn rounded-sm px-8 py-3 flex items-center gap-2.5 text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleGenerate}
              disabled={loading || !url.trim()}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={15} className="animate-spin" />
                  АНАЛИЗИРУЮ...
                </>
              ) : (
                <>
                  <Icon name="Zap" size={15} />
                  СГЕНЕРИРОВАТЬ SUNO-ПРОМТ
                </>
              )}
            </button>
            {loading && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="shimmer rounded-sm" style={{ width: 4, height: 20, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <span className="font-mono text-[10px]" style={{ color: '#3a5060' }}>REVERSE ENGINEERING...</span>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} id="results">
          {results && (
            <div className="space-y-4 fade-in-up">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: 'var(--panel-border)' }} />
                <div className="flex items-center gap-2 px-3 py-1 rounded-sm" style={{ background: 'rgba(0,255,179,0.05)', border: '1px solid rgba(0,255,179,0.15)' }}>
                  <Icon name="CheckCircle" size={11} style={{ color: 'var(--neon)' }} />
                  <span className="font-mono text-[10px] tracking-widest neon-text">ANALYSIS COMPLETE</span>
                  {results.meta?.title && (
                    <span className="font-mono text-[10px]" style={{ color: '#3a5060' }}>— {results.meta.source}: {results.meta.title.slice(0, 40)}{results.meta.title.length > 40 ? '...' : ''}</span>
                  )}
                </div>
                <div className="h-px flex-1" style={{ background: 'var(--panel-border)' }} />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Card 1: Style */}
                <div className="result-card active rounded-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: '#1c2128' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full" style={{ background: 'var(--neon)' }} />
                      <span className="font-mono text-[11px] tracking-widest" style={{ color: '#6a8090' }}>01</span>
                      <span className="font-display font-medium text-sm tracking-wider" style={{ color: '#c8d4e0', letterSpacing: '0.1em' }}>STYLE PROMPT</span>
                      <span className="tag-chip rounded-sm">TAGS</span>
                    </div>
                    <CopyButton text={results.style} />
                  </div>
                  <div className="p-4">
                    <div className="font-mono text-sm leading-relaxed" style={{ color: 'var(--neon)', wordBreak: 'break-word' }}>
                      {results.style}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Icon name="Info" size={11} style={{ color: '#2e3d4a' }} />
                      <span className="font-mono text-[10px]" style={{ color: '#2e3d4a' }}>
                        {results.style.length} / 120 символов — вставить в поле "Style" в Suno AI
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Structure */}
                <div className="result-card active rounded-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: '#1c2128' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full" style={{ background: '#ffcc00' }} />
                      <span className="font-mono text-[11px] tracking-widest" style={{ color: '#6a8090' }}>02</span>
                      <span className="font-display font-medium text-sm tracking-wider" style={{ color: '#c8d4e0', letterSpacing: '0.1em' }}>LYRICS & STRUCTURE</span>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-sm" style={{ background: 'rgba(255,204,0,0.08)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.2)' }}>META-TAGS</span>
                    </div>
                    <CopyButton text={results.structure} />
                  </div>
                  <div className="p-4">
                    <pre className="font-mono text-sm leading-loose whitespace-pre-wrap">
                      {results.structure.split('\n').map((line, i) => {
                        const isTag = line.startsWith('[') && line.endsWith(']');
                        const isLyric = line.startsWith('(') && line.endsWith(')');
                        return (
                          <span key={i} className="block">
                            {isTag ? <span style={{ color: '#ffcc00' }}>{line}</span>
                              : isLyric ? <span style={{ color: '#5a8090', fontStyle: 'italic' }}>{line}</span>
                              : <span style={{ color: '#4a6070' }}>{line}</span>}
                          </span>
                        );
                      })}
                    </pre>
                    <div className="mt-3 flex items-center gap-2">
                      <Icon name="Info" size={11} style={{ color: '#2e3d4a' }} />
                      <span className="font-mono text-[10px]" style={{ color: '#2e3d4a' }}>вставить в поле "Lyrics" в Suno AI (режим Custom)</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Notes */}
                <div className="result-card active rounded-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: '#1c2128' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-sm" style={{ background: '#7c5cbf' }} />
                      <span className="font-mono text-[11px] tracking-widest" style={{ color: '#6a8090' }}>03</span>
                      <span className="font-display font-medium text-sm tracking-wider" style={{ color: '#c8d4e0', letterSpacing: '0.1em' }}>ENGINEERING NOTES</span>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-sm" style={{ background: 'rgba(124,92,191,0.1)', color: '#9b7dd4', border: '1px solid rgba(124,92,191,0.25)' }}>TECH LOG</span>
                    </div>
                    <CopyButton text={results.notes} />
                  </div>
                  <div className="p-4">
                    <p className="text-sm leading-relaxed" style={{ color: '#7a9aaa' }}>{results.notes}</p>
                    <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: '#1c2128' }}>
                      <Icon name="Lightbulb" size={11} style={{ color: '#7c5cbf' }} />
                      <span className="font-mono text-[10px]" style={{ color: '#3a4a5a' }}>используйте эти знания для ручной доработки промта</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!results && !loading && (
            <div className="daw-panel rounded-sm p-10 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-sm flex items-center justify-center" style={{ background: '#0d1117', border: '1px solid #1c2128' }}>
                  <Icon name="AudioLines" size={22} style={{ color: '#2e3d4a' }} />
                </div>
              </div>
              <p className="font-mono text-xs tracking-widest" style={{ color: '#2e3d4a' }}>РЕЗУЛЬТАТ ПОЯВИТСЯ ЗДЕСЬ</p>
              <p className="font-mono text-[10px] mt-1" style={{ color: '#1e2832' }}>ВСТАВЬТЕ ССЫЛКУ НА ТРЕК И НАЖМИТЕ ГЕНЕРИРОВАТЬ</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t mt-12" style={{ borderColor: 'var(--panel-border)', background: '#080b0e' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="AudioWaveform" size={12} style={{ color: 'var(--neon)' }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: '#2a3540' }}>SUNO ENGINEER PRO — REVERSE ENGINEERING TOOL</span>
          </div>
          <div className="font-mono text-[10px]" style={{ color: '#1e2832' }}>BUILD 2026.06.01</div>
        </div>
      </footer>
    </div>
  );
}
