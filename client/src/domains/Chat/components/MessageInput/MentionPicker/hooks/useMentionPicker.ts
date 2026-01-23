import { useState, useEffect } from 'preact/hooks';
import type { RefObject } from 'preact';

interface Position {
  top: number;
  left: number;
  isReady: boolean;
}

export function useMentionPicker(anchorRef: RefObject<HTMLElement>, isOpen: boolean) {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, isReady: false });
  
  useEffect(() => {
    if (!isOpen) {
      setPosition({ top: 0, left: 0, isReady: false });
      return;
    }
    
    let rafId: number | null = null;
    
    const updatePosition = () => {
      let container: HTMLElement | null = anchorRef.current;
      
      if (!container) {
        container = document.querySelector('.chat-input-container') as HTMLElement;
      }
      
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      // const viewportHeight = window.innerHeight; // 사용되지 않음
      const viewportWidth = window.innerWidth;
      const pickerHeight = 300; // 예상 높이
      const pickerWidth = 500; // 예상 너비
      
      // 입력창 바로 위에 표시 (bottom-up)
      let top = rect.top - pickerHeight - 8;
      let left = rect.left;
      
      // 화면 위로 넘어가면 아래쪽에 표시
      if (top < 0) {
        top = rect.bottom + 8;
      }
      
      // 오른쪽으로 넘어가면 조정
      if (left + pickerWidth > viewportWidth) {
        left = viewportWidth - pickerWidth - 16;
      }
      
      if (left < 0) {
        left = 16;
      }
      
      setPosition({ top, left, isReady: true });
    };
    
    updatePosition();
    rafId = requestAnimationFrame(updatePosition);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorRef]);
  
  return position;
}
