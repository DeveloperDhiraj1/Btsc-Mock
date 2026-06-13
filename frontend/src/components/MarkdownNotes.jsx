import React, { useMemo } from 'react';

// Minimal Markdown renderer tuned for AI-generated revision notes.
// Handles: headings, bullet/numbered lists, blockquotes, bold/italic,
// inline + block code, inline math ($...$), horizontal rules.
// Output classes match the rest of the dark/neon UI for a premium feel.

const inlineTokenize = (text) => {
  // Order matters: code first (so its content isn't re-parsed), then math,
  // then bold (** / __), then italic (* / _), then links.
  const patterns = [
    { re: /`([^`]+)`/g, render: (m) => ({ type: 'code', value: m[1] }) },
    { re: /\$\$?([^$]+)\$\$?/g, render: (m) => ({ type: 'math', value: m[1] }) },
    { re: /\*\*([^*]+)\*\*/g, render: (m) => ({ type: 'strong', value: m[1] }) },
    { re: /__([^_]+)__/g, render: (m) => ({ type: 'strong', value: m[1] }) },
    { re: /(?<![A-Za-z0-9])\*([^*\n]+)\*(?![A-Za-z0-9])/g, render: (m) => ({ type: 'em', value: m[1] }) },
    { re: /(?<![A-Za-z0-9])_([^_\n]+)_(?![A-Za-z0-9])/g, render: (m) => ({ type: 'em', value: m[1] }) },
    { re: /\[([^\]]+)\]\(([^)]+)\)/g, render: (m) => ({ type: 'link', value: m[1], href: m[2] }) }
  ];

  const tokens = [{ type: 'text', value: text }];
  for (const { re, render } of patterns) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'text') continue;
      const src = tokens[i].value;
      const parts = [];
      let cursor = 0;
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(src)) !== null) {
        if (match.index > cursor) parts.push({ type: 'text', value: src.slice(cursor, match.index) });
        parts.push(render(match));
        cursor = match.index + match[0].length;
      }
      if (parts.length > 0) {
        if (cursor < src.length) parts.push({ type: 'text', value: src.slice(cursor) });
        tokens.splice(i, 1, ...parts);
        i += parts.length - 1;
      }
    }
  }
  return tokens;
};

const renderInline = (text, keyPrefix = '') => {
  const tokens = inlineTokenize(text);
  return tokens.map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    if (tok.type === 'strong') return <strong key={key} className="font-semibold text-white">{tok.value}</strong>;
    if (tok.type === 'em') return <em key={key} className="italic text-slate-200">{tok.value}</em>;
    if (tok.type === 'code') {
      return (
        <code key={key} className="rounded-md border border-neon-blue/20 bg-neon-blue/[0.08] px-1.5 py-0.5 font-mono text-[0.85em] text-neon-cyan">
          {tok.value}
        </code>
      );
    }
    if (tok.type === 'math') {
      return (
        <span key={key} className="mx-0.5 inline-block rounded-md border border-neon-purple/25 bg-neon-purple/[0.08] px-2 py-0.5 font-mono text-[0.9em] text-fuchsia-200">
          {tok.value}
        </span>
      );
    }
    if (tok.type === 'link') {
      return (
        <a key={key} href={tok.href} target="_blank" rel="noopener noreferrer" className="font-medium text-neon-cyan underline-offset-4 hover:underline">
          {tok.value}
        </a>
      );
    }
    return <React.Fragment key={key}>{tok.value}</React.Fragment>;
  });
};

const parseBlocks = (raw = '') => {
  const lines = String(raw).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: 'code', lang, value: buf.join('\n') });
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\s*\1\s*\1[-*_\s]*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, value: heading[2].trim() });
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', value: buf.join(' ').trim() });
      continue;
    }

    // Unordered list
    if (/^\s*[-*•]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Blank line — paragraph separator
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — accumulate consecutive non-blank, non-special lines
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6}\s|>\s?|```|\s*[-*•]\s+|\s*\d+\.\s+)/.test(lines[i]) &&
      !/^\s*([-*_])\s*\1\s*\1[-*_\s]*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', value: buf.join(' ').trim() });
  }
  return blocks;
};

const headingClass = (level) => {
  if (level === 1) return 'font-display text-2xl font-bold text-gradient mt-2 mb-4';
  if (level === 2) return 'font-display text-xl font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10';
  if (level === 3) return 'font-display text-base font-bold text-white mt-5 mb-2 flex items-center gap-2';
  if (level === 4) return 'text-[11px] font-bold uppercase tracking-[0.18em] text-neon-cyan mt-4 mb-2';
  return 'text-sm font-semibold text-slate-200 mt-3 mb-1';
};

export default function MarkdownNotes({ source = '' }) {
  const blocks = useMemo(() => parseBlocks(source), [source]);

  return (
    <article className="space-y-3 text-sm leading-relaxed text-slate-300">
      {blocks.map((b, idx) => {
        const key = `b-${idx}`;
        if (b.type === 'heading') {
          const Tag = `h${Math.min(b.level, 6)}`;
          if (b.level === 3) {
            return (
              <Tag key={key} className={headingClass(b.level)}>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                {renderInline(b.value, key)}
              </Tag>
            );
          }
          return <Tag key={key} className={headingClass(b.level)}>{renderInline(b.value, key)}</Tag>;
        }
        if (b.type === 'p') {
          return <p key={key} className="text-slate-300/90">{renderInline(b.value, key)}</p>;
        }
        if (b.type === 'ul') {
          return (
            <ul key={key} className="space-y-2 pl-1">
              {b.items.map((it, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-neon-blue shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
                  <span>{renderInline(it, `${key}-${i}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === 'ol') {
          return (
            <ol key={key} className="space-y-2">
              {b.items.map((it, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-neon-purple/30 bg-neon-purple/10 font-mono text-[10px] font-bold text-fuchsia-200">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{renderInline(it, `${key}-${i}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={key} className="rounded-r-xl border-l-2 border-neon-cyan/60 bg-neon-cyan/[0.05] px-4 py-3 italic text-slate-200">
              {renderInline(b.value, key)}
            </blockquote>
          );
        }
        if (b.type === 'code') {
          return (
            <pre key={key} className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-4 font-mono text-[12.5px] leading-relaxed text-slate-200 shadow-inner">
              <code>{b.value}</code>
            </pre>
          );
        }
        if (b.type === 'hr') {
          return <hr key={key} className="my-4 border-t border-white/10" />;
        }
        return null;
      })}
    </article>
  );
}
