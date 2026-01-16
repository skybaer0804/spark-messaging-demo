import { h, Fragment } from 'preact';
import type { VNode } from 'preact';
import type { MarkdownToken } from '../types/markdown.types';
import { parseMarkdown } from './markdownParser';

/**
 * URL이 안전한지 검증 (XSS 방지)
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // http, https만 허용
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // 상대 경로는 허용하지 않음 (보안상)
    return false;
  }
}

/**
 * 텍스트를 안전하게 이스케이프 (XSS 방지)
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 마크다운 토큰을 Preact VNode로 렌더링
 */
export function renderMarkdownToken(token: MarkdownToken, key?: string | number): VNode {
  switch (token.type) {
    case 'text':
      return h('span', { key }, token.content || '');

    case 'bold':
      return h(
        'strong',
        { key, className: 'markdown-bold' },
        token.children?.map((child, idx) => renderMarkdownToken(child, idx)) || []
      );

    case 'italic':
      return h(
        'em',
        { key, className: 'markdown-italic' },
        token.children?.map((child, idx) => renderMarkdownToken(child, idx)) || []
      );

    case 'strikethrough':
      return h(
        'del',
        { key, className: 'markdown-strikethrough' },
        token.children?.map((child, idx) => renderMarkdownToken(child, idx)) || []
      );

    case 'inlineCode':
      return h(
        'code',
        { key, className: 'markdown-inline-code' },
        escapeHtml(token.content || '')
      );

    case 'codeBlock':
      return h(
        'pre',
        { key, className: 'markdown-code-block' },
        h(
          'code',
          {
            className: token.language ? `language-${token.language}` : undefined,
          },
          escapeHtml(token.content || '')
        )
      );

    case 'link':
      const url = token.url || '';
      const linkText = token.text || url;
      const isSafe = isValidUrl(url);

      return h(
        'a',
        {
          key,
          className: 'markdown-link',
          href: isSafe ? url : undefined,
          target: isSafe ? '_blank' : undefined,
          rel: isSafe ? 'noopener noreferrer' : undefined,
          onClick: (e: Event) => {
            if (!isSafe) {
              e.preventDefault();
            }
          },
        },
        linkText
      );

    case 'lineBreak':
      return h('br', { key });

    default:
      return h('span', { key }, '');
  }
}

/**
 * 마크다운 텍스트를 Preact VNode 배열로 렌더링
 */
export function renderMarkdown(text: string): VNode[] {
  if (!text) return [];

  const tokens = parseMarkdown(text);
  return tokens.map((token, idx) => renderMarkdownToken(token, idx));
}

/**
 * 마크다운 텍스트를 단일 Fragment로 렌더링
 */
export function renderMarkdownFragment(text: string): VNode {
  const nodes = renderMarkdown(text);
  return h(Fragment, {}, ...nodes);
}
