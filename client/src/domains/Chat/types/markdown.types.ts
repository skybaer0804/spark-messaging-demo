/**
 * 마크다운 토큰 타입 정의
 */
export type MarkdownTokenType =
  | 'text'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'inlineCode'
  | 'codeBlock'
  | 'link'
  | 'lineBreak';

/**
 * 마크다운 토큰 인터페이스
 */
export interface MarkdownToken {
  type: MarkdownTokenType;
  content?: string;
  children?: MarkdownToken[];
  language?: string; // 코드 블록의 경우
  url?: string; // 링크의 경우
  text?: string; // 링크의 표시 텍스트
}

/**
 * 마크다운 파싱 옵션
 */
export interface MarkdownParseOptions {
  allowLinks?: boolean;
  allowCodeBlocks?: boolean;
  maxNestingDepth?: number;
}
