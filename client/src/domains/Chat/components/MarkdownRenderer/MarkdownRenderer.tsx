import { memo } from 'preact/compat';
import { renderMarkdownFragment } from '../../utils/markdownRenderer';
import { hasMarkdown } from '../../utils/markdownParser';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * 마크다운 텍스트를 렌더링하는 컴포넌트
 * 
 * 마크다운 문법이 없으면 일반 텍스트로 표시
 * 마크다운 문법이 있으면 파싱하여 렌더링
 */
function MarkdownRendererComponent({ content, className = '', variant = 'default' }: MarkdownRendererProps) {
  if (!content) return null;

  // 마크다운 문법이 없으면 일반 텍스트로 표시
  if (!hasMarkdown(content)) {
    return (
      <span className={`markdown-renderer markdown-renderer--${variant} ${className}`.trim()}>
        {content}
      </span>
    );
  }

  // 마크다운 렌더링
  const rendered = renderMarkdownFragment(content);

  return (
    <div className={`markdown-renderer markdown-renderer--${variant} ${className}`.trim()}>
      {rendered}
    </div>
  );
}

export const MarkdownRenderer = memo(MarkdownRendererComponent);
