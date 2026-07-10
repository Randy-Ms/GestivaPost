import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Sun, Moon, X, Star, Smile, Zap, Camera, Bell, Search, Mail, Phone, MapPin, Settings, User, Heart as HeartIcon, ThumbsUp, Share2, Home, Globe } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import styles from './InstagramMockup.module.css';

export default function InstagramMockup() {
  const { layers, globalSettings, showMockup, setShowMockup } = useEditorStore();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Draggable State using Ref for performance
  const widgetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const position = useRef({ x: Math.max(100, window.innerWidth - 850), y: 60 });
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.style.transform = `translate(${position.current.x}px, ${position.current.y}px)`;
    }
  }, [showMockup]);

  const MOCKUP_WIDTH = 380; 
  const slideWidth = globalSettings.width;
  const slideHeight = globalSettings.height;
  const scale = MOCKUP_WIDTH / slideWidth;
  const scaledHeight = slideHeight * scale;

  const totalWidth = globalSettings.isCarousel ? slideWidth * globalSettings.carouselSlides : slideWidth;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.current.x,
      y: e.clientY - position.current.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !widgetRef.current) return;
    
    // Calculate new position
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    // Update ref for next render & style directly for 60fps
    position.current = { x: newX, y: newY };
    widgetRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Carousel Swipe State
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isSwiping = useRef(false);
  const swipeStart = useRef({ x: 0, scrollLeft: 0 });

  const handleSwipeDown = (e: React.PointerEvent) => {
    if (!globalSettings.isCarousel || !scrollerRef.current) return;
    isSwiping.current = true;
    swipeStart.current = {
      x: e.clientX,
      scrollLeft: scrollerRef.current.scrollLeft
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    scrollerRef.current.style.scrollSnapType = 'none';
    scrollerRef.current.style.scrollBehavior = 'auto';
  };

  const handleSwipeMove = (e: React.PointerEvent) => {
    if (!isSwiping.current || !scrollerRef.current) return;
    const dx = e.clientX - swipeStart.current.x;
    let newScrollLeft = swipeStart.current.scrollLeft - dx;
    
    // Clamp during drag to prevent scrolling out of bounds
    const maxScroll = (globalSettings.carouselSlides - 1) * MOCKUP_WIDTH;
    newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
    
    scrollerRef.current.scrollLeft = newScrollLeft;
  };

  const handleSwipeUp = (e: React.PointerEvent) => {
    if (!isSwiping.current || !scrollerRef.current) return;
    isSwiping.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const dx = e.clientX - swipeStart.current.x;
    const threshold = MOCKUP_WIDTH / 4;
    
    let targetScroll = scrollerRef.current.scrollLeft;
    if (dx < -threshold) {
      targetScroll = swipeStart.current.scrollLeft + MOCKUP_WIDTH; 
    } else if (dx > threshold) {
      targetScroll = swipeStart.current.scrollLeft - MOCKUP_WIDTH; 
    }

    // Clamp final target
    const maxScroll = (globalSettings.carouselSlides - 1) * MOCKUP_WIDTH;
    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

    scrollerRef.current.style.scrollBehavior = 'smooth';
    scrollerRef.current.scrollTo({ left: targetScroll });
    
    setTimeout(() => {
      if (scrollerRef.current) scrollerRef.current.style.scrollSnapType = 'x mandatory';
    }, 400);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!globalSettings.isCarousel || !scrollerRef.current) return;
    if (Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      let targetScroll = scrollerRef.current.scrollLeft + (direction * MOCKUP_WIDTH);
      
      const maxScroll = (globalSettings.carouselSlides - 1) * MOCKUP_WIDTH;
      targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

      scrollerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };



  const renderBackground = () => {
    let bg = globalSettings.backgroundColor;
    if (globalSettings.backgroundType === 'gradient' && globalSettings.gradient) {
      const g = globalSettings.gradient;
      if (g.type === 'linear') bg = `linear-gradient(${g.angle}deg, ${g.colors.join(', ')})`;
      else if (g.type === 'radial') bg = `radial-gradient(circle, ${g.colors.join(', ')})`;
    }
    
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: bg }}>
        {globalSettings.filters && globalSettings.filters.map(filter => {
          if (filter.type === 'noise') {
            const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${filter.scale || 0.65}' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E`;
            return (
              <div key={filter.id} style={{
                position: 'absolute', inset: 0, opacity: filter.opacity / 100, pointerEvents: 'none', mixBlendMode: 'overlay',
                backgroundImage: `url("${noiseSvg}")`, backgroundSize: '200px 200px', transform: 'translateZ(0)'
              }} />
            );
          }
          return null;
        })}
      </div>
    );
  };

  const renderLayer = (layer: any) => {
    if (layer.hidden) return null;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${layer.x}px`, top: `${layer.y}px`,
      width: layer.width ? `${layer.width}px` : 'auto',
      height: layer.height ? `${layer.height}px` : 'auto',
      opacity: layer.opacity,
      transform: `rotate(${layer.rotation}deg)`,
      pointerEvents: 'none'
    };

    const innerContent = () => {
      switch (layer.type) {
        case 'text':
          return (
            <div style={{
              color: layer.backgroundType === 'gradient' ? 'transparent' : layer.color,
              background: layer.backgroundType === 'gradient' && layer.gradient 
                ? `linear-gradient(${layer.gradient.angle || 135}deg, ${layer.gradient.colors?.[0] || '#ff0000'}, ${layer.gradient.colors?.[1] || '#0000ff'})` 
                : 'none',
              WebkitBackgroundClip: layer.backgroundType === 'gradient' ? 'text' : 'initial',
              WebkitTextFillColor: layer.backgroundType === 'gradient' ? 'transparent' : 'initial',
              fontSize: `${layer.fontSize}px`, fontFamily: layer.fontFamily, fontWeight: layer.fontWeight, textAlign: layer.textAlign,
              width: '100%', height: '100%', whiteSpace: 'pre-wrap'
            }}>
              {layer.text}
            </div>
          );
        case 'button':
          return (
            <div style={{
              backgroundColor: layer.backgroundColor,
              color: layer.color,
              fontSize: `${layer.fontSize}px`,
              fontFamily: layer.fontFamily,
              fontWeight: layer.fontWeight,
              borderRadius: `${layer.borderRadius}px`,
              padding: layer.padding,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%', height: '100%'
            }}>
              {layer.text}
            </div>
          );
        case 'image':
          return <img src={layer.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: layer.backgroundRemoved ? 'multiply' : 'normal' }} />;
        case 'shape': {
          const shapeStyle: React.CSSProperties = {
            background: layer.backgroundType === 'gradient' && layer.gradient
              ? `linear-gradient(${layer.gradient.angle || 135}deg, ${layer.gradient.colors?.[0] || '#ff0000'}, ${layer.gradient.colors?.[1] || '#0000ff'})`
              : (layer.backgroundColor || '#000000'),
            width: '100%', height: '100%', position: 'absolute'
          };
          if (layer.shapeType === 'circle') {
            shapeStyle.borderRadius = '50%';
          } else if (layer.shapeType === 'triangle') {
            shapeStyle.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
          } else if (layer.shapeType === 'polygon' || layer.shapeType === 'hexagon') {
            shapeStyle.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
          } else if (layer.shapeType === 'pentagon') {
            shapeStyle.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
          } else if (layer.shapeType === 'cloud') {
            shapeStyle.WebkitMaskImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z'/%3E%3C/svg%3E")`;
            shapeStyle.WebkitMaskSize = 'contain';
            shapeStyle.WebkitMaskRepeat = 'no-repeat';
            shapeStyle.WebkitMaskPosition = 'center';
          } else if (layer.shapeType === 'heart') {
            shapeStyle.WebkitMaskImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E")`;
            shapeStyle.WebkitMaskSize = 'contain';
            shapeStyle.WebkitMaskRepeat = 'no-repeat';
            shapeStyle.WebkitMaskPosition = 'center';
          } else if (layer.shapeType === 'line') {
            shapeStyle.height = '4px';
            shapeStyle.top = 'calc(50% - 2px)';
          } else {
            shapeStyle.borderRadius = `${layer.borderRadius || 0}px`;
          }
          return <div style={shapeStyle} />;
        }
        case 'icon': {
          const IconComponent = {
            'Star': Star, 'Smile': Smile, 'Zap': Zap, 'Camera': Camera, 'Bell': Bell, 
            'Search': Search, 'Mail': Mail, 'Phone': Phone, 'MapPin': MapPin, 
            'Settings': Settings, 'User': User, 'Heart': HeartIcon, 'ThumbsUp': ThumbsUp, 
            'MessageCircle': MessageCircle, 'Share2': Share2, 'Bookmark': Bookmark, 
            'Home': Home, 'Globe': Globe
          }[layer.iconName || 'Star'];

          if (!IconComponent) return null;

          return (
            <div style={{ width: '100%', height: '100%', color: layer.color || '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent style={{ width: '100%', height: '100%' }} strokeWidth={1.5} />
            </div>
          );
        }
        case 'path':
          return (
             <svg width="100%" height="100%" viewBox={`0 0 ${layer.width || 100} ${layer.height || 100}`} style={{ overflow: 'visible' }}>
               <path d={layer.pathData || 'M 0 0'} stroke={layer.layerColor || '#000000'} strokeWidth={layer.strokeWidth || 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          );
        default: return null;
      }
    };

    return <div key={layer.id} style={baseStyle}>{innerContent()}</div>;
  };

  if (!showMockup) return null;

  const themeClass = isDarkMode ? styles.dark : styles.light;

  return (
    <div 
      ref={widgetRef}
      className={`${styles.floatingWidget} ${themeClass}`}
      style={{ left: 0, top: 0 }} // Managed by transform
    >
      <div className={styles.mockupContentWrapper}>
        
        {/* Side Controls - Placed cleanly to the left */}
        <div className={styles.sideControls}>
          <button 
            className={styles.closeBtn} 
            onClick={() => setShowMockup(false)}
            title="Ocultar Vista Previa"
          >
            <X size={20} />
          </button>

          <div className={styles.themeToggleContainer}>
            <button 
              className={`${styles.themeBtn} ${isDarkMode ? styles.activeDark : ''}`}
              onClick={() => setIsDarkMode(true)}
              title="Modo Oscuro"
            >
              <Moon size={18} />
            </button>
            <button 
              className={`${styles.themeBtn} ${!isDarkMode ? styles.activeLight : ''}`}
              onClick={() => setIsDarkMode(false)}
              title="Modo Claro"
            >
              <Sun size={18} />
            </button>
          </div>
        </div>

        {/* Phone Frame */}
        <div className={styles.phoneFrame}>
          
          {/* New Drag Handle Style */}
          <div 
            className={styles.dragPill}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className={styles.pillBar}></div>
          </div>

          <div className={styles.instagramHeader}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}></div>
              <span className={styles.username}>gestivapost</span>
            </div>
            <MoreHorizontal size={20} />
          </div>

          <div className={styles.postContainer} style={{ height: scaledHeight, width: MOCKUP_WIDTH }}>
            <div 
              ref={scrollerRef}
              className={styles.postScroller} 
              style={{ 
                overflowX: globalSettings.isCarousel ? 'auto' : 'hidden',
                overflowY: 'hidden',
                scrollSnapType: globalSettings.isCarousel ? 'x mandatory' : 'none',
                cursor: globalSettings.isCarousel ? 'grab' : 'default',
                width: '100%',
                height: '100%'
              }}
              onPointerDown={handleSwipeDown}
              onPointerMove={handleSwipeMove}
              onPointerUp={handleSwipeUp}
              onPointerCancel={handleSwipeUp}
              onWheel={handleWheel}
            >
              <div style={{
                width: totalWidth * scale,
                height: scaledHeight,
                position: 'relative',
                display: 'flex'
              }}>
                {/* Scaled visual content */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    width: totalWidth,
                    height: slideHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0'
                  }}>
                    {renderBackground()}
                    {layers.map(renderLayer)}
                  </div>
                </div>

                {/* Invisible Snap Points */}
                {globalSettings.isCarousel ? Array.from({ length: globalSettings.carouselSlides }).map((_, i) => (
                  <div key={i} style={{
                    width: MOCKUP_WIDTH,
                    flexShrink: 0,
                    height: scaledHeight,
                    scrollSnapAlign: 'start'
                  }} />
                )) : null}
              </div>
            </div>

          </div>

          <div className={styles.instagramFooter}>
            <div className={styles.actionIcons}>
              <div className={styles.leftIcons}>
                <Heart size={24} />
                <MessageCircle size={24} />
                <Send size={24} />
              </div>
              <Bookmark size={24} />
            </div>
            <div className={styles.likes}>1,234 Me gusta</div>
            <div className={styles.caption}>
              <span className={styles.username}>gestivapost</span> Previsualiza tus diseños en tiempo real...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
