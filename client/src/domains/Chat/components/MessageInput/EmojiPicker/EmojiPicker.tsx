import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { RefObject } from 'preact';
import { memo } from 'preact/compat';
import { EMOJI_CATEGORIES, getEmojisByCategory, searchEmojis } from './utils/emojiData';
import { useFrequentEmojis } from './hooks/useFrequentEmojis';
import { useEmojiPicker } from './hooks/useEmojiPicker';
import './EmojiPicker.scss';

interface EmojiPickerProps {
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

function EmojiPickerComponent({ anchorRef, isOpen, onClose, onSelect }: EmojiPickerProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');
  const { frequent, addFrequent } = useFrequentEmojis();
  const position = useEmojiPicker(anchorRef, isOpen);
  const pickerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLElement>>({});
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);
  
  // 스크롤 위치에 따라 activeCategory 업데이트
  useEffect(() => {
    if (!gridRef.current || query.trim()) return;
    
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = window.setTimeout(() => {
        if (!gridRef.current) return;
        
        const scrollTop = gridRef.current.scrollTop;
        const containerTop = gridRef.current.getBoundingClientRect().top;
        
        // 각 카테고리 섹션의 위치 확인
        for (const category of EMOJI_CATEGORIES) {
          const section = categoryRefs.current[category.id];
          if (section) {
            const sectionTop = section.getBoundingClientRect().top - containerTop + scrollTop;
            const sectionHeight = section.offsetHeight;
            
            // 현재 보이는 카테고리 확인
            if (scrollTop >= sectionTop - 50 && scrollTop < sectionTop + sectionHeight) {
              setActiveCategory(category.id);
              break;
            }
          }
        }
      }, 100);
    };
    
    gridRef.current.addEventListener('scroll', handleScroll);
    return () => {
      if (gridRef.current) {
        gridRef.current.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [query]);
  
  // 카테고리 클릭 시 해당 섹션으로 스크롤
  const handleCategoryClick = useCallback((categoryId: string) => {
    const section = categoryRefs.current[categoryId];
    if (section && gridRef.current) {
      const containerTop = gridRef.current.getBoundingClientRect().top;
      const sectionTop = section.getBoundingClientRect().top;
      const scrollTop = gridRef.current.scrollTop;
      const targetScrollTop = scrollTop + sectionTop - containerTop - 10;
      
      gridRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      setActiveCategory(categoryId);
    }
  }, []);
  
  const handleSelect = (emoji: string) => {
    addFrequent(emoji);
    onSelect(emoji);
    onClose();
  };
  
  if (!isOpen) return null;
  
  const searchResults = query.trim() ? searchEmojis(query) : [];
  
  return (
    <div
      ref={pickerRef}
      className="emoji-picker"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        visibility: position.isReady ? 'visible' : 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 검색 바 */}
      <div className="emoji-picker__search">
        <input
          type="text"
          className="emoji-picker__search-input"
          placeholder="검색"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          autoFocus
        />
      </div>
      
      {/* 카테고리 탭 */}
      {!query.trim() && (
        <div className="emoji-picker__categories">
          {EMOJI_CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`emoji-picker__category ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
              title={category.name}
            >
              {category.icon}
            </button>
          ))}
        </div>
      )}
      
      {/* 이모지 그리드 */}
      <div ref={gridRef} className="emoji-picker__section">
        {/* 자주 사용하는 이모지 */}
        {!query.trim() && frequent.length > 0 && (
          <div className="emoji-picker__frequent-section">
            <div className="emoji-picker__section-title">자주 사용하는</div>
            <div className="emoji-picker__frequent-grid">
              {frequent.map((emoji, idx) => (
                <button
                  key={`frequent-${idx}`}
                  className="emoji-picker__button"
                  onClick={() => handleSelect(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        {query.trim() ? (
          <>
            <div className="emoji-picker__section-title">
              {searchResults.length > 0 ? `검색 결과 (${searchResults.length})` : '검색 결과 없음'}
            </div>
            {searchResults.length > 0 ? (
              <div className="emoji-picker__grid">
                {searchResults.map((emojiItem, idx) => (
                  <button
                    key={`${emojiItem.emoji}-${idx}`}
                    className="emoji-picker__button"
                    onClick={() => handleSelect(emojiItem.emoji)}
                    title={emojiItem.name}
                  >
                    {emojiItem.emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="emoji-picker__empty">이모지를 찾을 수 없습니다</div>
            )}
          </>
        ) : (
          <>
            {EMOJI_CATEGORIES.map((category) => {
              const categoryEmojis = getEmojisByCategory(category.id);
              if (categoryEmojis.length === 0) return null;
              
              return (
                <div
                  key={category.id}
                  ref={(el) => {
                    if (el) categoryRefs.current[category.id] = el;
                  }}
                  className="emoji-picker__category-section"
                  data-category={category.id}
                >
                  <div className="emoji-picker__section-title">{category.name}</div>
                  <div className="emoji-picker__grid">
                    {categoryEmojis.map((emojiItem, idx) => (
                      <button
                        key={`${category.id}-${emojiItem.emoji}-${idx}`}
                        className="emoji-picker__button"
                        onClick={() => handleSelect(emojiItem.emoji)}
                        title={emojiItem.name}
                      >
                        {emojiItem.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export const EmojiPicker = memo(EmojiPickerComponent);
