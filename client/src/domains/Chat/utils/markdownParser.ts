import type { MarkdownToken, MarkdownParseOptions } from '../types/markdown.types';

/**
 * 마크다운 텍스트를 토큰 배열로 파싱
 * 
 * 지원 문법:
 * - **bold** 또는 __bold__
 * - *italic* 또는 _italic_
 * - ~~strikethrough~~
 * - `inline code`
 * - ```language\ncode\n```
 * - [link text](url)
 */
export function parseMarkdown(text: string, options: MarkdownParseOptions = {}): MarkdownToken[] {
  const {
    allowLinks = true,
    allowCodeBlocks = true,
    maxNestingDepth = 10,
  } = options;

  if (!text) return [];

  const tokens: MarkdownToken[] = [];
  let currentIndex = 0;
  const textLength = text.length;

  /**
   * 코드 블록 파싱 (최우선)
   */
  const parseCodeBlock = (): MarkdownToken | null => {
    if (!allowCodeBlocks || currentIndex + 3 > textLength) return null;
    
    const startMarker = text.substring(currentIndex, currentIndex + 3);
    if (startMarker !== '```') return null;

    // 언어 감지
    let langEnd = currentIndex + 3;
    while (langEnd < textLength && text[langEnd] !== '\n' && text[langEnd] !== '`') {
      langEnd++;
    }

    const language = text.substring(currentIndex + 3, langEnd).trim();
    let codeStart = langEnd;
    if (text[codeStart] === '\n') codeStart++;

    // 닫는 ``` 찾기
    let codeEnd = codeStart;
    while (codeEnd < textLength - 2) {
      if (text.substring(codeEnd, codeEnd + 3) === '```') {
        const content = text.substring(codeStart, codeEnd);
        currentIndex = codeEnd + 3;
        return {
          type: 'codeBlock',
          content,
          language: language || undefined,
        };
      }
      codeEnd++;
    }

    return null;
  };

  /**
   * 인라인 코드 파싱
   */
  const parseInlineCode = (): MarkdownToken | null => {
    if (currentIndex >= textLength || text[currentIndex] !== '`') return null;

    let endIndex = currentIndex + 1;
    while (endIndex < textLength && text[endIndex] !== '`') {
      if (text[endIndex] === '\n') return null; // 줄바꿈이 있으면 코드 블록이 아님
      endIndex++;
    }

    if (endIndex >= textLength) return null;

    const content = text.substring(currentIndex + 1, endIndex);
    currentIndex = endIndex + 1;
    return {
      type: 'inlineCode',
      content,
    };
  };

  /**
   * 링크 파싱
   */
  const parseLink = (): MarkdownToken | null => {
    if (!allowLinks || currentIndex >= textLength || text[currentIndex] !== '[') return null;

    // [ 텍스트 찾기
    let textEnd = currentIndex + 1;
    while (textEnd < textLength && text[textEnd] !== ']') {
      if (text[textEnd] === '\n') return null;
      textEnd++;
    }

    if (textEnd >= textLength || textEnd + 1 >= textLength || text[textEnd + 1] !== '(') {
      return null;
    }

    const linkText = text.substring(currentIndex + 1, textEnd);
    let urlStart = textEnd + 2;
    let urlEnd = urlStart;

    // ) 찾기
    while (urlEnd < textLength && text[urlEnd] !== ')') {
      if (text[urlEnd] === '\n') return null;
      urlEnd++;
    }

    if (urlEnd >= textLength) return null;

    const url = text.substring(urlStart, urlEnd);
    currentIndex = urlEnd + 1;

    return {
      type: 'link',
      text: linkText,
      url,
    };
  };

  /**
   * 강조 파싱 (bold, italic, strikethrough)
   */
  const parseEmphasis = (): MarkdownToken | null => {
    if (currentIndex >= textLength) return null;

    const char = text[currentIndex];
    const nextChar = currentIndex + 1 < textLength ? text[currentIndex + 1] : null;

    // Strikethrough: ~~
    if (char === '~' && nextChar === '~') {
      let endIndex = currentIndex + 2;
      while (endIndex < textLength - 1) {
        if (text[endIndex] === '~' && text[endIndex + 1] === '~') {
          const content = text.substring(currentIndex + 2, endIndex);
          currentIndex = endIndex + 2;
          return {
            type: 'strikethrough',
            children: parseMarkdown(content, { ...options, maxNestingDepth: (maxNestingDepth || 10) - 1 }),
          };
        }
        endIndex++;
      }
      return null;
    }

    // Bold: ** 또는 __
    if ((char === '*' && nextChar === '*') || (char === '_' && nextChar === '_')) {
      let endIndex = currentIndex + 2;
      while (endIndex < textLength - 1) {
        if (text[endIndex] === char && text[endIndex + 1] === char) {
          const content = text.substring(currentIndex + 2, endIndex);
          currentIndex = endIndex + 2;
          return {
            type: 'bold',
            children: parseMarkdown(content, { ...options, maxNestingDepth: (maxNestingDepth || 10) - 1 }),
          };
        }
        endIndex++;
      }
      return null;
    }

    // Italic: * 또는 _
    if (char === '*' || char === '_') {
      // 다음 문자가 같은 기호가 아니어야 함 (bold와 구분)
      if (nextChar === char) return null;

      let endIndex = currentIndex + 1;
      while (endIndex < textLength) {
        if (text[endIndex] === char) {
          const content = text.substring(currentIndex + 1, endIndex);
          currentIndex = endIndex + 1;
          return {
            type: 'italic',
            children: parseMarkdown(content, { ...options, maxNestingDepth: (maxNestingDepth || 10) - 1 }),
          };
        }
        if (text[endIndex] === '\n') break; // 줄바꿈 시 중단
        endIndex++;
      }
    }

    return null;
  };

  /**
   * 일반 텍스트 파싱
   */
  const parseText = (): MarkdownToken => {
    let endIndex = currentIndex;
    while (endIndex < textLength) {
      const char = text[endIndex];
      
      // 특수 문자 감지 시 중단
      if (
        char === '*' ||
        char === '_' ||
        char === '~' ||
        char === '`' ||
        char === '[' ||
        char === '\n'
      ) {
        break;
      }
      endIndex++;
    }

    const content = text.substring(currentIndex, endIndex);
    currentIndex = endIndex;
    return {
      type: 'text',
      content,
    };
  };

  /**
   * 줄바꿈 파싱
   */
  const parseLineBreak = (): MarkdownToken | null => {
    if (currentIndex < textLength && text[currentIndex] === '\n') {
      currentIndex++;
      return {
        type: 'lineBreak',
      };
    }
    return null;
  };

  // 메인 파싱 루프
  while (currentIndex < textLength) {
    if (maxNestingDepth !== undefined && maxNestingDepth <= 0) {
      // 최대 중첩 깊이 도달 시 일반 텍스트로 처리
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        tokens.push({
          type: 'text',
          content: remainingText,
        });
      }
      break;
    }

    // 우선순위: 코드 블록 > 인라인 코드 > 링크 > 강조 > 줄바꿈 > 텍스트
    let token: MarkdownToken | null = null;

    if (allowCodeBlocks) {
      token = parseCodeBlock();
      if (token) {
        tokens.push(token);
        continue;
      }
    }

    token = parseInlineCode();
    if (token) {
      tokens.push(token);
      continue;
    }

    if (allowLinks) {
      token = parseLink();
      if (token) {
        tokens.push(token);
        continue;
      }
    }

    token = parseEmphasis();
    if (token) {
      tokens.push(token);
      continue;
    }

    token = parseLineBreak();
    if (token) {
      tokens.push(token);
      continue;
    }

    token = parseText();
    if (token) {
      tokens.push(token);
    }
  }

  return tokens;
}

/**
 * 텍스트가 마크다운 문법을 포함하는지 간단히 확인
 */
export function hasMarkdown(text: string): boolean {
  if (!text) return false;
  
  const markdownPatterns = [
    /\*\*.*?\*\*/,           // bold
    /__.*?__/,               // bold (underscore)
    /\*[^*\n].*?\*/,         // italic
    /_[^_\n].*?_/,           // italic (underscore)
    /~~.*?~~/,               // strikethrough
    /`[^`\n]+`/,             // inline code
    /```[\s\S]*?```/,        // code block
    /\[.*?\]\(.*?\)/,        // link
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}
