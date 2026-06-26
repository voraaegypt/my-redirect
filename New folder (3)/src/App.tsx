import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Undo, 
  Redo, 
  Eye, 
  Edit3, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft,
  ArrowRight,
  Move, 
  Grid, 
  Layers, 
  Sliders, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  Code,
  Files,
  ChevronsRight,
  Info,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  PlusSquare,
  FolderOpen,
  FileCode,
  Folder
} from 'lucide-react';
import JSZip from 'jszip';
import { templates } from './templates';
import { SelectedConfig, ElementShortcut, Template, WebsiteFile } from './types';

// Converts rgb(r, g, b) styles to Hex #RRGGBB
const rgbToHex = (rgbStr: string): string => {
  if (!rgbStr) return '#ffffff';
  if (rgbStr.startsWith('#')) return rgbStr;
  
  const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match) return '#ffffff';
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;
  
  if (a === 0) return '#ffffff'; // Transparent fallback
  
  const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  return hex;
};

// Available shortcuts of elements to add
const ELEMENT_SHORTCUTS: ElementShortcut[] = [
  { name: 'عنوان رئيسي H1', tag: 'h1', label: 'H1', category: 'text', defaultClass: 'text-3xl font-extrabold text-slate-900 my-4 outline-none', defaultContent: 'عنوان رئيسي جديد رفيع المستوى' },
  { name: 'عنوان فرعي H2', tag: 'h2', label: 'H2', category: 'text', defaultClass: 'text-2xl font-bold text-slate-800 my-3 outline-none', defaultContent: 'عنوان فرعي جديد للمقالات أو الأقسام' },
  { name: 'عنوان فرعي صغير H3', tag: 'h3', label: 'H3', category: 'text', defaultClass: 'text-xl font-semibold text-slate-705 my-2 outline-none', defaultContent: 'عنوان فرعي ثالث مخصص' },
  { name: 'فقرة نصية', tag: 'p', label: 'P', category: 'text', defaultClass: 'text-slate-600 text-sm leading-relaxed my-2 outline-none', defaultContent: 'هذه فقرة نصية جديدة مضافة حديثاً. انقر هنا لتعديل هذا النص وكتابة ما تريد لتفصيل المنتج أو الخدمة.' },
  { name: 'زر تفاعلي', tag: 'button', label: 'Button', category: 'container', defaultClass: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition text-sm cursor-pointer inline-block outline-none my-2', defaultContent: 'زر إجراء تفاعلي' },
  { name: 'رابط تشعبي', tag: 'a', label: 'Anchor', category: 'container', defaultClass: 'text-blue-600 hover:underline text-sm font-medium inline-block my-1 outline-none', defaultContent: 'رابط تصفح ويب جديد' },
  { name: 'صندوق حاوي (Div)', tag: 'div', label: 'Div', category: 'container', defaultClass: 'bg-white border border-slate-100 rounded-2xl p-6 shadow-sm my-4 outline-none', defaultContent: 'هذا صندوق حاوي (Div) يمكنك وضع عناصر داخله لتنظيم المحتوى.' },
  { name: 'صورة عصرية', tag: 'img', label: 'Image', category: 'media', defaultClass: 'w-full h-auto rounded-2xl shadow-sm my-4 object-cover max-h-[350px] outline-none', defaultContent: '' },
  { name: 'صورة كخلفية ممتدة (خلف العناصر)', tag: 'img', label: 'BgImage', category: 'media', defaultClass: 'absolute inset-0 w-full h-full object-cover -z-10 rounded-2xl pointer-events-none outline-none', defaultContent: '' },
  { name: 'خط فاصل مستقيم', tag: 'hr', label: 'HR', category: 'advanced', defaultClass: 'border-slate-200 my-6 outline-none', defaultContent: '' },
  { name: 'حقل إدخال نصي', tag: 'input', label: 'Input', category: 'advanced', defaultClass: 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 transition my-2 bg-white', defaultContent: '' }
];

export default function App() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [currentDevice, setCurrentDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Sidebar Tabs: properties (خصائص), add (إضافة), tree (هيكل الصفحة), files (ملفات الموقع)
  const [activeTab, setActiveTab] = useState<'properties' | 'add' | 'tree' | 'files'>('properties');
  const [websiteFiles, setWebsiteFiles] = useState<WebsiteFile[]>([]);
  const [activeFile, setActiveFile] = useState<WebsiteFile | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  
  // History tracking for Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // Styles and attributes representing currently selected element
  const [activeConfig, setActiveConfig] = useState<SelectedConfig | null>(null);
  const [searchTreeQuery, setSearchTreeQuery] = useState<string>('');
  const [insertionMode, setInsertionMode] = useState<'inside-end' | 'inside-start' | 'before' | 'after'>('inside-end');
  
  // Custom direct HTML editing panel
  const [directHtmlCode, setDirectHtmlCode] = useState<string>('');
  const [isDirectEditing, setIsDirectEditing] = useState<boolean>(false);

  // States for folder files code editing
  const [editingCode, setEditingCode] = useState<string>('');
  const [isEditingCode, setIsEditingCode] = useState<boolean>(false);

  // Custom positioning/direction movement states
  const [moveMethod, setMoveMethod] = useState<'transform' | 'margin' | 'relative'>('transform');
  const [moveStep, setMoveStep] = useState<number>(10);
  const [keepSizeOnReplace, setKeepSizeOnReplace] = useState<boolean>(true);

  // States for adding responsive buttons to specific elements
  const [targetBtnText, setTargetBtnText] = useState<string>('اضغط هنا للبدء 🔥');
  const [targetBtnLink, setTargetBtnLink] = useState<string>('#contact');
  const [targetBtnStyle, setTargetBtnStyle] = useState<'blue' | 'emerald' | 'amber' | 'transparent'>('blue');
  const [targetBtnWidthType, setTargetBtnWidthType] = useState<'full' | 'fit'>('full');
  const [targetBtnPlacement, setTargetBtnPlacement] = useState<'overlay' | 'inside-end' | 'inside-start' | 'after' | 'before'>('overlay');

  // States for smart product & visual card editor
  const [productBadgeText, setProductBadgeText] = useState<string>('خصم 20% 🔥');
  const [productBadgeColor, setProductBadgeColor] = useState<string>('#ef4444');

  // Responsive styling per screen size states
  const [responsiveEditDevice, setResponsiveEditDevice] = useState<'desktop' | 'tablet' | 'mobile'>('mobile');
  const [selectedResponsiveStyles, setSelectedResponsiveStyles] = useState<{
    desktop?: Record<string, string>;
    tablet?: Record<string, string>;
    mobile?: Record<string, string>;
  }>({});
  const [resFontSize, setResFontSize] = useState<string>('');
  const [resColor, setResColor] = useState<string>('');
  const [resBgColor, setResBgColor] = useState<string>('');
  const [resWidth, setResWidth] = useState<string>('');
  const [resHeight, setResHeight] = useState<string>('');
  const [resPadding, setResPadding] = useState<string>('');
  const [resMargin, setResMargin] = useState<string>('');
  const [resDisplay, setResDisplay] = useState<string>('');
  const [resTextAlign, setResTextAlign] = useState<string>('');
  const [resBorderRadius, setResBorderRadius] = useState<string>('');
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize with the first beautiful template on mount!
  useEffect(() => {
    loadTemplate(templates[0]);
  }, []);

  // Sync / write the current htmlContent directly to the iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !htmlContent) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Setup visual event listeners and style helpers once the frame loads fully
    const handleLoad = () => {
      injectHelperStyles(doc);
      injectWebsiteAssets(doc);
      attachIframeEventListeners(doc);
      compileAllResponsiveStyles(doc);
      compileAllAnimations(doc);
    };

    if (doc.readyState === 'complete') {
      handleLoad();
    } else {
      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [htmlContent]);

  // Sync assets if websiteFiles state changes while the page is loaded
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      injectWebsiteAssets(doc);
    }
  }, [websiteFiles]);

  // Handle resizing side effects for visual editors
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      injectHelperStyles(doc);
    }
  }, [isEditMode]);

  // Inject CSS helper highlights inside the design sandbox
  const injectHelperStyles = (document: Document) => {
    // Find or create helper style block
    let styleTag = document.getElementById('editor-style-helper');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'editor-style-helper';
      document.head.appendChild(styleTag);
    }

    if (isEditMode) {
      styleTag.innerHTML = `
        /* Hover guides */
        .editor-hovered-helper {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: -1px !important;
          cursor: pointer !important;
        }
        /* Selection guides */
        .editor-selected-helper {
          outline: 3px solid #1d4ed8 !important;
          outline-offset: -1px !important;
        }
        /* Prevent standard clicks from navigating away during edits */
        a {
          cursor: pointer !important;
        }
      `;
    } else {
      styleTag.innerHTML = '';
    }
  };

  // Attach hover and click listeners directly to elements inside sandbox using highly robust capture-phase event delegation
  const attachIframeEventListeners = (doc: Document) => {
    // We attach capture-phase listeners on the document to intercept interaction before inline handlers can block expansion
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Skip internal meta structures
      if (target.tagName === 'SCRIPT' || target.tagName === 'STYLE' || target.id === 'editor-style-helper') {
        return;
      }

      // Look for anchor tags or elements with data-click-link
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      const clickLink = target.closest('[data-click-link]')?.getAttribute('data-click-link') || '';
      const targetLink = clickLink || (anchor ? anchor.getAttribute('href') : '');

      if (targetLink) {
        const matchedFile = findMatchingWebsiteFile(targetLink);
        if (matchedFile) {
          e.preventDefault();
          e.stopPropagation();
          handleSwitchFile(matchedFile);
          return;
        }
      }

      if (!isEditMode) {
        if (anchor) {
          const href = anchor.getAttribute('href') || '';
          if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (target === doc.body || target.tagName === 'BODY' || target.tagName === 'HTML' || target.id === 'dynamic-responsive-styles-block') {
        deselectAll(doc);
        return;
      }

      selectHTMLElement(target, doc);
    };

    const dblCommandHandler = (e: MouseEvent) => {
      if (!isEditMode) return;
      const target = e.target as HTMLElement;
      if (!target) return;

      const anchor = target.closest('a') as HTMLAnchorElement | null;
      const clickLink = target.closest('[data-click-link]')?.getAttribute('data-click-link') || '';
      const targetLink = clickLink || (anchor ? anchor.getAttribute('href') : '');

      if (targetLink) {
        const matchedFile = findMatchingWebsiteFile(targetLink);
        if (matchedFile) {
          e.preventDefault();
          e.stopPropagation();
          handleSwitchFile(matchedFile);
        }
      }
    };

    const mouseOverHandler = (e: MouseEvent) => {
      if (!isEditMode) return;

      const target = e.target as HTMLElement;
      if (!target) return;

      if (
        target.tagName === 'SCRIPT' || 
        target.tagName === 'STYLE' || 
        target.id === 'editor-style-helper' ||
        target.tagName === 'BODY' ||
        target.tagName === 'HTML'
      ) {
        return;
      }

      // Clean hovered layout highlights from other elements
      doc.querySelectorAll('.editor-hovered-helper').forEach(item => {
        item.classList.remove('editor-hovered-helper');
      });

      // Avoid overlaying outline on the selected element
      if (!target.classList.contains('editor-selected-helper')) {
        target.classList.add('editor-hovered-helper');
      }
    };

    const mouseOutHandler = (e: MouseEvent) => {
      if (!isEditMode) return;
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.remove('editor-hovered-helper');
      }
    };

    // Clean previously attached handlers to avoid event stack accumulation
    doc.removeEventListener('click', clickHandler, true);
    doc.removeEventListener('dblclick', dblCommandHandler, true);
    doc.removeEventListener('mouseover', mouseOverHandler, true);
    doc.removeEventListener('mouseout', mouseOutHandler, true);

    // Register capture-phase events
    doc.addEventListener('click', clickHandler, true);
    doc.addEventListener('dblclick', dblCommandHandler, true);
    doc.addEventListener('mouseover', mouseOverHandler, true);
    doc.addEventListener('mouseout', mouseOutHandler, true);
  };

  // Highlights and selects an HTML element and maps its config to Sidebar
  const selectHTMLElement = (element: HTMLElement, doc: Document) => {
    deselectAll(doc);
    
    setSelectedElement(element);
    element.classList.add('editor-selected-helper');
    updateSelectedConfig(element);
    
    // Pre-populate raw HTML for direct editor
    setDirectHtmlCode(element.outerHTML);
    setIsDirectEditing(false); // reset direct toggle on selection change
    
    // Switch to properties tab automatically
    setActiveTab('properties');
  };

  // Deselects all active items
  const deselectAll = (doc: Document) => {
    doc.querySelectorAll('.editor-selected-helper').forEach(el => el.classList.remove('editor-selected-helper'));
    doc.querySelectorAll('.editor-hovered-helper').forEach(el => el.classList.remove('editor-hovered-helper'));
    setSelectedElement(null);
    setActiveConfig(null);
    setDirectHtmlCode('');
    setIsDirectEditing(false);
  };

  // Compile responsive CSS rules inside the document dynamically
  const compileAllResponsiveStyles = (doc: Document) => {
    let styleTag = doc.getElementById('dynamic-responsive-styles-block');
    if (!styleTag) {
      styleTag = doc.createElement('style');
      styleTag.id = 'dynamic-responsive-styles-block';
      doc.head.appendChild(styleTag);
    }

    const elementsWithResponsive = doc.querySelectorAll('[data-responsive-styles]');
    
    let desktopCSS = '';
    let tabletCSS = '';
    let mobileCSS = '';

    elementsWithResponsive.forEach(el => {
      const resId = el.getAttribute('data-res-id');
      if (!resId) return;

      const raw = el.getAttribute('data-responsive-styles');
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        
        const buildRules = (styles: Record<string, string>) => {
          let rulesStr = '';
          Object.entries(styles).forEach(([prop, val]) => {
            if (val) {
              const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
              rulesStr += `  ${kebab}: ${val} !important;\n`;
            }
          });
          return rulesStr;
        };

        if (parsed.desktop && Object.keys(parsed.desktop).length > 0) {
          const rules = buildRules(parsed.desktop);
          if (rules) {
            desktopCSS += `[data-res-id="${resId}"] {\n${rules}}\n`;
          }
        }
        if (parsed.tablet && Object.keys(parsed.tablet).length > 0) {
          const rules = buildRules(parsed.tablet);
          if (rules) {
            tabletCSS += `[data-res-id="${resId}"] {\n${rules}}\n`;
          }
        }
        if (parsed.mobile && Object.keys(parsed.mobile).length > 0) {
          const rules = buildRules(parsed.mobile);
          if (rules) {
            mobileCSS += `[data-res-id="${resId}"] {\n${rules}}\n`;
          }
        }
      } catch (e) {
        console.error('Error parsing responsive styles:', e);
      }
    });

    // Compile stylesheet
    let stylesheet = `/* المصمم المرئي المتجاوب - قواعد الشاشات المباشرة */\n`;

    if (desktopCSS) {
      stylesheet += `
/* الشاشات الكبيرة والكمبيوتر (Desktop) */
@media (min-width: 1025px) {
${desktopCSS}}
`;
    }

    if (tabletCSS) {
      stylesheet += `
/* أجهزة التابلت والشاشات المتوسطة (Tablet) */
@media (min-width: 641px) and (max-width: 1024px) {
${tabletCSS}}
`;
    }

    if (mobileCSS) {
      stylesheet += `
/* الهواتف الذكية والجوالات (Mobile) */
@media (max-width: 640px) {
${mobileCSS}}
`;
    }

    styleTag.innerHTML = stylesheet;
  };

  // Compile element-specific css animation keyframes and rules dynamically
  const compileAllAnimations = (doc: Document) => {
    let styleTag = doc.getElementById('dynamic-animations-styles-block');
    if (!styleTag) {
      styleTag = doc.createElement('style');
      styleTag.id = 'dynamic-animations-styles-block';
      doc.head.appendChild(styleTag);
    }

    // 1. Core global keyframes and defaults
    let stylesheet = `
/* 🎭 نظام الحركات والتاثيرات البصرية المتطور */
@keyframes custom-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes custom-slide-up {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes custom-slide-down {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes custom-slide-left {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes custom-slide-right {
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes custom-zoom-in {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes custom-zoom-out {
  from { transform: scale(1.08); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes custom-bounce-in {
  0% { transform: scale(0.4); opacity: 0; }
  50% { transform: scale(1.05); opacity: 0.8; }
  70% { transform: scale(0.95); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes custom-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes custom-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes custom-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes custom-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
}
@keyframes custom-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}
`;

    // 2. Compile elements using animation configurations
    const animatedElements = doc.querySelectorAll('[data-animation-settings]');
    animatedElements.forEach(el => {
      const resId = el.getAttribute('data-res-id');
      if (!resId) return;

      const raw = el.getAttribute('data-animation-settings');
      if (!raw) return;

      try {
        const settings = JSON.parse(raw);
        if (!settings || !settings.type || settings.type === 'none') {
          // Clean up if set to none
          return;
        }

        const keyframeName = `custom-${settings.type}`;
        const duration = settings.duration || '1s';
        const delay = settings.delay || '0s';
        const trigger = settings.trigger || 'onload';
        const timing = settings.timing || 'ease-out';

        if (trigger === 'onload') {
          stylesheet += `
[data-res-id="${resId}"] {
  animation: ${keyframeName} ${duration} ${timing} ${delay} 1 both;
}
`;
        } else if (trigger === 'infinite') {
          stylesheet += `
[data-res-id="${resId}"] {
  animation: ${keyframeName} ${duration} ${settings.type === 'spin' || settings.type === 'shimmer' ? 'linear' : 'ease-in-out'} ${delay} infinite both;
}
`;
        } else if (trigger === 'hover') {
          stylesheet += `
[data-res-id="${resId}"] {
  transition: all 0.3s ease-in-out;
}
[data-res-id="${resId}"]:hover {
  animation: ${keyframeName} ${duration} ${timing} ${delay} 1 both;
}
`;
        } else if (trigger === 'scroll') {
          stylesheet += `
/* 🎯 تفعيل التأثير عند الوصول له بالتمرير فقط */
[data-res-id="${resId}"]:not(.in-viewport) {
  opacity: 0;
  visibility: hidden;
}
[data-res-id="${resId}"].in-viewport {
  animation: ${keyframeName} ${duration} ${timing} ${delay} 1 both;
  opacity: 1;
  visibility: visible;
}
`;
        }
      } catch (e) {
        console.error('Error compiling element animations:', e);
      }
    });

    // 2b. Add custom interactive cursor styling for linked elements
    stylesheet += `
/* 🖱️ مؤشر الفأرة التفاعلي للعناصر التي تحتوي على روابط */
[data-click-link] {
  cursor: pointer !important;
}
`;

    styleTag.innerHTML = stylesheet;

    // 3. Inject interactive runtime script for scroll trigger & video scroll transitions
    let scriptTag = doc.getElementById('dynamic-scroll-effects-script');
    if (!scriptTag) {
      scriptTag = doc.createElement('script');
      scriptTag.id = 'dynamic-scroll-effects-script';
      doc.body.appendChild(scriptTag);
    }
    
    scriptTag.innerHTML = `
(function() {
  // Array of active observers to prevent multiplexing
  window.scrollObservers = window.scrollObservers || [];
  
  const initScrollAnimations = () => {
    // Clear old observers to keep editor performant
    if (window.scrollObservers && window.scrollObservers.length > 0) {
      window.scrollObservers.forEach(obs => obs.disconnect());
      window.scrollObservers = [];
    }

    const animatedEls = document.querySelectorAll('[data-animation-settings]');
    if (animatedEls.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -5% 0px',
      threshold: 0.05
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        try {
          const el = entry.target;
          const raw = el.getAttribute('data-animation-settings');
          if (!raw) return;
          const settings = JSON.parse(raw);
          if (settings.trigger === 'scroll') {
            if (entry.isIntersecting) {
              el.classList.add('in-viewport');
              observer.unobserve(el);
            }
          }
        } catch (e) {
          console.error(e);
        }
      });
    }, observerOptions);

    window.scrollObservers.push(observer);

    animatedEls.forEach(el => {
      try {
        const raw = el.getAttribute('data-animation-settings');
        if (!raw) return;
        const settings = JSON.parse(raw);
        if (settings.trigger === 'scroll') {
          observer.observe(el);
        }
      } catch (e) {}
    });
  };

  const handleScrollTransitions = () => {
    const scrollEls = document.querySelectorAll('[data-scroll-transition]');
    const viewHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Keep state tracker for video scrubbing
    window.scrubberStates = window.scrubberStates || {};

    scrollEls.forEach(el => {
      try {
        const raw = el.getAttribute('data-scroll-transition');
        if (!raw) return;
        const config = JSON.parse(raw);
        if (!config || config.effect === 'none') {
          el.style.transform = '';
          el.style.opacity = '';
          return;
        }

        const resId = el.getAttribute('data-res-id') || 'gen-id';

        // Calculate element target position
        const rect = el.getBoundingClientRect();
        const elTopRelativeToDoc = rect.top + scrollTop;
        const elHeight = rect.height;

        // Progress calculation based on scroll trigger region
        let progress = 0;
        if (config.region === 'element') {
          const startScroll = elTopRelativeToDoc - viewHeight;
          const endScroll = elTopRelativeToDoc + elHeight;
          const range = endScroll - startScroll;
          if (range > 0) {
            progress = Math.min(Math.max((scrollTop - startScroll) / range, 0), 1);
          }
        } else {
          const range = documentHeight - viewHeight;
          if (range > 0) {
            progress = Math.min(Math.max(scrollTop / range, 0), 1);
          }
        }

        const speed = parseFloat(config.speed || '1');

        if (config.effect === 'parallax-translate-y') {
          const movement = (progress - 0.5) * 120 * speed;
          el.style.transform = 'translateY(' + movement + 'px)';
        } else if (config.effect === 'parallax-scale') {
          const scale = 0.95 + (progress * 0.1) * speed;
          el.style.transform = 'scale(' + scale + ')';
        } else if (config.effect === 'parallax-opacity') {
          el.style.opacity = Math.min(Math.max(progress * speed, 0), 1);
        } else if (config.effect === 'video-scroll-scrub') {
          const videoEl = el.tagName === 'VIDEO' ? el : el.querySelector('video');
          if (videoEl) {
            if (!window.scrubberStates[resId]) {
              window.scrubberStates[resId] = { targetTime: 0, currentTime: 0 };
              videoEl.pause();
              videoEl.muted = true;
              videoEl.playsInline = true;
              videoEl.setAttribute('preload', 'auto');
            }

            if (videoEl.duration) {
              window.scrubberStates[resId].targetTime = progress * videoEl.duration;
            }
          }
        }

        // Apply background blur for any active scroll section
        if (config.effect === 'video-scroll-scrub' || config.effect.startsWith('parallax')) {
          const parentSection = el.closest('section') || el.parentElement;
          if (parentSection) {
            const maxBlur = 12; // default intensity
            const activeBlur = Math.sin(progress * Math.PI) * maxBlur * speed;
            
            // Apply backdrop filter / blur to background siblings
            const siblings = Array.from(parentSection.parentElement ? parentSection.parentElement.children : []);
            siblings.forEach(sib => {
              if (sib !== parentSection) {
                if (progress > 0.05 && progress < 0.95) {
                  (sib as any).style.filter = "blur(" + activeBlur + "px)";
                  (sib as any).style.backdropFilter = "blur(" + activeBlur + "px)";
                  (sib as any).style.transition = "filter 0.1s ease-out, transform 0.1s ease-out";
                } else {
                  (sib as any).style.filter = '';
                  (sib as any).style.backdropFilter = '';
                }
              }
            });
          }
        }
      } catch (err) {
        console.error('Error in scroll transition:', err);
      }
    });
  };

  // Run continuous LERP solver for smooth 60fps scrubbing
  const runLerpLoop = () => {
    if (window.scrubberStates) {
      Object.keys(window.scrubberStates).forEach(resId => {
        const state = window.scrubberStates[resId];
        const el = document.querySelector('[data-res-id="' + resId + '"]');
        if (el) {
          const videoEl = el.tagName === 'VIDEO' ? el : el.querySelector('video');
          if (videoEl && videoEl.duration) {
            const diff = state.targetTime - state.currentTime;
            state.currentTime += diff * 0.15; // Smooth incremental movement
            if (Math.abs(diff) > 0.001) {
              videoEl.currentTime = Math.max(0, Math.min(videoEl.duration, state.currentTime));
            }
          }
        }
      });
    }
    requestAnimationFrame(runLerpLoop);
  };
  requestAnimationFrame(runLerpLoop);

  // Run on startup
  if (document.readyState === 'complete') {
    initScrollAnimations();
    handleScrollTransitions();
  } else {
    window.addEventListener('load', () => {
      initScrollAnimations();
      handleScrollTransitions();
    });
  }
  
  // Throttle to maximize scrolling performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScrollTransitions();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Watch for mutations inside the visual sandboxed document
  if (!window.hasDynamicScrollObserverAttached) {
    const observer = new MutationObserver(() => {
      initScrollAnimations();
      handleScrollTransitions();
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    window.hasDynamicScrollObserverAttached = true;
  }

  // Handle click to navigate for any elements with data-click-link attribute
  if (!window.hasDynamicClickLinkHandlerAttached) {
    document.addEventListener('click', (e) => {
      let target = e.target;
      while (target && target !== document.body && target !== null) {
        if (target.hasAttribute && target.hasAttribute('data-click-link')) {
          const link = target.getAttribute('data-click-link');
          if (link) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = link;
            break;
          }
        }
        target = target.parentNode;
      }
    });
    window.hasDynamicClickLinkHandlerAttached = true;
  }
})();
`;
  };

  // Loads the responsive styles of the selected element into React input views
  const loadResponsiveStylesToState = (element: HTMLElement, targetDevice?: 'desktop' | 'tablet' | 'mobile') => {
    const rawStyles = element.getAttribute('data-responsive-styles');
    let parsed: any = {};
    if (rawStyles) {
      try {
        parsed = JSON.parse(rawStyles);
      } catch (e) {
        parsed = {};
      }
    }
    
    setSelectedResponsiveStyles(parsed);

    const activeDevice = targetDevice || responsiveEditDevice;
    const deviceStyles = parsed[activeDevice] || {};
    setResFontSize(deviceStyles.fontSize || '');
    setResColor(deviceStyles.color || '');
    setResBgColor(deviceStyles.backgroundColor || '');
    setResWidth(deviceStyles.width || '');
    setResHeight(deviceStyles.height || '');
    setResPadding(deviceStyles.padding || '');
    setResMargin(deviceStyles.margin || '');
    setResDisplay(deviceStyles.display || '');
    setResTextAlign(deviceStyles.textAlign || '');
    setResBorderRadius(deviceStyles.borderRadius || '');
  };

  // Triggers whenever we change the responsive edit target device tab
  useEffect(() => {
    if (selectedElement) {
      loadResponsiveStylesToState(selectedElement, responsiveEditDevice);
    }
  }, [responsiveEditDevice]);

  // Performs absolute live auto-saving on every keystroke/change in responsive helper input views
  const handleResponsiveStyleChange = (prop: string, val: string) => {
    if (!selectedElement) return;

    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Get current parsed responsive dictionary
    const rawStyles = selectedElement.getAttribute('data-responsive-styles');
    let parsed: any = {};
    if (rawStyles) {
      try {
        parsed = JSON.parse(rawStyles);
      } catch (e) {
        parsed = {};
      }
    }

    // Update active device styles
    if (!parsed[responsiveEditDevice]) {
      parsed[responsiveEditDevice] = {};
    }

    if (val !== undefined && val !== null && val.trim() !== '') {
      parsed[responsiveEditDevice][prop] = val;
    } else {
      delete parsed[responsiveEditDevice][prop];
    }

    // Clean device group if empty
    if (Object.keys(parsed[responsiveEditDevice] || {}).length === 0) {
      delete parsed[responsiveEditDevice];
    }

    // Update individual state in React
    if (prop === 'fontSize') setResFontSize(val);
    if (prop === 'color') setResColor(val);
    if (prop === 'backgroundColor') setResBgColor(val);
    if (prop === 'width') setResWidth(val);
    if (prop === 'height') setResHeight(val);
    if (prop === 'padding') setResPadding(val);
    if (prop === 'margin') setResMargin(val);
    if (prop === 'display') setResDisplay(val);
    if (prop === 'textAlign') setResTextAlign(val);
    if (prop === 'borderRadius') setResBorderRadius(val);

    setSelectedResponsiveStyles(parsed);

    // Apply data attributes to element inside iframe
    if (Object.keys(parsed).length === 0) {
      selectedElement.removeAttribute('data-responsive-styles');
      selectedElement.removeAttribute('data-res-id');
    } else {
      let resId = selectedElement.getAttribute('data-res-id');
      if (!resId) {
        resId = `res-${Math.random().toString(36).substr(2, 9)}`;
        selectedElement.setAttribute('data-res-id', resId);
      }
      selectedElement.setAttribute('data-responsive-styles', JSON.stringify(parsed));
    }

    // Recompile stylesheet live
    compileAllResponsiveStyles(doc);

    // Mark as dirty and record history
    saveToHistory();
    setHasUnsavedChanges(true);
  };

  // Save the custom responsive config for the active device
  const handleSaveResponsiveStyles = () => {
    if (!selectedElement) return;

    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    compileAllResponsiveStyles(doc);
    saveToHistory();
    setHasUnsavedChanges(true);

    // Show temporary feedback
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 2500);
  };

  // Populate responsive values from standard values of the element
  const handlePopulateFromCurrentStyles = () => {
    if (!selectedElement || !activeConfig) return;

    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const fSize = activeConfig.fontSize || '';
    const col = activeConfig.color || '';
    const bgCol = activeConfig.backgroundColor || '';
    const w = activeConfig.width || '';
    const h = activeConfig.height || '';

    let pad = '';
    const pTop = activeConfig.paddingTop || '0px';
    const pRight = activeConfig.paddingRight || '0px';
    const pBottom = activeConfig.paddingBottom || '0px';
    const pLeft = activeConfig.paddingLeft || '0px';
    if (pTop !== '0px' || pRight !== '0px' || pBottom !== '0px' || pLeft !== '0px') {
      pad = `${pTop} ${pRight} ${pBottom} ${pLeft}`;
    }

    let marg = '';
    const mTop = activeConfig.marginTop || '0px';
    const mRight = activeConfig.marginRight || '0px';
    const mBottom = activeConfig.marginBottom || '0px';
    const mLeft = activeConfig.marginLeft || '0px';
    if (mTop !== '0px' || mRight !== '0px' || mBottom !== '0px' || mLeft !== '0px') {
      marg = `${mTop} ${mRight} ${mBottom} ${mLeft}`;
    }

    const disp = activeConfig.display || '';
    const tAlign = activeConfig.textAlign || '';
    const bRad = activeConfig.borderRadius || '';

    // Apply states
    setResFontSize(fSize);
    setResColor(col);
    setResBgColor(bgCol);
    setResWidth(w);
    setResHeight(h);
    setResPadding(pad);
    setResMargin(marg);
    setResDisplay(disp);
    setResTextAlign(tAlign);
    setResBorderRadius(bRad);

    const deviceStyles: Record<string, string> = {};
    if (fSize) deviceStyles.fontSize = fSize;
    if (col) deviceStyles.color = col;
    if (bgCol) deviceStyles.backgroundColor = bgCol;
    if (w) deviceStyles.width = w;
    if (h) deviceStyles.height = h;
    if (pad) deviceStyles.padding = pad;
    if (marg) deviceStyles.margin = marg;
    if (disp) deviceStyles.display = disp;
    if (tAlign) deviceStyles.textAlign = tAlign;
    if (bRad) deviceStyles.borderRadius = bRad;

    const updated = {
      ...selectedResponsiveStyles,
      [responsiveEditDevice]: deviceStyles
    };

    if (Object.keys(deviceStyles).length === 0) {
      delete updated[responsiveEditDevice];
    }

    setSelectedResponsiveStyles(updated);

    let resId = selectedElement.getAttribute('data-res-id');
    if (!resId) {
      resId = `res-${Math.random().toString(36).substr(2, 9)}`;
      selectedElement.setAttribute('data-res-id', resId);
    }

    selectedElement.setAttribute('data-responsive-styles', JSON.stringify(updated));
    compileAllResponsiveStyles(doc);
    saveToHistory();
    setHasUnsavedChanges(true);
  };

  // Discards custom responsive style for active screen config
  const handleClearResponsiveStyles = () => {
    setResFontSize('');
    setResColor('');
    setResBgColor('');
    setResWidth('');
    setResHeight('');
    setResPadding('');
    setResMargin('');
    setResDisplay('');
    setResTextAlign('');
    setResBorderRadius('');

    if (!selectedElement) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const updated = { ...selectedResponsiveStyles };
    delete updated[responsiveEditDevice];
    setSelectedResponsiveStyles(updated);

    if (Object.keys(updated).length === 0) {
      selectedElement.removeAttribute('data-responsive-styles');
      selectedElement.removeAttribute('data-res-id');
    } else {
      selectedElement.setAttribute('data-responsive-styles', JSON.stringify(updated));
    }

    compileAllResponsiveStyles(doc);
    saveToHistory();
  };

  // Reads the actual inline and computed styles of the active element
  const updateSelectedConfig = (element: HTMLElement) => {
    const doc = element.ownerDocument;
    const computed = doc.defaultView?.getComputedStyle(element);
    
    const getStyleVal = (prop: string) => {
      return element.style[prop as any] || computed?.getPropertyValue(prop) || '';
    };

    // Load custom responsive configurations
    loadResponsiveStylesToState(element);

    const rawAnim = element.getAttribute('data-animation-settings');
    let animType = 'none';
    let animTrigger = 'onload';
    let animDuration = '1s';
    let animDelay = '0s';
    let animTiming = 'ease-out';

    if (rawAnim) {
      try {
        const parsed = JSON.parse(rawAnim);
        animType = parsed.type || 'none';
        animTrigger = parsed.trigger || 'onload';
        animDuration = parsed.duration || '1s';
        animDelay = parsed.delay || '0s';
        animTiming = parsed.timing || 'ease-out';
      } catch (e) {
        console.error('Error parsing element animation attributes:', e);
      }
    }

    const rawScroll = element.getAttribute('data-scroll-transition');
    let scrollEffect = 'none';
    let scrollRegion = 'element';
    let scrollSpeed = '1';

    if (rawScroll) {
      try {
        const parsed = JSON.parse(rawScroll);
        scrollEffect = parsed.effect || 'none';
        scrollRegion = parsed.region || 'element';
        scrollSpeed = parsed.speed || '1';
      } catch (e) {
        console.error('Error parsing element scroll transition attributes:', e);
      }
    }
    
    setActiveConfig({
      tagName: element.tagName,
      textContent: element.innerText || element.textContent || '',
      href: element.getAttribute('href') || undefined,
      src: element.getAttribute('src') || undefined,
      alt: element.getAttribute('alt') || undefined,
      placeholder: element.getAttribute('placeholder') || undefined,
      clickLink: element.getAttribute('data-click-link') || undefined,
      
      fontSize: getStyleVal('font-size'),
      fontWeight: getStyleVal('font-weight'),
      color: rgbToHex(getStyleVal('color')),
      backgroundColor: rgbToHex(getStyleVal('background-color')),
      textAlign: getStyleVal('text-align'),
      paddingTop: getStyleVal('padding-top'),
      paddingRight: getStyleVal('padding-right'),
      paddingBottom: getStyleVal('padding-bottom'),
      paddingLeft: getStyleVal('padding-left'),
      marginTop: getStyleVal('margin-top'),
      marginRight: getStyleVal('margin-right'),
      marginBottom: getStyleVal('margin-bottom'),
      marginLeft: getStyleVal('margin-left'),
      borderRadius: getStyleVal('border-radius'),
      borderWidth: getStyleVal('border-width'),
      borderStyle: getStyleVal('border-style'),
      borderColor: rgbToHex(getStyleVal('border-color')),
      width: getStyleVal('width'),
      height: getStyleVal('height'),
      opacity: getStyleVal('opacity'),
      display: getStyleVal('display'),
      position: getStyleVal('position'),
      zIndex: getStyleVal('z-index'),
      top: getStyleVal('top'),
      left: getStyleVal('left'),
      right: getStyleVal('right'),
      bottom: getStyleVal('bottom'),
      flexDirection: getStyleVal('flex-direction'),
      alignItems: getStyleVal('align-items'),
      justifyContent: getStyleVal('justify-content'),
      
      animationType: animType,
      animationTrigger: animTrigger,
      animationDuration: animDuration,
      animationDelay: animDelay,
      animationTiming: animTiming,

      scrollEffect,
      scrollRegion,
      scrollSpeed
    });
  };

  // Utility to extract pristine complete HTML containing compiled in-memory CSS rules for final downloading/saving
  const getPristineCleanHTML = (doc: Document): string => {
    // 1. Get references to active elements with helpers
    const selectedList = Array.from(doc.querySelectorAll('.editor-selected-helper'));
    const hoveredList = Array.from(doc.querySelectorAll('.editor-hovered-helper'));
    const styleHelper = doc.getElementById('editor-style-helper');

    // 2. Temporarily remove active helper classes
    selectedList.forEach(el => el.classList.remove('editor-selected-helper'));
    hoveredList.forEach(el => el.classList.remove('editor-hovered-helper'));
    
    let styleHelperContent = '';
    if (styleHelper) {
      styleHelperContent = styleHelper.innerHTML;
      styleHelper.innerHTML = '';
    }

    // 3. Sync browser-compiled in-memory CSS rules (like Tailwind CSS from CDN) into style tag text contents so they persist when saved
    const stylesBackup = new Map<HTMLStyleElement, string>();
    const styleTags = doc.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      const el = styleTag as HTMLStyleElement;
      if (el.id === 'editor-style-helper') return; // skip interactive helper style
      
      try {
        const sheet = el.sheet as CSSStyleSheet | null;
        if (sheet && sheet.cssRules && sheet.cssRules.length > 0) {
          // Backup current text content
          stylesBackup.set(el, el.textContent || '');
          
          let rulesArray: string[] = [];
          for (let i = 0; i < sheet.cssRules.length; i++) {
            rulesArray.push(sheet.cssRules[i].cssText);
          }
          el.textContent = rulesArray.join('\n');
        }
      } catch (e) {
        console.warn('Could not read cssRules for style tag:', e);
      }
    });

    // 4. Serialize the fully compiled HTML
    let finalHtml = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;

    // Strip helper style tag cleanly from downloading
    finalHtml = finalHtml.replace(/<style id="editor-style-helper">[\s\S]*?<\/style>/gi, "");

    // 5. Restore original clean text contents for CSS tags so the live compiler remains unaffected
    stylesBackup.forEach((originalText, el) => {
      el.textContent = originalText;
    });

    // 6. Restore interactive helper classes
    selectedList.forEach(el => el.classList.add('editor-selected-helper'));
    hoveredList.forEach(el => el.classList.add('editor-hovered-helper'));
    if (styleHelper) {
      styleHelper.innerHTML = styleHelperContent;
    }

    return finalHtml;
  };

  // Utility to extract clean dynamic HTML for state history (leaving styles dynamic to avoid breaking the CDN compiled states upon restoring)
  const getHistoryHTML = (doc: Document): string => {
    const selectedList = Array.from(doc.querySelectorAll('.editor-selected-helper'));
    const hoveredList = Array.from(doc.querySelectorAll('.editor-hovered-helper'));
    const styleHelper = doc.getElementById('editor-style-helper');

    selectedList.forEach(el => el.classList.remove('editor-selected-helper'));
    hoveredList.forEach(el => el.classList.remove('editor-hovered-helper'));
    
    let styleHelperContent = '';
    if (styleHelper) {
      styleHelperContent = styleHelper.innerHTML;
      styleHelper.innerHTML = '';
    }

    let finalHtml = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
    finalHtml = finalHtml.replace(/<style id="editor-style-helper">[\s\S]*?<\/style>/gi, "");

    selectedList.forEach(el => el.classList.add('editor-selected-helper'));
    hoveredList.forEach(el => el.classList.add('editor-hovered-helper'));
    if (styleHelper) {
      styleHelper.innerHTML = styleHelperContent;
    }

    return finalHtml;
  };

  // Commits actual current HTML state to the history stack for undo/redo
  const saveToHistory = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    
    // Generate clean dynamic history HTML
    const currentHtml = getHistoryHTML(doc);
    
    // Avoid double logging identical updates
    if (historyIndex >= 0 && history[historyIndex] === currentHtml) {
      return;
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    const updatedHistory = [...newHistory, currentHtml];
    
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setHasUnsavedChanges(true);

    // Sync HTML content changes directly to the imported website folder file structure
    syncActiveHtmlWithFiles(currentHtml);
  };

  // Handle animation settings changes
  const handleAnimationSettingsChange = (type: string, trigger: string, duration: string, delay: string, timing: string = 'ease-out') => {
    if (!selectedElement) return;

    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Ensure element has unique target ID
    let resId = selectedElement.getAttribute('data-res-id');
    if (!resId) {
      resId = `res-${Math.random().toString(36).substr(2, 9)}`;
      selectedElement.setAttribute('data-res-id', resId);
    }

    const newSettings = { type, trigger, duration, delay, timing };
    selectedElement.setAttribute('data-animation-settings', JSON.stringify(newSettings));

    setActiveConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        animationType: type,
        animationTrigger: trigger,
        animationDuration: duration,
        animationDelay: delay,
        animationTiming: timing
      };
    });

    compileAllAnimations(doc);

    // Trigger preview of the animation of the active element
    const el = doc.querySelector(`[data-res-id="${resId}"]`) as HTMLElement;
    if (el) {
      const originalAnim = el.style.animation;
      el.style.animation = 'none';
      void el.offsetHeight; // force DOM reflow to re-animate
      el.style.animation = '';
    }

    saveToHistory();
  };

  // Handle scroll and parallax transitions changes
  const handleScrollTransitionChange = (effect: string, region: string, speed: string) => {
    if (!selectedElement) return;

    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Ensure element has unique target ID
    let resId = selectedElement.getAttribute('data-res-id');
    if (!resId) {
      resId = `res-${Math.random().toString(36).substr(2, 9)}`;
      selectedElement.setAttribute('data-res-id', resId);
    }

    if (effect === 'none') {
      selectedElement.removeAttribute('data-scroll-transition');
    } else {
      const newSettings = { effect, region, speed };
      selectedElement.setAttribute('data-scroll-transition', JSON.stringify(newSettings));
    }

    setActiveConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        scrollEffect: effect,
        scrollRegion: region,
        scrollSpeed: speed
      };
    });

    compileAllAnimations(doc);
    saveToHistory();
  };

  // Handle premium scroll transparent video setting changes (src, parent height, blur multiplier)
  const handleScrollVideoPropChange = (prop: string, value: string) => {
    if (!selectedElement) return;

    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Check if the selected element is video or contains one
    const videoEl = selectedElement.tagName.toLowerCase() === 'video' 
      ? selectedElement as HTMLVideoElement
      : selectedElement.querySelector('video') as HTMLVideoElement;

    if (!videoEl) return;

    if (prop === 'src') {
      videoEl.setAttribute('src', value);
      videoEl.load(); // reload the video context
    } else if (prop === 'height') {
      // Find parent section to set height in vh
      const parentSection = selectedElement.closest('section') || selectedElement.parentElement;
      if (parentSection) {
        parentSection.style.height = `${value}vh`;
      }
    } else if (prop === 'blur') {
      // Decode current scroll settings
      const raw = videoEl.getAttribute('data-scroll-transition') || '{}';
      try {
        const config = JSON.parse(raw);
        config.speed = value; // map blur multiplier to speed parameter
        config.effect = 'video-scroll-scrub';
        videoEl.setAttribute('data-scroll-transition', JSON.stringify(config));
      } catch (e) {
        const config = { effect: 'video-scroll-scrub', region: 'element', speed: value };
        videoEl.setAttribute('data-scroll-transition', JSON.stringify(config));
      }
    }

    compileAllAnimations(doc);
    saveToHistory();
    setHasUnsavedChanges(true);

    // Refresh state
    updateSelectedConfig(selectedElement);
  };

  // Perform back/forward history operations
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setHtmlContent(history[prevIdx]);
      setSelectedElement(null);
      setActiveConfig(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setHtmlContent(history[nextIdx]);
      setSelectedElement(null);
      setActiveConfig(null);
    }
  };

  // Loads a brand-new template or custom HTML upload
  const handleHTMLUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setUploadedFileName(file.name);
        setHtmlContent(text);
        
        // Reset history stack
        setHistory([text]);
        setHistoryIndex(0);
        setSelectedElement(null);
        setActiveConfig(null);
        setHasUnsavedChanges(false);
      }
    };
    reader.readAsText(file);
  };

  // File chooser trigger
  const triggerDragUpload = () => {
    fileInputRef.current?.click();
  };

  // Inject CSS and JS files from the uploaded folder into the preview iframe document
  const injectWebsiteAssets = (doc: Document) => {
    if (!websiteFiles || websiteFiles.length === 0) return;
    
    // 1. Inject CSS files
    const cssFiles = websiteFiles.filter(f => f.type === 'css');
    let cssStyleTag = doc.getElementById('website-imported-css');
    if (cssFiles.length > 0) {
      if (!cssStyleTag) {
        cssStyleTag = doc.createElement('style');
        cssStyleTag.id = 'website-imported-css';
        doc.head.appendChild(cssStyleTag);
      }
      cssStyleTag.innerHTML = cssFiles.map(f => `/* --- ${f.path} --- */\n${f.content}`).join('\n');
    } else if (cssStyleTag) {
      cssStyleTag.remove();
    }

    // 2. Inject JS files
    const jsFiles = websiteFiles.filter(f => f.type === 'js');
    let jsScriptTag = doc.getElementById('website-imported-js');
    if (jsFiles.length > 0) {
      if (!jsScriptTag) {
        jsScriptTag = doc.createElement('script');
        jsScriptTag.id = 'website-imported-js';
        doc.body.appendChild(jsScriptTag);
      }
      jsScriptTag.innerHTML = jsFiles.map(f => `/* --- ${f.path} --- */\n${f.content}`).join('\n');
    } else if (jsScriptTag) {
      jsScriptTag.remove();
    }
  };

  // Keep websiteFiles updated in real-time when the active HTML is edited
  const syncActiveHtmlWithFiles = (newHtml: string) => {
    if (activeFile && activeFile.type === 'html') {
      setWebsiteFiles(prev => prev.map(f => f.path === activeFile.path ? { ...f, content: newHtml } : f));
      setActiveFile(prev => prev ? { ...prev, content: newHtml } : null);
    }
  };

  // Find a file inside the imported folder matching a given href / relative path
  const findMatchingWebsiteFile = (href: string): WebsiteFile | undefined => {
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return undefined;
    }
    
    // If it's an absolute URL pointing elsewhere, ignore it
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return undefined;
    }

    // Clean up the href (remove leading ./ or query parameters/hashes)
    let cleanHref = href.split('?')[0].split('#')[0];
    if (cleanHref.startsWith('./')) {
      cleanHref = cleanHref.substring(2);
    }

    // Now search websiteFiles.
    // Try to resolve the path relative to the activeFile directory if possible
    if (activeFile) {
      const activeDir = activeFile.path.includes('/') 
        ? activeFile.path.substring(0, activeFile.path.lastIndexOf('/') + 1)
        : '';
      const resolvedPath = activeDir + cleanHref;
      
      const match = websiteFiles.find(f => f.path.toLowerCase() === resolvedPath.toLowerCase());
      if (match) return match;
    }

    // Direct match with name or path suffix
    const directMatch = websiteFiles.find(f => f.name.toLowerCase() === cleanHref.toLowerCase() || f.path.toLowerCase() === cleanHref.toLowerCase());
    if (directMatch) return directMatch;

    // Suffix search
    const suffixMatch = websiteFiles.find(f => f.path.toLowerCase().endsWith(cleanHref.toLowerCase()));
    if (suffixMatch) return suffixMatch;

    return undefined;
  };

  // Custom multi-file folder importer
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const loadedFiles: WebsiteFile[] = [];
    const rootFolderName = files[0].webkitRelativePath ? files[0].webkitRelativePath.split('/')[0] : 'website_site';
    setUploadedFileName(rootFolderName);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath || file.name;
      const ext = relativePath.split('.').pop()?.toLowerCase() || '';

      // We read common design and code file types
      if (['html', 'htm', 'css', 'js', 'json', 'txt', 'svg'].includes(ext)) {
        try {
          const content = await file.text();
          let type: 'html' | 'css' | 'js' | 'other' = 'other';
          if (ext === 'html' || ext === 'htm') type = 'html';
          else if (ext === 'css') type = 'css';
          else if (ext === 'js') type = 'js';

          loadedFiles.push({
            name: file.name,
            path: relativePath,
            content: content,
            type: type
          });
        } catch (err) {
          console.error("Failed to read file:", file.name, err);
        }
      }
    }

    if (loadedFiles.length > 0) {
      // Sort files: index.html or folders first
      loadedFiles.sort((a, b) => {
        if (a.name.toLowerCase() === 'index.html') return -1;
        if (b.name.toLowerCase() === 'index.html') return 1;
        return a.path.localeCompare(b.path);
      });

      setWebsiteFiles(loadedFiles);
      
      const homePage = loadedFiles.find(f => f.name.toLowerCase() === 'index.html') || loadedFiles.find(f => f.type === 'html');
      if (homePage) {
        setActiveFile(homePage);
        setHtmlContent(homePage.content);
        setHistory([homePage.content]);
        setHistoryIndex(0);
      } else {
        setActiveFile(loadedFiles[0]);
        if (loadedFiles[0].type === 'html') {
          setHtmlContent(loadedFiles[0].content);
          setHistory([loadedFiles[0].content]);
          setHistoryIndex(0);
        }
      }
      setIsEditingCode(false);
      setActiveTab('files');
    }
  };

  // Switch between files in the imported folder
  const handleSwitchFile = (file: WebsiteFile) => {
    // If we have an active HTML file being edited, let's grab its latest state from iframe first
    let latestHtml = htmlContent;
    const iframe = iframeRef.current;
    if (iframe && activeFile && activeFile.type === 'html') {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        latestHtml = getHistoryHTML(doc);
      }
    }

    // Prepare updated files array
    let updatedFiles = [...websiteFiles];
    if (activeFile) {
      updatedFiles = websiteFiles.map(f => f.path === activeFile.path ? { ...f, content: activeFile.type === 'html' ? latestHtml : f.content } : f);
      setWebsiteFiles(updatedFiles);
    }

    setActiveFile(file);
    setSelectedElement(null);
    setActiveConfig(null);

    if (file.type === 'html') {
      setIsEditingCode(false);
      const targetFileObj = updatedFiles.find(f => f.path === file.path) || file;
      setHtmlContent(targetFileObj.content);
      setHistory([targetFileObj.content]);
      setHistoryIndex(0);
    } else {
      // For CSS/JS/JSON/txt, open code editor
      setEditingCode(file.content);
      setIsEditingCode(true);
    }
  };

  // Save the code edited directly in the monospace code area
  const handleSaveFileCode = () => {
    if (!activeFile) return;

    const updatedFiles = websiteFiles.map(f => f.path === activeFile.path ? { ...f, content: editingCode } : f);
    setWebsiteFiles(updatedFiles);
    setActiveFile({ ...activeFile, content: editingCode });
    setHasUnsavedChanges(true);

    if (activeFile.type === 'html') {
      setHtmlContent(editingCode);
      setHistory([editingCode]);
      setHistoryIndex(0);
    } else {
      // Trigger live re-injection of CSS or JS in the current preview frame!
      const iframe = iframeRef.current;
      if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // Temporarily set websiteFiles in the injection function since the state won't have updated yet
          const tempFiles = websiteFiles.map(f => f.path === activeFile.path ? { ...f, content: editingCode } : f);
          
          // Custom injector using temp files
          const injectTempAssets = (document: Document) => {
            const cssFiles = tempFiles.filter(f => f.type === 'css');
            let cssStyleTag = document.getElementById('website-imported-css');
            if (cssFiles.length > 0) {
              if (!cssStyleTag) {
                cssStyleTag = document.createElement('style');
                cssStyleTag.id = 'website-imported-css';
                document.head.appendChild(cssStyleTag);
              }
              cssStyleTag.innerHTML = cssFiles.map(f => `/* --- ${f.path} --- */\n${f.content}`).join('\n');
            }
            
            const jsFiles = tempFiles.filter(f => f.type === 'js');
            let jsScriptTag = document.getElementById('website-imported-js');
            if (jsFiles.length > 0) {
              if (!jsScriptTag) {
                jsScriptTag = document.createElement('script');
                jsScriptTag.id = 'website-imported-js';
                document.body.appendChild(jsScriptTag);
              }
              jsScriptTag.innerHTML = jsFiles.map(f => `/* --- ${f.path} --- */\n${f.content}`).join('\n');
            }
          };
          injectTempAssets(doc);
        }
      }
    }

    // Visual save feedback
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  // Create a brand new file inside the current website workspace
  const handleCreateFile = () => {
    const fileName = prompt('أدخل اسم الملف الجديد مع الامتداد (مثال: about.html, main.css, custom.js):');
    if (!fileName) return;

    // Check if file already exists
    if (websiteFiles.some(f => f.name.toLowerCase() === fileName.toLowerCase())) {
      alert('عذراً، هذا الملف موجود بالفعل!');
      return;
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    let type: 'html' | 'css' | 'js' | 'other' = 'other';
    let defaultContent = '';

    if (ext === 'html' || ext === 'htm') {
      type = 'html';
      // Create a nice starting HTML template
      defaultContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName.split('.')[0]}</title>
</head>
<body class="bg-slate-50 text-slate-900 font-sans p-10">
    <div class="max-w-xl mx-auto text-center py-20 bg-white shadow-xl rounded-3xl border border-slate-100 p-8">
        <h1 class="text-3xl font-black text-indigo-600 mb-4">صفحة ${fileName.split('.')[0]} الجديدة</h1>
        <p class="text-slate-600 mb-8 leading-relaxed">تم إنشاء هذه الصفحة بنجاح داخل مجلد الموقع. يمكنك الآن إدارتها وربطها بالصفحات الأخرى.</p>
        <a href="index.html" class="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm">العودة للرئيسية 🏠</a>
    </div>
</body>
</html>`;
    } else if (ext === 'css') {
      type = 'css';
      defaultContent = `/* ملف التنسيق الجديد: ${fileName} */\nbody {\n    font-family: system-ui, sans-serif;\n}`;
    } else if (ext === 'js') {
      type = 'js';
      defaultContent = `// ملف جافا سكريبت الجديد: ${fileName}\nconsole.log('${fileName} loaded successfully!');`;
    } else {
      defaultContent = `/* ملف جديد: ${fileName} */`;
    }

    const newFileObj: WebsiteFile = {
      name: fileName,
      path: fileName,
      content: defaultContent,
      type: type
    };

    const updated = [...websiteFiles, newFileObj];
    setWebsiteFiles(updated);
    handleSwitchFile(newFileObj);
    setHasUnsavedChanges(true);
  };

  // Delete an existing file
  const handleDeleteFile = (fileToDelete: WebsiteFile) => {
    if (websiteFiles.length <= 1) {
      alert('لا يمكنك حذف كل الملفات. يجب أن يتبقى ملف واحد على الأقل في المشروع!');
      return;
    }

    if (!confirm(`هل أنت متأكد من رغبتك في حذف الملف "${fileToDelete.path}" نهائياً؟`)) {
      return;
    }

    const updated = websiteFiles.filter(f => f.path !== fileToDelete.path);
    setWebsiteFiles(updated);
    setHasUnsavedChanges(true);

    if (activeFile?.path === fileToDelete.path) {
      handleSwitchFile(updated[0]);
    }
  };

  // Rename an existing file path/name
  const handleRenameFile = (fileToRename: WebsiteFile) => {
    const newName = prompt('أدخل الاسم الجديد للملف مع الامتداد:', fileToRename.name);
    if (!newName || newName === fileToRename.name) return;

    if (websiteFiles.some(f => f.name.toLowerCase() === newName.toLowerCase() && f.path !== fileToRename.path)) {
      alert('عذراً، هناك ملف آخر بنفس الاسم!');
      return;
    }

    const ext = newName.split('.').pop()?.toLowerCase() || '';
    let type: 'html' | 'css' | 'js' | 'other' = 'other';
    if (ext === 'html' || ext === 'htm') type = 'html';
    else if (ext === 'css') type = 'css';
    else if (ext === 'js') type = 'js';

    const updated = websiteFiles.map(f => {
      if (f.path === fileToRename.path) {
        return {
          ...f,
          name: newName,
          path: f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/') + 1) + newName : newName,
          type: type
        };
      }
      return f;
    });

    setWebsiteFiles(updated);
    setHasUnsavedChanges(true);

    if (activeFile?.path === fileToRename.path) {
      const renamedObj = updated.find(f => f.name === newName);
      if (renamedObj) {
        setActiveFile(renamedObj);
      }
    }
  };

  // Download entire website folder as a compiled and zipped package
  const downloadWebsiteZip = async () => {
    if (websiteFiles.length === 0) return;
    
    // Grab latest HTML page edits from iframe
    let finalFiles = [...websiteFiles];
    const iframe = iframeRef.current;
    if (iframe && activeFile && activeFile.type === 'html') {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const currentHtml = getHistoryHTML(doc);
        finalFiles = websiteFiles.map(f => f.path === activeFile.path ? { ...f, content: currentHtml } : f);
      }
    }

    const zip = new JSZip();
    finalFiles.forEach(file => {
      zip.file(file.path, file.content);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${uploadedFileName || 'compiled_website'}_edited.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Change styles of the select element in real-time
  const handleStyleChange = (property: string, value: string) => {
    if (!selectedElement) return;
    
    // Direct DOM manipulation
    selectedElement.style[property as any] = value;
    
    // Synchronize custom state representation
    setActiveConfig(prev => {
      if (!prev) return null;
      return { ...prev, [property]: value };
    });
    
    saveToHistory();
  };

  // Update direct content text
  const handleTextContentChange = (text: string) => {
    if (!selectedElement) return;
    selectedElement.innerText = text;
    
    setActiveConfig(prev => {
      if (!prev) return null;
      return { ...prev, textContent: text };
    });
    
    saveToHistory();
  };

  // Update hyperlinks and custom alternative descriptions
  const handleAttributeChange = (attrName: string, value: string) => {
    if (!selectedElement) return;
    
    if (value) {
      selectedElement.setAttribute(attrName, value);
    } else {
      selectedElement.removeAttribute(attrName);
    }
    
    setActiveConfig(prev => {
      if (!prev) return null;
      const updated = { ...prev, [attrName]: value };
      if (attrName === 'data-click-link') {
        updated.clickLink = value || undefined;
      }
      return updated;
    });
    
    saveToHistory();
  };

  // Direct base64 images upload handler inside elements
  const handleLocalImageReplacement = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedElement) return;
    
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      selectedElement.setAttribute('src', base64);
      setActiveConfig(prev => {
        if (!prev) return null;
        return { ...prev, src: base64 };
      });
      saveToHistory();
    };
    reader.readAsDataURL(file);
  };

  // Inject an absolutely positioned product promo badge onto the selected image/container
  const handleInjectProductBadge = () => {
    if (!selectedElement) return;

    let targetParent = selectedElement;
    if (selectedElement.tagName === 'IMG' && selectedElement.parentElement) {
      targetParent = selectedElement.parentElement;
    }

    const currentPos = targetParent.style.position || window.getComputedStyle(targetParent).position;
    if (currentPos !== 'absolute' && currentPos !== 'relative' && currentPos !== 'fixed') {
      targetParent.style.position = 'relative';
    }

    const doc = targetParent.ownerDocument || document;
    const badge = doc.createElement('span');
    badge.className = 'product-promo-badge';
    badge.innerText = productBadgeText;
    
    // Style beautifully with premium modern styling
    badge.style.position = 'absolute';
    badge.style.top = '12px';
    badge.style.right = '12px';
    badge.style.zIndex = '30';
    badge.style.backgroundColor = productBadgeColor;
    badge.style.color = '#ffffff';
    badge.style.padding = '4px 10px';
    badge.style.borderRadius = '30px';
    badge.style.fontSize = '10px';
    badge.style.fontWeight = 'bold';
    badge.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)';
    badge.style.pointerEvents = 'none';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.direction = 'rtl';
    
    targetParent.appendChild(badge);
    saveToHistory();
  };

  // Adds a pristine preconfigured element inside the layout structure
  const handleInsertElement = (shortcut: ElementShortcut) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    
    const newEl = doc.createElement(shortcut.tag);
    
    // Set parameters
    if (shortcut.tag === 'img') {
      newEl.setAttribute('src', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800');
      newEl.setAttribute('alt', 'صورة مضافة حديثاً');
    } else if (shortcut.tag === 'a') {
      newEl.setAttribute('href', '#');
      newEl.innerText = shortcut.defaultContent;
    } else if (shortcut.tag !== 'hr' && shortcut.tag !== 'input') {
      newEl.innerText = shortcut.defaultContent;
    }

    if (shortcut.tag === 'input') {
      newEl.setAttribute('placeholder', 'اكتب هنا...');
      // Preserve layout
    }
    
    if (shortcut.defaultClass) {
      newEl.className = shortcut.defaultClass;
    }

    // Embed structure relative to select node
    if (selectedElement && selectedElement.parentNode) {
      const parent = selectedElement.parentNode;
      
      // If adding a BgImage, configure the parent to be relative & overflow-hidden so the absolute image stays inside
      if (shortcut.label === 'BgImage') {
        const docObj = selectedElement.ownerDocument;
        if (insertionMode === 'inside-end' || insertionMode === 'inside-start') {
          const currentPos = selectedElement.style.position || docObj.defaultView?.getComputedStyle(selectedElement).position;
          if (!currentPos || currentPos === 'static') {
            selectedElement.style.position = 'relative';
            selectedElement.style.overflow = 'hidden';
          }
        } else {
          const parentEl = parent as HTMLElement;
          if (parentEl && parentEl.tagName !== 'BODY') {
            const currentPos = parentEl.style.position || docObj.defaultView?.getComputedStyle(parentEl).position;
            if (!currentPos || currentPos === 'static') {
              parentEl.style.position = 'relative';
              parentEl.style.overflow = 'hidden';
            }
          }
        }
      }

      switch (insertionMode) {
        case 'inside-end':
          selectedElement.appendChild(newEl);
          break;
        case 'inside-start':
          if (selectedElement.firstChild) {
            selectedElement.insertBefore(newEl, selectedElement.firstChild);
          } else {
            selectedElement.appendChild(newEl);
          }
          break;
        case 'before':
          parent.insertBefore(newEl, selectedElement);
          break;
        case 'after':
          parent.insertBefore(newEl, selectedElement.nextSibling);
          break;
        default:
          parent.appendChild(newEl);
      }
    } else {
      // Append to Body as standard safeguard
      doc.body.appendChild(newEl);
    }

    // Highlight inside workspace
    selectHTMLElement(newEl, doc);
    injectHelperStyles(doc);
    saveToHistory();
  };

  // Reorder node structures by swapping siblings
  const handleMoveElement = (direction: 'up' | 'down') => {
    if (!selectedElement) return;
    const parent = selectedElement.parentNode;
    if (!parent) return;

    if (direction === 'up') {
      const prev = selectedElement.previousElementSibling;
      if (prev && prev.id !== 'editor-style-helper') {
        parent.insertBefore(selectedElement, prev);
        saveToHistory();
      }
    } else {
      const next = selectedElement.nextElementSibling;
      if (next) {
        parent.insertBefore(next, selectedElement);
        saveToHistory();
      }
    }
  };

  // Shift elements in any direction (Up, Down, Left, Right) using style methods
  const handleShiftElement = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedElement) return;

    const style = selectedElement.style;
    const step = moveStep;

    const parsePx = (val: string): number => {
      if (!val) return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const doc = selectedElement.ownerDocument;
    const computed = doc.defaultView?.getComputedStyle(selectedElement);
    const getStyleVal = (prop: string) => style[prop as any] || computed?.getPropertyValue(prop) || '0px';

    if (moveMethod === 'transform') {
      let transformStr = style.transform || '';
      let tx = 0;
      let ty = 0;

      // Extract existing translate values
      const translateMatch = transformStr.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      if (translateMatch) {
        tx = parseFloat(translateMatch[1]);
        ty = parseFloat(translateMatch[2]);
      } else {
        const txMatch = transformStr.match(/translateX\(([-\d.]+)px\)/);
        const tyMatch = transformStr.match(/translateY\(([-\d.]+)px\)/);
        if (txMatch) tx = parseFloat(txMatch[1]);
        if (tyMatch) ty = parseFloat(tyMatch[1]);
      }

      if (direction === 'up') ty -= step;
      if (direction === 'down') ty += step;
      if (direction === 'left') tx -= step;
      if (direction === 'right') tx += step;

      // Rebuild transform string
      if (transformStr.includes('translate(')) {
        style.transform = transformStr.replace(/translate\([^)]+\)/, `translate(${tx}px, ${ty}px)`);
      } else if (transformStr.includes('translateX') || transformStr.includes('translateY')) {
        let cleaned = transformStr.replace(/translateX\([^)]+\)/g, '').replace(/translateY\([^)]+\)/g, '').trim();
        style.transform = `${cleaned} translate(${tx}px, ${ty}px)`.trim();
      } else {
        style.transform = `${transformStr} translate(${tx}px, ${ty}px)`.trim();
      }
    } else if (moveMethod === 'relative') {
      const curPos = getStyleVal('position');
      if (curPos !== 'absolute' && curPos !== 'fixed' && curPos !== 'relative') {
        style.position = 'relative';
      }

      let topVal = parsePx(getStyleVal('top'));
      let leftVal = parsePx(getStyleVal('left'));

      if (direction === 'up') topVal -= step;
      if (direction === 'down') topVal += step;
      if (direction === 'left') leftVal -= step;
      if (direction === 'right') leftVal += step;

      style.top = `${topVal}px`;
      style.left = `${leftVal}px`;
    } else {
      let mTop = parsePx(getStyleVal('margin-top'));
      let mLeft = parsePx(getStyleVal('margin-left'));

      if (direction === 'up') {
        style.marginTop = `${mTop - step}px`;
      } else if (direction === 'down') {
        style.marginTop = `${mTop + step}px`;
      } else if (direction === 'left') {
        style.marginLeft = `${mLeft - step}px`;
      } else if (direction === 'right') {
        style.marginLeft = `${mLeft + step}px`;
      }
    }

    updateSelectedConfig(selectedElement);
    saveToHistory();
  };

  // Convert/Toggle selected element as background cover under all other contents
  const handleConvertImageToBackground = (asBackground: boolean) => {
    if (!selectedElement) return;

    const parent = selectedElement.parentElement;
    if (asBackground) {
      if (parent) {
        const parentStyle = parent.style;
        const currentParentPos = parentStyle.position || parent.ownerDocument.defaultView?.getComputedStyle(parent).position;
        if (!currentParentPos || currentParentPos === 'static') {
          parentStyle.position = 'relative';
          parentStyle.overflow = 'hidden';
        }
      }

      // Apply background absolute covering styles to the selected element
      selectedElement.style.position = 'absolute';
      selectedElement.style.top = '0px';
      selectedElement.style.left = '0px';
      selectedElement.style.width = '100%';
      selectedElement.style.height = '100%';
      selectedElement.style.zIndex = '-10';
      selectedElement.style.pointerEvents = 'none';
      if (selectedElement.tagName === 'IMG') {
        selectedElement.style.objectFit = 'cover';
      }

      setActiveConfig(prev => {
        if (!prev) return null;
        return {
          ...prev,
          position: 'absolute',
          zIndex: '-10'
        };
      });
    } else {
      // Revert background styles back to inline properties
      selectedElement.style.position = '';
      selectedElement.style.top = '';
      selectedElement.style.left = '';
      selectedElement.style.width = '';
      selectedElement.style.height = '';
      selectedElement.style.zIndex = '';
      selectedElement.style.pointerEvents = '';
      if (selectedElement.tagName === 'IMG') {
        selectedElement.style.objectFit = '';
      }

      setActiveConfig(prev => {
        if (!prev) return null;
        return {
          ...prev,
          position: '',
          zIndex: ''
        };
      });
    }

    updateSelectedConfig(selectedElement);
    saveToHistory();
  };

  // Scale up or down the element (widths, heights, and fontSizes proportionately)
  const handleScaleElement = (scaleFactor: number) => {
    if (!selectedElement) return;

    // Get active dimensions
    const currentWidth = selectedElement.style.width || activeConfig?.width || 'auto';
    const currentHeight = selectedElement.style.height || activeConfig?.height || 'auto';
    const currentFontSize = selectedElement.style.fontSize || activeConfig?.fontSize;

    let newWidth = currentWidth;
    if (currentWidth && currentWidth !== 'auto' && currentWidth !== '100%') {
      const match = currentWidth.match(/^(\d+(?:\.\d+)?)(px|%|rem|em|vh|vw|pt)$/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        newWidth = `${Math.round(num * scaleFactor)}${unit}`;
      } else if (/^\d+$/.test(currentWidth)) {
        newWidth = `${Math.round(parseFloat(currentWidth) * scaleFactor)}px`;
      }
    } else if (currentWidth === 'auto' || !currentWidth) {
      const offsetW = selectedElement.offsetWidth;
      if (offsetW > 0) {
        newWidth = `${Math.round(offsetW * scaleFactor)}px`;
      }
    }

    let newHeight = currentHeight;
    if (currentHeight && currentHeight !== 'auto') {
      const match = currentHeight.match(/^(\d+(?:\.\d+)?)(px|%|rem|em|vh|vw|pt)$/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        newHeight = `${Math.round(num * scaleFactor)}${unit}`;
      } else if (/^\d+$/.test(currentHeight)) {
        newHeight = `${Math.round(parseFloat(currentHeight) * scaleFactor)}px`;
      }
    } else if (currentHeight === 'auto' || !currentHeight) {
      const offsetH = selectedElement.offsetHeight;
      if (offsetH > 0) {
        newHeight = `${Math.round(offsetH * scaleFactor)}px`;
      }
    }

    let newFontSize = currentFontSize;
    if (currentFontSize) {
      const match = currentFontSize.match(/^(\d+(?:\.\d+)?)(px|rem|em|pt|%|vh|vw)$/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        newFontSize = `${Math.round(num * scaleFactor)}${unit}`;
      } else if (/^\d+$/.test(currentFontSize)) {
        newFontSize = `${Math.round(parseFloat(currentFontSize) * scaleFactor)}px`;
      }
    } else {
      // Let's get computed font size
      const computedFS = selectedElement.ownerDocument.defaultView?.getComputedStyle(selectedElement).fontSize;
      if (computedFS) {
        const match = computedFS.match(/^(\d+(?:\.\d+)?)(px|rem|em|pt)$/);
        if (match) {
          const num = parseFloat(match[1]);
          const unit = match[2];
          newFontSize = `${Math.max(8, Math.round(num * scaleFactor))}${unit}`;
        }
      }
    }

    // Set styles directly on selected element
    if (newWidth && newWidth !== 'auto') {
      selectedElement.style.width = newWidth;
    }
    if (newHeight && newHeight !== 'auto') {
      selectedElement.style.height = newHeight;
    }
    if (newFontSize) {
      selectedElement.style.fontSize = newFontSize;
    }

    // Update activeConfig state safely
    setActiveConfig(prev => {
      if (!prev) return null;
      const update: any = { ...prev };
      if (newWidth) update.width = newWidth;
      if (newHeight) update.height = newHeight;
      if (newFontSize) update.fontSize = newFontSize;
      return update;
    });

    updateSelectedConfig(selectedElement);
    saveToHistory();
  };

  // Remove elements from DOM layout
  const handleDeleteElement = () => {
    if (!selectedElement) return;
    const parent = selectedElement.parentNode;
    if (parent) {
      parent.removeChild(selectedElement);
      setSelectedElement(null);
      setActiveConfig(null);
      saveToHistory();
    }
  };

  // Adds a highly responsive, custom-configured button (A tag) to/inside the selected element
  const handleAddResponsiveButtonToElement = () => {
    if (!selectedElement) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Create anchor tag
    const newBtn = doc.createElement('a');
    newBtn.setAttribute('href', targetBtnLink);
    newBtn.setAttribute('data-click-link', targetBtnLink); // Dynamic click link for non-A tags emulation

    // Build responsive and visual Tailwind CSS class list
    let classes = 'transition-all duration-300 font-bold font-sans cursor-pointer ';

    // 1. Placement classes
    if (targetBtnPlacement === 'overlay') {
      // 100% overlay covering the element entirely
      classes += 'absolute inset-0 w-full h-full z-20 flex items-center justify-center rounded-[inherit] ';
      
      // Styling styles with light glass background, borders and texts or transparent
      if (targetBtnStyle === 'blue') {
        classes += 'bg-blue-600/15 hover:bg-blue-600/25 border-2 border-blue-500/50 text-blue-100 shadow-md backdrop-blur-[1px] ';
      } else if (targetBtnStyle === 'emerald') {
        classes += 'bg-emerald-600/15 hover:bg-emerald-600/25 border-2 border-emerald-500/50 text-emerald-100 shadow-md backdrop-blur-[1px] ';
      } else if (targetBtnStyle === 'amber') {
        classes += 'bg-amber-600/15 hover:bg-amber-700/25 border-2 border-amber-500/50 text-amber-100 shadow-md backdrop-blur-[1px] ';
      } else if (targetBtnStyle === 'transparent') {
        classes += 'bg-transparent hover:bg-slate-500/10 border-2 border-dashed border-slate-400/40 text-slate-800 dark:text-white ';
      }

      // Force target element to be position: relative if it's currently static
      const docObj = selectedElement.ownerDocument;
      const currentPos = selectedElement.style.position || docObj.defaultView?.getComputedStyle(selectedElement).position;
      if (!currentPos || currentPos === 'static') {
        selectedElement.style.position = 'relative';
      }
    } else {
      // Standard button placements
      if (targetBtnWidthType === 'full') {
        classes += 'w-full block text-center ';
      } else {
        classes += 'inline-block ';
      }

      // Design presets
      if (targetBtnStyle === 'blue') {
        classes += 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 px-6 py-3 rounded-xl transform hover:-translate-y-0.5 active:scale-95 text-sm text-center ';
      } else if (targetBtnStyle === 'emerald') {
        classes += 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 px-6 py-3 rounded-xl transform hover:-translate-y-0.5 active:scale-95 text-sm text-center ';
      } else if (targetBtnStyle === 'amber') {
        classes += 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/25 px-6 py-3 rounded-xl transform hover:-translate-y-0.5 active:scale-95 text-sm text-center ';
      } else if (targetBtnStyle === 'transparent') {
        classes += 'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100/10 border border-slate-300 dark:border-slate-700 px-5 py-2.5 rounded-xl text-sm text-center ';
      }
    }

    newBtn.className = classes.trim();
    newBtn.innerText = targetBtnText;

    // Apply exact positioning
    const parent = selectedElement.parentNode;
    if (targetBtnPlacement === 'overlay') {
      selectedElement.appendChild(newBtn);
    } else {
      switch (targetBtnPlacement) {
        case 'inside-end':
          selectedElement.appendChild(newBtn);
          break;
        case 'inside-start':
          if (selectedElement.firstChild) {
            selectedElement.insertBefore(newBtn, selectedElement.firstChild);
          } else {
            selectedElement.appendChild(newBtn);
          }
          break;
        case 'before':
          if (parent) {
            parent.insertBefore(newBtn, selectedElement);
          }
          break;
        case 'after':
          if (parent) {
            parent.insertBefore(newBtn, selectedElement.nextSibling);
          }
          break;
      }
    }

    // Refresh UI, select newly added button and save to history
    selectHTMLElement(newBtn, doc);
    injectHelperStyles(doc);
    saveToHistory();
  };

  // Convert Element Tag while keeping its children and attributes
  const handleConvertElementTag = (newTagName: string) => {
    if (!selectedElement) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const parent = selectedElement.parentNode;
    if (!parent) return;

    // Create new element (keep namespace if SVG or default HTML element)
    const newEl = doc.createElement(newTagName);

    // Copy attributes
    for (let i = 0; i < selectedElement.attributes.length; i++) {
      const attr = selectedElement.attributes[i];
      newEl.setAttribute(attr.name, attr.value);
    }

    // Copy inline styles
    newEl.style.cssText = selectedElement.style.cssText;

    // Keep child elements
    while (selectedElement.firstChild) {
      newEl.appendChild(selectedElement.firstChild);
    }

    // Replace in DOM
    parent.replaceChild(newEl, selectedElement);

    // Reselect
    selectHTMLElement(newEl, doc);
    saveToHistory();
    setHasUnsavedChanges(true);
  };

  // Replace active element with a beautiful layout preset
  const handleReplaceWithWidget = (htmlString: string) => {
    if (!selectedElement) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const parent = selectedElement.parentNode;
    if (!parent) return;

    // Use a temp DOM element to parse HTML safely
    const tempDiv = doc.createElement('div');
    tempDiv.innerHTML = htmlString.trim();
    const newEl = tempDiv.firstElementChild as HTMLElement;

    if (newEl) {
      if (keepSizeOnReplace) {
        // Measure original sizes (either from style or offset/computed styles)
        const originalWidth = selectedElement.style.width || (selectedElement.offsetWidth ? `${selectedElement.offsetWidth}px` : '') || doc.defaultView?.getComputedStyle(selectedElement).width || 'auto';
        const originalHeight = selectedElement.style.height || (selectedElement.offsetHeight ? `${selectedElement.offsetHeight}px` : '') || doc.defaultView?.getComputedStyle(selectedElement).height || 'auto';

        if (originalWidth && originalWidth !== 'auto' && originalWidth !== '0px') {
          newEl.style.width = originalWidth;
        }
        if (originalHeight && originalHeight !== 'auto' && originalHeight !== '0px') {
          newEl.style.height = originalHeight;
        }
      }

      parent.replaceChild(newEl, selectedElement);
      
      // Update selected states and save
      selectHTMLElement(newEl, doc);
      saveToHistory();
      setHasUnsavedChanges(true);
    }
  };

  // Apply quick matching design color preset (background & text pairing)
  const handleApplyInstantColor = (bgColor: string, textColor: string) => {
    if (!selectedElement) return;

    selectedElement.style.backgroundColor = bgColor;
    if (textColor) {
      selectedElement.style.color = textColor;
    } else {
      selectedElement.style.color = '';
    }

    setActiveConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        backgroundColor: bgColor,
        color: textColor || prev.color
      };
    });

    saveToHistory();
    setHasUnsavedChanges(true);
  };

  // Clean HTML from interactive outlines and trigger user local download
  const downloadCleanHTML = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Use our pristine generator to extract correctly synchronized styles
    const finalHtml = getPristineCleanHTML(doc);

    // Direct download trigger
    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = uploadedFileName ? `edited_${uploadedFileName}` : 'edited_page.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setHasUnsavedChanges(false);
  };

  // Overwrite selected elements code with custom HTML string input
  const handleUpdateDirectHTML = () => {
    if (!selectedElement || !directHtmlCode) return;
    
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    try {
      // Temporarily parse custom code
      const parser = new DOMParser();
      const parsed = parser.parseFromString(directHtmlCode, 'text/html');
      const parsedElement = parsed.body.firstElementChild;
      
      if (parsedElement && selectedElement.parentNode) {
        // Embed the updated markup in-place
        const parent = selectedElement.parentNode;
        const placeholder = doc.createElement('div');
        parent.replaceChild(placeholder, selectedElement);
        
        // Ensure standard helper properties are mapped
        const importedNode = doc.importNode(parsedElement, true) as HTMLElement;
        parent.replaceChild(importedNode, placeholder);
        
        selectHTMLElement(importedNode, doc);
        injectHelperStyles(doc);
        saveToHistory();
        setIsDirectEditing(false);
      }
    } catch (err) {
      alert('الرمز المباشر الذي تم إدخاله يحتوي على أخطاء برمجية أو ليس صالحاً!');
    }
  };

  // Load preset template helpers
  const loadTemplate = (template: Template) => {
    setHtmlContent(template.html);
    setUploadedFileName(`${template.id}.html`);
    setHistory([template.html]);
    setHistoryIndex(0);
    setSelectedElement(null);
    setActiveConfig(null);
    setHasUnsavedChanges(false);
  };

  // Generates recursive custom tree nodes from active DOM
  const renderTreeNodes = (node: any, depth = 0): React.ReactNode => {
    if (!node) return null;
    
    const isSelected = selectedElement === node.ref;
    const classes = node.className ? `.${node.className.split(' ').slice(0, 2).join('.')}` : '';
    const hasChildren = node.children && node.children.length > 0;
    
    // Simple query filter
    const matchesSearch = searchTreeQuery === '' || 
      node.tagName.toLowerCase().includes(searchTreeQuery.toLowerCase()) || 
      classes.toLowerCase().includes(searchTreeQuery.toLowerCase());

    const handleNodeClick = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      
      selectHTMLElement(node.ref, doc);
      node.ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
      <div key={node.ref.outerHTML + Math.random()} style={{ contentVisibility: 'auto' }}>
        {matchesSearch && (
          <button
            onClick={handleNodeClick}
            className={`w-full text-right flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-mono group transition ${
              isSelected 
                ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' 
                : 'hover:bg-slate-50 text-slate-700'
            }`}
            style={{ paddingRight: `${Math.max(depth * 14 + 12, 12)}px` }}
          >
            <div className="flex items-center gap-2 truncate">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {node.tagName}
              </span>
              <span className="text-slate-400 truncate text-[10px] ltr">
                {classes || '#no-classes'}
              </span>
            </div>
            <ChevronsRight className={`w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition`} />
          </button>
        )}
        {hasChildren && node.children.map((child: any) => renderTreeNodes(child, depth + 1))}
      </div>
    );
  };

  // Compile active DOM Tree values dynamically
  const getDOMTreeRoot = (): any => {
    const iframe = iframeRef.current;
    if (!iframe) return null;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc || !doc.body) return null;
    
    const recursiveBuilder = (el: HTMLElement): any => {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.id === 'editor-style-helper') {
        return null;
      }
      
      const childrenArr = [];
      for (let i = 0; i < el.children.length; i++) {
        const item = recursiveBuilder(el.children[i] as HTMLElement);
        if (item) childrenArr.push(item);
      }
      
      return {
        tagName: el.tagName,
        className: el.className || '',
        ref: el,
        children: childrenArr
      };
    };

    return recursiveBuilder(doc.body);
  };

  const currentDomTree = isEditMode ? getDOMTreeRoot() : null;

  const isVideoSelected = selectedElement && (
    selectedElement.tagName.toLowerCase() === 'video' ||
    selectedElement.querySelector('video') !== null
  );

  const getSelectedVideoSrc = () => {
    if (!selectedElement) return '';
    if (selectedElement.tagName.toLowerCase() === 'video') {
      return selectedElement.getAttribute('src') || '';
    }
    return selectedElement.querySelector('video')?.getAttribute('src') || '';
  };

  const getSelectedParentHeight = () => {
    if (!selectedElement) return 250;
    const parent = selectedElement.closest('section') || selectedElement.parentElement;
    if (!parent) return 250;
    return parseInt(parent.style.height) || 250;
  };

  const getSelectedBlurMultiplier = () => {
    if (!selectedElement) return '1';
    const targetVid = selectedElement.tagName.toLowerCase() === 'video'
      ? selectedElement
      : selectedElement.querySelector('video');
    if (!targetVid) return '1';
    const raw = targetVid.getAttribute('data-scroll-transition') || '{}';
    try {
      const config = JSON.parse(raw);
      return config.speed || '1';
    } catch (e) {
      return '1';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans" dir="rtl">
      
      {/* 🚀 شريط التحكم والخيارات العلوي */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        
        {/* عنوان التطبيق */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-extrabold text-xl font-mono">
            ع
          </div>
          <div>
            <h1 className="text-base font-bold bg-linear-to-l from-white to-slate-200 bg-clip-text text-transparent">المنسّق المرئي للمواقع</h1>
            <p className="text-[10px] text-slate-400 font-medium">عدّل ونسّق واجهتك بدون أكواد وحمّل ملفك فوراً</p>
          </div>
        </div>

        {/* أدوات العمل: تراجع، إعادة، وضع المعاينة */}
        <div className="flex items-center flex-wrap gap-2.5">
          
          {/* مقاسات الشاشات التجاوبية */}
          <div className="flex bg-slate-850 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => {
                setCurrentDevice('desktop');
                setResponsiveEditDevice('desktop');
              }}
              className={`p-2 rounded-lg transition-all ${
                currentDevice === 'desktop' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="شاشة كمبيوتر (Desktop)"
            >
              <Laptop className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setCurrentDevice('tablet');
                setResponsiveEditDevice('tablet');
              }}
              className={`p-2 rounded-lg transition-all ${
                currentDevice === 'tablet' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="جهاز لوحي (Tablet)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setCurrentDevice('mobile');
                setResponsiveEditDevice('mobile');
              }}
              className={`p-2 rounded-lg transition-all ${
                currentDevice === 'mobile' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="جوال (Mobile)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          {/* التراجع والإعادة */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-2.5 rounded-xl transition ${
                historyIndex > 0 
                  ? 'bg-slate-850 hover:bg-slate-800 text-slate-200' 
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
              title="تراجع خطوة للوراء"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-2.5 rounded-xl transition ${
                historyIndex < history.length - 1 
                  ? 'bg-slate-850 hover:bg-slate-800 text-slate-200' 
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
              title="إعادة تطبيق التعديل"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          {/* تبديل وضع التعديل والمعاينة */}
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              if (selectedElement) {
                // Deselect
                const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
                if (doc) deselectAll(doc);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
              isEditMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-emerald-600 text-white hover:bg-emerald-705'
            }`}
          >
            {isEditMode ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>وضع التعديل والتنسيق</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>وضع المعاينة المباشرة</span>
              </>
            )}
          </button>
        </div>

        {/* 📥 الميزات الكبرى: ارفع وحمّل */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          
          {/* قالب الترويسة المباشر */}
          <div className="relative group/templates">
            <button className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition">
              <Files className="w-3.5 h-3.5 text-blue-400" />
              <span>القوالب الجاهزة</span>
            </button>
            <div className="absolute left-0 mt-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 w-72 shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover/templates:opacity-100 group-hover/templates:translate-y-0 group-hover/templates:pointer-events-auto transition-all duration-200 z-[9999]">
              <p className="text-[10px] font-bold text-slate-400 p-2 border-b border-slate-900">اختر قالباً لبدء العمل فوراً:</p>
              <div className="space-y-1 mt-1">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl)}
                    className="w-full text-right p-2.5 rounded-xl hover:bg-slate-900 transition flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-900/40 text-blue-400 flex items-center justify-center text-sm">
                      ✨
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-200 text-xs truncate">{tpl.name}</p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">{tpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* رفع الملف الفردي */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files?.[0] && handleHTMLUpload(e.target.files[0])}
            accept=".html,.htm" 
            className="hidden" 
          />
          <button 
            onClick={triggerDragUpload}
            className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl transition font-medium cursor-pointer"
            title="ارفع ملف HTML منفرد للبدء بتصميمه وتعديله"
          >
            <Upload className="w-3.5 h-3.5 text-blue-450" />
            <span>{uploadedFileName ? 'استبدال HTML' : 'رفع HTML'}</span>
          </button>

          {/* رفع مجلد الموقع كامل */}
          <input 
            type="file" 
            ref={folderInputRef} 
            onChange={handleFolderUpload}
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden" 
          />
          <button 
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl transition font-medium cursor-pointer"
            title="ارفع مجلد موقعك بالكامل لتعديل كل الصفحات والملفات والتنسيقات دفعة واحدة"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>استيراد مجلد الموقع 📂</span>
          </button>

          {/* تحميل الملف */}
          <button 
            onClick={downloadCleanHTML}
            className="flex items-center gap-2 bg-linear-to-l from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/10 font-bold hover:shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل الكود المعدّل</span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      {/* 💻 مساحة العمل المركزية والجانبية */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 🛠️ شريط التنسيق المرئي الجانبي (الأبمن) */}
        <aside className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col overflow-hidden shrink-0">
          
          {/* تبويبات التحكم بالجانبي */}
          <div className="grid grid-cols-4 bg-slate-900 border-b border-slate-800 p-1">
            <button 
              onClick={() => setActiveTab('properties')}
              className={`py-2 text-[10px] font-bold flex flex-col items-center gap-1 transition-all rounded-xl cursor-pointer ${
                activeTab === 'properties' 
                  ? 'bg-slate-950 text-blue-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="خصائص العنصر المحدد"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>الخصائص</span>
            </button>
            <button 
              onClick={() => setActiveTab('add')}
              className={`py-2 text-[10px] font-bold flex flex-col items-center gap-1 transition-all rounded-xl cursor-pointer ${
                activeTab === 'add' 
                  ? 'bg-slate-950 text-blue-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="إضافة عنصر جديد للصفحة"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>عنصر</span>
            </button>
            <button 
              onClick={() => setActiveTab('tree')}
              className={`py-2 text-[10px] font-bold flex flex-col items-center gap-1 transition-all rounded-xl cursor-pointer ${
                activeTab === 'tree' 
                  ? 'bg-slate-950 text-blue-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="عرض شجرة عناصر الصفحة"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الشجرة</span>
            </button>
            <button 
              onClick={() => setActiveTab('files')}
              className={`py-2 text-[10px] font-bold flex flex-col items-center gap-1 transition-all rounded-xl cursor-pointer relative ${
                activeTab === 'files' 
                  ? 'bg-slate-950 text-indigo-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="إدارة ملفات الموقع المستوردة"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>الموقع</span>
              {websiteFiles.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              )}
            </button>
          </div>

          {/* محتويات التبويبة الأولى: الخصائص والتعديل */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {activeTab === 'properties' && (
              <>
                {!selectedElement ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-500">
                    <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center mb-4 text-slate-400 border border-slate-800 border-dashed">
                      <Sliders className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 mb-1">لم يتم اختيار أي عنصر</p>
                    <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">انقر على أي عنصر داخل الصفحة في وضع التعديل للتحكم بخصائصه المرئية مباشرة.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    
                    {/* بطاقة التنبيه بالربط والانتقال الذكي بالصفحات */}
                    {(() => {
                      const linkedFile = activeConfig ? findMatchingWebsiteFile(activeConfig.clickLink || activeConfig.href || '') : undefined;
                      if (!linkedFile) return null;
                      return (
                        <div className="bg-gradient-to-r from-indigo-950/45 to-blue-950/45 border border-indigo-500/40 rounded-2xl p-4 space-y-2.5 text-right shadow-md shadow-indigo-950/40">
                          <div className="flex items-center gap-2 text-indigo-300">
                            <LinkIcon className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold">هذا العنصر ينقل لصفحة أخرى! 🔗</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-normal">
                            هذا العنصر مرتبط بصفحة <span className="font-mono text-indigo-300 font-bold bg-indigo-900/40 px-1.5 py-0.5 rounded text-[11px]">{linkedFile.name}</span> داخل مشروعك المستورد.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSwitchFile(linkedFile)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-xl text-[10px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span>انتقال وتعديل هذه الصفحة الآن 🚀</span>
                          </button>
                        </div>
                      );
                    })()}
                    
                    {/* معلومات سريعة عن العنصر وأدوات التحكم بالحذف والنقل */}
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-850">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <span className="text-xs font-bold text-blue-400 font-mono ltr bg-blue-900/30 px-2.5 py-1 rounded-lg">
                          &lt;{selectedElement.tagName.toLowerCase()}&gt;
                        </span>
                        
                        {/* النقل للأعلى/الأسفل والحذف */}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleMoveElement('up')}
                            className="p-1 px-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white"
                            title="تحريك للأعلى"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleMoveElement('down')}
                            className="p-1 px-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white"
                            title="تحريك للأسفل"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={handleDeleteElement}
                            className="p-1 px-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/40 hover:text-red-300 transition"
                            title="حذف هذا العنصر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* إمكانية تعديل الكود المباشر */}
                      <div className="pt-3 flex justify-between items-center">
                        <span className="text-xs text-slate-400">تعديل مباشر على الرمز</span>
                        <button
                          onClick={() => {
                            setIsDirectEditing(!isDirectEditing);
                            setDirectHtmlCode(selectedElement.outerHTML);
                          }}
                          className="text-[10px] bg-slate-800 hover:bg-slate-705 text-blue-400 font-semibold px-2 py-1 rounded"
                        >
                          {isDirectEditing ? 'إغلاق المحرر' : 'تعديل HTML'}
                        </button>
                      </div>

                      {isDirectEditing && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={directHtmlCode}
                            onChange={(e) => setDirectHtmlCode(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-[10px] font-mono leading-relaxed"
                            dir="ltr"
                          />
                          <button
                            onClick={handleUpdateDirectHTML}
                            className="w-full bg-blue-600 font-bold hover:bg-blue-700 text-white rounded-lg py-1.5 text-xs transition"
                          >
                            تعديل وحفظ الرمز
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 🔄 أداة استبدال العنصر واللون الفوري */}
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-850 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-805">
                        <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">الاستبدال الذكي واللون الفوري</p>
                          <p className="text-[10px] text-slate-400">تغيير وسم العنصر، استبداله وتطبيق مظهر ألوان بضغطة واحدة</p>
                        </div>
                      </div>

                      {/* ⚙️ خيار الحفاظ على نفس الحجم عند الاستبدال */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-200">الاستبدال بنفس الحجم الأصلي</span>
                          <span className="text-[8px] text-slate-400">يقوم بنسخ نفس أبعاد (العرض والارتفاع) للعنصر عند استبداله</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                          <input 
                            type="checkbox" 
                            checked={keepSizeOnReplace}
                            onChange={(e) => setKeepSizeOnReplace(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {/* 1. لوحة الألوان السريعة */}
                      <div className="space-y-2">
                        <span className="block text-[10px] text-slate-400 font-bold">🎨 تطبيق مظاهر ألوان منسقة (خلفية + خط):</span>
                        <div className="grid grid-cols-2 gap-1.55">
                          {[
                            { name: "أزرق جذاب 🌊", bg: "#2563eb", text: "#ffffff" },
                            { name: "داكن ملكي 🌑", bg: "#0f172a", text: "#f1f5f9" },
                            { name: "زمردي مشرق 🌿", bg: "#10b981", text: "#ffffff" },
                            { name: "فخامة ذهبية 👑", bg: "#78350f", text: "#fef3c7" },
                            { name: "وردي ناعم 🌸", bg: "#fdf2f8", text: "#db2777" },
                            { name: "هادئ كلاسيك ☁️", bg: "#f8fafc", text: "#1e293b" },
                            { name: "أحمر دافئ 🔥", bg: "#dc2626", text: "#ffffff" },
                            { name: "شفاف بالكامل ❄️", bg: "transparent", text: "" },
                          ].map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleApplyInstantColor(p.bg, p.text)}
                              className="text-[10px] text-right p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between cursor-pointer group bg-slate-950"
                            >
                              <span className="text-slate-350 font-medium group-hover:text-white transition">{p.name}</span>
                              <div className="flex gap-0.5 shrink-0 ml-1">
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-600 block shadow-sm" style={{ backgroundColor: p.bg || '#ffffff' }}></span>
                                {p.text && <span className="w-2.5 h-2.5 rounded-full border border-slate-600 block shadow-sm" style={{ backgroundColor: p.text }}></span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. تحويل الوسم وعلامة العنصر */}
                      <div className="space-y-2 pt-2 border-t border-slate-850">
                        <span className="block text-[10px] text-slate-400 font-bold">🔄 تحويل نوع العنصر (Tag Conversion):</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { tag: "h1", name: "H1" },
                            { tag: "h2", name: "H2" },
                            { tag: "h3", name: "H3" },
                            { tag: "p", name: "P (فقرة)" },
                            { tag: "button", name: "زر" },
                            { tag: "a", name: "رابط" },
                            { tag: "div", name: "Div" },
                            { tag: "span", name: "Span" },
                          ].map((t) => (
                            <button
                              key={t.tag}
                              type="button"
                              onClick={() => handleConvertElementTag(t.tag)}
                              className={`py-1 rounded-lg text-center text-[10px] font-bold border cursor-pointer transition ${
                                selectedElement?.tagName.toLowerCase() === t.tag
                                  ? 'bg-purple-900/30 text-purple-300 border-purple-800'
                                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800 hover:text-white'
                              }`}
                              title={`تحويل وسم هذا العنصر إلى <${t.tag}>`}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-500">يحفظ المحتوى والخصائص والتنسيقات المسجلة ويغيّر ترميز المعالج فقط.</p>
                      </div>

                      {/* 3. الاستبدال الكامل بمكون جاهز */}
                      <div className="space-y-2 pt-2 border-t border-slate-850">
                        <span className="block text-[10px] text-slate-400 font-bold">⚡ استبدال كامل بكتلة تصميم راقية:</span>
                        <div className="space-y-1.5">
                          {[
                            {
                              label: "مقطع فيديو تفاعلي شفاف مع السكرول (Scroll Video Section) 📽️",
                              desc: "سيكشن متكامل بارتفاع 250vh يحتوي على فيديو شفاف يتجاوب فريم فريم مع الماوس",
                              html: `<section class="relative bg-slate-950 text-white overflow-visible" style="height: 250vh;" data-scroll-video="true"><div class="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none z-10"><video src="https://assets.mixkit.co/videos/preview/mixkit-transparent-spinning-globe-of-earth-31804-large.mp4" class="w-full h-full object-contain max-h-screen" data-scroll-transition='{"effect":"video-scroll-scrub","region":"element","speed":"1"}' data-res-id="scroll-video-globe" preload="auto" playsinline muted loop style="will-change: transform, opacity;"></video><div class="absolute bottom-10 right-10 bg-slate-900/80 border border-slate-800 text-emerald-400 px-4 py-2 rounded-2xl flex items-center gap-2 backdrop-blur-md"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span class="text-[10px] font-mono font-bold tracking-wide">فيديو سكرول نشط 🌐</span></div></div><div class="relative z-20 w-full flex flex-col justify-between"><div class="h-screen flex flex-col items-center justify-center text-center px-6"><h2 class="text-4xl md:text-6xl font-black tracking-tight text-white max-w-2xl leading-tight">حرك دولاب السكرول لمشاهدة السحر 🌌</h2><p class="text-slate-400 text-sm mt-4 max-w-md">قم بالتمرير للأسفل لتقديم وإرجاع المقطع يدوياً بمرونة تامة.</p><div class="mt-8 animate-bounce bg-slate-900/50 p-2.5 rounded-full border border-slate-800"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg></div></div><div class="h-[50vh] flex flex-col items-center justify-center text-center px-6"><div class="bg-indigo-950/50 border border-indigo-900/40 p-6 rounded-3xl max-w-md backdrop-blur-md"><span class="text-xs font-bold text-indigo-400">تأثير الخبو والبلور الديناميكي 🎭</span><h3 class="text-xl font-black text-white mt-1.5">تمويه الشاشات والتركيز التفاعلي</h3><p class="text-xs text-slate-300 mt-2 leading-relaxed">عندما تكون في منتصف السكرول، يركز المتصفح بشكل كامل على الفيديو الشفاف بينما يتم تعتيم وتمويه (Blur) خلفية باقي الأجزاء لجذب الاهتمام البصري.</p></div></div><div class="h-screen flex flex-col items-center justify-center text-center px-6"><h3 class="text-3xl font-black text-white">انسجام فائق في الأداء 🚀</h3><p class="text-xs text-slate-400 mt-2 max-w-sm">يمكنك الآن الصعود والهبوط في التمرير لتسريع أو عكس تتابع العرض.</p></div></div></section>`
                            },
                            {
                              label: "زر تفاعلي جذاب (CTA Button)",
                              desc: "زر متفوق لجلب التحويلات وتوجيه العملاء",
                              html: `<a href="#" class="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-center">اضغط هنا للبدء الآن 🔥</a>`
                            },
                            {
                              label: "مدرج نصوص أنيق (Header + Intro Layout)",
                              desc: "عنوان مميز مع ترويسة تعلوه ووصف منسق للغاية",
                              html: `<div class="text-right space-y-3 p-6 my-4"><span class="text-xs font-bold text-indigo-600 tracking-wider">ميزات جديدة ✨</span><h3 class="text-2xl font-black text-slate-900 leading-tight">تطوير مستمر للأعمال والشركات</h3><p class="text-sm text-slate-500 leading-relaxed max-w-xl">نهتم بأدق التفاصيل لتقديم تجربة لا تنسى تضمن ريادة أعمالكم السلسة.</p></div>`
                            },
                            {
                              label: "بطاقة ميزات بنتو زجاجية (Bento Block)",
                              desc: "مربع تفاعلي حديث يحتوي على أيقونة وعنوان ووصف",
                              html: `<div class="bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between h-48 text-right"><div class="p-3 bg-blue-100 text-blue-600 rounded-2xl w-fit"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><div><h4 class="text-lg font-bold text-gray-900 mt-4 font-sans">سرعة وأداء فائق</h4><p class="text-xs text-gray-500 mt-1">تحميل فوري وتجاوب سلس للغاية على الهواتف والأجهزة المختلفة.</p></div></div>`
                            },
                            {
                              label: "صورة ممتازة متجاوبة (Responsive Hero Image)",
                              desc: "راية صورة منسقة الأبعاد مع حواف منحنية راقية",
                              html: `<img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800" class="w-full h-64 object-cover rounded-3xl shadow-sm hover:shadow-md transition duration-300" alt="تحليلات الأعمال وتصميم الويب" />`
                            }
                          ].map((widget, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleReplaceWithWidget(widget.html)}
                              className="w-full text-right p-2 rounded-xl border border-slate-850 hover:border-slate-800 transition flex flex-col gap-0.5 bg-slate-950 cursor-pointer hover:bg-slate-900 group"
                            >
                              <span className="text-[11px] font-bold text-slate-300 group-hover:text-blue-400 transition">{widget.label}</span>
                              <span className="text-[9px] text-slate-500">{widget.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 📐 الحجم الفوري للعنصر المستبدل */}
                      <div className="space-y-2 pt-2 border-t border-slate-850">
                        <span className="block text-[10px] text-slate-400 font-bold">🔍 تحجيم سريع وتصغير وتكبير بنقرة واحدة (Scale):</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleScaleElement(1.15)}
                            className="py-2 px-3 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/40 hover:border-indigo-850 text-indigo-400 font-bold text-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                            title="تكبير حجم العنصر الحالي والخطوط بنسبة 15%"
                          >
                            <span>➕ تكبير بنسبة 15%</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleScaleElement(0.85)}
                            className="py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 font-bold text-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                            title="تصغير حجم العنصر الحالي والخطوط بنسبة 15%"
                          >
                            <span>➖ تصغير بنسبة 15%</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 🚀 أداة تحريك وتوجيه العنصر في الاتجاهات الأربعة */}
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-850 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                        <Move className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">أزرار تحريك موضع العنصر</p>
                          <p className="text-[10px] text-slate-400">تحريك العنصر حراً يميناً ويساراً وأعلى وأسفل</p>
                        </div>
                      </div>

                      {/* اختيار استراتيجية التحريك */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] text-slate-400">طريقة التحريك المناسبة:</span>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-[10px]">
                          <button
                            type="button"
                            onClick={() => setMoveMethod('transform')}
                            className={`py-1.5 rounded-lg text-center font-semibold transition cursor-pointer ${
                              moveMethod === 'transform' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="تحريك حر بالتحويل ثلاثي الأبعاد دون التأثير على العناصر المجاورة"
                          >
                            حر (Transform)
                          </button>
                          <button
                            type="button"
                            onClick={() => setMoveMethod('relative')}
                            className={`py-1.5 rounded-lg text-center font-semibold transition cursor-pointer ${
                              moveMethod === 'relative' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="إزاحة الموضع توب وليسار"
                          >
                            موضع (Relative)
                          </button>
                          <button
                            type="button"
                            onClick={() => setMoveMethod('margin')}
                            className={`py-1.5 rounded-lg text-center font-semibold transition cursor-pointer ${
                              moveMethod === 'margin' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="تغيير الهوامش الخارجية لتفادي التداخل"
                          >
                            هوامش (Margin)
                          </button>
                        </div>
                      </div>

                      {/* تعيين مقاس الخطوة الحركية */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">مقدار التحريك بالخطوة:</span>
                          <span className="text-xs font-mono font-bold text-blue-450">{moveStep}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={moveStep}
                            onChange={(e) => setMoveStep(Number(e.target.value))}
                            className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 justify-between">
                          {[5, 10, 20, 50].map((stepVal) => (
                            <button
                              key={stepVal}
                              type="button"
                              onClick={() => setMoveStep(stepVal)}
                              className={`text-[10px] font-mono font-bold py-1 px-2.5 rounded-lg transition cursor-pointer ${
                                moveStep === stepVal
                                  ? 'bg-blue-900/40 text-blue-300 border border-blue-800'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-850 hover:text-white'
                              }`}
                            >
                              {stepVal}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* لوحة الأسهم الحركية التفاعلية D-Pad */}
                      <div className="flex flex-col items-center justify-center pt-2">
                        <div className="relative w-36 h-36 bg-slate-950 rounded-full border border-slate-850 p-2 flex items-center justify-center shadow-inner">
                          {/* سهم لأعلى */}
                          <button
                            type="button"
                            onClick={() => handleShiftElement('up')}
                            className="absolute top-1.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-md transition active:scale-90 cursor-pointer"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          {/* سهم لليمين */}
                          <button
                            type="button"
                            onClick={() => handleShiftElement('right')}
                            className="absolute right-1.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-md transition active:scale-90 cursor-pointer animate-none"
                            title="تحريك لليمين"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>

                          {/* سهم ليسار */}
                          <button
                            type="button"
                            onClick={() => handleShiftElement('left')}
                            className="absolute left-1.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-md transition active:scale-90 cursor-pointer"
                            title="تحريك لليسار"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>

                          {/* سهم لأسفل */}
                          <button
                            type="button"
                            onClick={() => handleShiftElement('down')}
                            className="absolute bottom-1.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-md transition active:scale-90 cursor-pointer"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          {/* المركز المزخرف */}
                          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-sm">
                            <Move className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-2 text-center font-medium">التحريك الفوري دقيق وآمن على بنية الصفحة</p>
                      </div>
                    </div>

                    {/* محتوى النص */}
                    {activeConfig && selectedElement.tagName !== 'IMG' && selectedElement.tagName !== 'HR' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-300">محتوى النص:</label>
                        <textarea
                          value={activeConfig.textContent}
                          onChange={(e) => handleTextContentChange(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200"
                          placeholder="اكتب شيئاً كبديل للنص الحالي..."
                        />
                      </div>
                    )}

                    {/* ✨ المحرر الذكي لبطاقات المنتجات والعناصر البصرية */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-indigo-950/40 shadow-sm shadow-indigo-950/30">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 justify-between">
                          <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-sans">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>✨ محرر بطاقات المنتجات والعناصر البصرية</span>
                          </p>
                          <span className="text-[8px] bg-indigo-900/40 text-indigo-300 font-bold px-1.5 py-0.5 rounded-full">التحكم الذكي</span>
                        </div>

                        {/* لوحة تحكم الصور لو كان العنصر المحدد هو صورة */}
                        {selectedElement.tagName === 'IMG' && (
                          <div className="space-y-3.5">
                            {/* 1. تأثير التكبير والتمرير التفاعلي */}
                            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                              <div className="flex flex-col gap-0.5 text-right">
                                <span className="text-[10px] font-bold text-slate-200">تأثير تكبير الصورة التفاعلي (Hover Zoom)</span>
                                <span className="text-[8px] text-slate-400">يكبّر الصورة بنسبة خفيفة مع ظل ناعم عند تمرير الماوس</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                <input 
                                  type="checkbox" 
                                  checked={selectedElement ? !!selectedElement.getAttribute('onmouseover')?.includes('scale(1.05)') : false}
                                  onChange={(e) => {
                                    if (!selectedElement) return;
                                    if (e.target.checked) {
                                      selectedElement.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease';
                                      selectedElement.setAttribute('onmouseover', "this.style.transform='scale(1.05)'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.15)';");
                                      selectedElement.setAttribute('onmouseout', "this.style.transform='scale(1)'; this.style.boxShadow='none';");
                                    } else {
                                      selectedElement.removeAttribute('onmouseover');
                                      selectedElement.removeAttribute('onmouseout');
                                      selectedElement.style.transform = '';
                                      selectedElement.style.boxShadow = '';
                                      selectedElement.style.transition = '';
                                    }
                                    saveToHistory();
                                    // For rendering reload
                                    setActiveConfig(prev => prev ? { ...prev } : null);
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>

                            {/* 2. نسبة العرض والارتفاع (Aspect Ratio) */}
                            <div className="space-y-2 text-right">
                              <span className="block text-[10px] text-slate-400 font-bold">📐 مقاس ونسبة الصورة التلقائية (أبعاد متناسقة):</span>
                              <div className="grid grid-cols-5 gap-1">
                                {[
                                  { label: "تلقائي", val: "" },
                                  { label: "مربع 1:1", val: "1 / 1" },
                                  { label: "طولي 3:4", val: "3 / 4" },
                                  { label: "عرضي 4:3", val: "4 / 3" },
                                  { label: "سينمائي 16:9", val: "16 / 9" }
                                ].map((ratio) => (
                                  <button
                                    key={ratio.label}
                                    type="button"
                                    onClick={() => {
                                      if (!selectedElement) return;
                                      selectedElement.style.aspectRatio = ratio.val;
                                      selectedElement.style.objectFit = ratio.val ? 'cover' : '';
                                      saveToHistory();
                                      setActiveConfig(prev => prev ? { ...prev } : null);
                                    }}
                                    className={`text-[9px] py-1 px-0.5 rounded cursor-pointer font-medium transition ${
                                      (selectedElement.style.aspectRatio === ratio.val)
                                        ? 'bg-indigo-600 text-white font-bold'
                                        : 'bg-slate-950 hover:bg-slate-850 text-slate-400'
                                    }`}
                                  >
                                    {ratio.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 3. الفلاتر والمؤثرات الجاهزة */}
                            <div className="space-y-2 text-right">
                              <span className="block text-[10px] text-slate-400 font-bold">🎨 مؤثرات وفلاتر بصرية جاهزة للمنتج:</span>
                              <div className="grid grid-cols-3 gap-1">
                                {[
                                  { label: "افتراضي ✨", val: "" },
                                  { label: "أبيض وأسود 🖤", val: "grayscale(100%)" },
                                  { label: "مشرق وجذاب ☀️", val: "brightness(1.15) contrast(1.05)" },
                                  { label: "سينمائي داكن 🎬", val: "brightness(0.85) contrast(1.1)" },
                                  { label: "تغبيش ناعم 🌫️", val: "blur(4px)" },
                                  { label: "دافئ عتيق 📜", val: "sepia(45%) saturate(120%)" }
                                ].map((filter) => (
                                  <button
                                    key={filter.label}
                                    type="button"
                                    onClick={() => {
                                      if (!selectedElement) return;
                                      selectedElement.style.filter = filter.val;
                                      saveToHistory();
                                      setActiveConfig(prev => prev ? { ...prev } : null);
                                    }}
                                    className={`text-[9px] py-1 px-1 rounded cursor-pointer transition text-center ${
                                      (selectedElement.style.filter === filter.val)
                                        ? 'bg-indigo-600 text-white font-bold'
                                        : 'bg-slate-950 hover:bg-slate-850 text-slate-400'
                                    }`}
                                  >
                                    {filter.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 4. انحناء الزوايا السريع */}
                            <div className="space-y-2 text-right">
                              <span className="block text-[10px] text-slate-400 font-bold">🔮 انحناء حواف وزوايا صورة المنتج:</span>
                              <div className="grid grid-cols-5 gap-1">
                                {[
                                  { label: "حادة 📐", val: "0px" },
                                  { label: "خفيفة 📱", val: "8px" },
                                  { label: "متوسطة 📦", val: "16px" },
                                  { label: "شديدة 🏷️", val: "28px" },
                                  { label: "دائرية 🔵", val: "9999px" }
                                ].map((radius) => (
                                  <button
                                    key={radius.label}
                                    type="button"
                                    onClick={() => {
                                      if (!selectedElement) return;
                                      selectedElement.style.borderRadius = radius.val;
                                      saveToHistory();
                                      setActiveConfig(prev => prev ? { ...prev } : null);
                                    }}
                                    className={`text-[9px] py-1 px-0.5 rounded cursor-pointer transition ${
                                      (selectedElement.style.borderRadius === radius.val)
                                        ? 'bg-indigo-600 text-white font-bold'
                                        : 'bg-slate-950 hover:bg-slate-850 text-slate-400'
                                    }`}
                                  >
                                    {radius.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* لوحة تحكم النصوص والأسعار للبطاقات */}
                        {selectedElement.tagName !== 'IMG' && selectedElement.tagName !== 'HR' && (
                          <div className="space-y-3.5 text-right">
                            {/* 1. أدوات تنسيق الأسعار */}
                            <div className="space-y-2">
                              <span className="block text-[10px] text-slate-400 font-bold">💰 أدوات سريعة للأسعار والخصومات:</span>
                              <p className="text-[9px] text-slate-500 leading-relaxed">اضغط على النص المحدد لتعديل وتنسيق مظهره فوراً كسعر قديم أو سعر رئيسي.</p>
                              
                              <div className="grid grid-cols-2 gap-1.5 font-sans">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!selectedElement) return;
                                    selectedElement.style.textDecoration = 'line-through';
                                    selectedElement.style.opacity = '0.55';
                                    selectedElement.style.fontSize = '0.85em';
                                    saveToHistory();
                                    setActiveConfig(prev => prev ? { ...prev } : null);
                                  }}
                                  className="text-[10px] bg-slate-950 hover:bg-slate-850 text-red-400 border border-red-900/30 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>شطب كخصم ترويجي ✂️</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!selectedElement) return;
                                    selectedElement.style.fontWeight = 'bold';
                                    selectedElement.style.fontSize = '1.35rem';
                                    selectedElement.style.color = '#10b981';
                                    selectedElement.style.textDecoration = 'none';
                                    selectedElement.style.opacity = '1';
                                    saveToHistory();
                                    setActiveConfig(prev => prev ? { ...prev } : null);
                                  }}
                                  className="text-[10px] bg-slate-950 hover:bg-slate-850 text-emerald-400 border border-emerald-900/30 py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>تنسيق كسعر رئيسي 💵</span>
                                </button>
                              </div>
                            </div>

                            {/* 2. تحويل النص بالكامل لشارة مستقلة */}
                            <div className="space-y-2 pt-2 border-t border-slate-850">
                              <span className="block text-[10px] text-slate-400 font-bold">🏷️ تحويل النص لشارة ملونة مستقلة (Badge):</span>
                              <div className="grid grid-cols-3 gap-1">
                                {[
                                  { label: "شارة حمراء 🔴", bg: "#fee2e2", text: "#ef4444" },
                                  { label: "شارة خضراء 🟢", bg: "#d1fae5", text: "#10b981" },
                                  { label: "شارة ذهبية 🟡", bg: "#fef3c7", text: "#b45309" }
                                ].map((badgeStyle) => (
                                  <button
                                    key={badgeStyle.label}
                                    type="button"
                                    onClick={() => {
                                      if (!selectedElement) return;
                                      selectedElement.style.display = 'inline-block';
                                      selectedElement.style.backgroundColor = badgeStyle.bg;
                                      selectedElement.style.color = badgeStyle.text;
                                      selectedElement.style.padding = '4px 12px';
                                      selectedElement.style.borderRadius = '9999px';
                                      selectedElement.style.fontSize = '10px';
                                      selectedElement.style.fontWeight = 'bold';
                                      selectedElement.style.textAlign = 'center';
                                      selectedElement.style.border = 'none';
                                      saveToHistory();
                                      setActiveConfig(prev => prev ? { ...prev } : null);
                                    }}
                                    className="text-[9px] bg-slate-950 hover:bg-slate-850 text-slate-300 py-1.5 px-1 rounded transition text-center cursor-pointer"
                                  >
                                    {badgeStyle.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 🌟 حقن شارة ترويجية جديدة فوق العنصر المحدد */}
                        <div className="space-y-3 pt-3.5 border-t border-slate-800 text-right">
                          <p className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                            <span>🌟 إضافة شارة عائمة جديدة للمنتج (مثال: "خصم 20%" أو "جديد")</span>
                          </p>
                          <p className="text-[8.5px] text-slate-500 leading-normal">
                            💡 هذه الميزة تقوم بإنشاء شارة عائمة ملونة في الزاوية العلوية اليمنى للعنصر المختار (المجموعة أو الصورة).
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-right">
                            <div className="space-y-1">
                              <label className="block text-[8px] text-slate-400">نص الشارة:</label>
                              <input
                                type="text"
                                value={productBadgeText}
                                onChange={(e) => setProductBadgeText(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-[10px] text-indigo-300 font-sans focus:border-indigo-550 outline-none text-right"
                                placeholder="مثال: خصم 15% 🏷️"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[8px] text-slate-400">لون الشارة:</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={productBadgeColor}
                                  onChange={(e) => setProductBadgeColor(e.target.value)}
                                  className="w-7 h-7 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                                  title="اختر لوناً مخصصاً للشارة"
                                />
                                <div className="flex flex-wrap gap-1">
                                  {["#ef4444", "#f59e0b", "#10b981", "#6366f1"].map(c => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => setProductBadgeColor(c)}
                                      className={`w-3.5 h-3.5 rounded-full border border-slate-800 ${productBadgeColor === c ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-900' : ''}`}
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleInjectProductBadge}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-2 px-3 rounded-xl text-[10px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/40"
                          >
                            <PlusSquare className="w-3.5 h-3.5 text-white" />
                            <span>حقن الشارة الترويجية عائماً 🚀</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ⚙️ قسم الروابط والصور */}
                    {activeConfig && (selectedElement.tagName === 'A' || selectedElement.tagName === 'IMG') && (
                      <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                          {selectedElement.tagName === 'A' ? <LinkIcon className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                          <span>خصائص محددة للـ {selectedElement.tagName === 'A' ? 'روابط' : 'صور'}</span>
                        </p>
                        
                        {/* رابط لمثبت URL */}
                        {selectedElement.tagName === 'A' && (
                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-400">وجهة الزر/الرابط (href):</label>
                            <input
                              type="text"
                              value={activeConfig.href || ''}
                              onChange={(e) => handleAttributeChange('href', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                              placeholder="مثال: https://google.com"
                              dir="ltr"
                            />
                          </div>
                        )}

                        {/* تغيير صورة عبر ملف أو عنوان URL */}
                        {selectedElement.tagName === 'IMG' && (
                          <div className="space-y-3 text-xs">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-slate-400">عنوان الصورة (src):</label>
                              <input
                                type="text"
                                value={activeConfig.src || ''}
                                onChange={(e) => handleAttributeChange('src', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10px]"
                                placeholder="رابط URL خارجي للصورة"
                                dir="ltr"
                              />
                            </div>
                            <div className="space-y-1.5 pt-1.5 border-t border-slate-850">
                              <label className="block text-[10px] text-slate-400">أو ارفع صورة محلية لجعلها Base64:</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLocalImageReplacement}
                                className="w-full text-[10px] text-slate-400 file:bg-slate-800 file:border-none file:px-2 file:py-1 file:rounded-lg file:text-blue-400 file:ml-2"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 🔗 ربط العنصر بصفحة أو مسار (Click-to-Navigate) */}
                    {activeConfig && (
                      <div className="space-y-3 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <p className="text-xs font-bold text-teal-400 flex items-center gap-1.5 pb-2 border-b border-slate-800 font-sans">
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>🔗 إجراء الضغط والانتقال (ربط بمسار)</span>
                        </p>
                        
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-400 font-sans">مسار الانتقال عند الضغط على هذا العنصر (URL / Path):</label>
                          <input
                            type="text"
                            value={activeConfig.clickLink || ''}
                            onChange={(e) => handleAttributeChange('data-click-link', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-teal-400 font-mono focus:border-teal-500 outline-none"
                            placeholder="مثال: index.html أو #about أو https://..."
                            dir="ltr"
                          />
                          <p className="text-[9px] text-slate-500 leading-normal font-sans">
                            💡 يجعل هذا الخيار العنصر تفاعلياً ومؤشر الفأرة كيد (Pointer). عند النقر عليه في وضع المعاينة أو الموقع النهائي، سينتقل الزائر فوراً للعنوان المحدد.
                          </p>
                        </div>

                        {/* اختصارات ذكية للمسارات */}
                        <div className="space-y-1">
                          <span className="block text-[9px] text-slate-500 font-semibold font-sans">اختصارات سريعة للمسارات والصفحات:</span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: "الرئيسية 🏠", path: "index.html" },
                              { label: "من نحن 👥", path: "#about" },
                              { label: "خدماتنا 💼", path: "#services" },
                              { label: "اتصل بنا 📞", path: "#contact" }
                            ].map((shortcut) => (
                              <button
                                key={shortcut.label}
                                type="button"
                                onClick={() => handleAttributeChange('data-click-link', shortcut.path)}
                                className="text-[9px] bg-slate-950 hover:bg-slate-850 border border-slate-850 px-2 py-1 rounded cursor-pointer text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition-all font-sans"
                              >
                                {shortcut.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ➕ أداة إضافة أزرار متجاوبة وذكية للعنصر */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-850 justify-between">
                          <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-sans">
                            <PlusSquare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            <span>➕ إضافة زر تفاعلي متجاوب للعنصر</span>
                          </p>
                          <span className="text-[8px] bg-indigo-900/40 text-indigo-300 font-mono font-bold px-1.5 py-0.5 rounded-full">Responsive</span>
                        </div>

                        <p className="text-[9px] text-slate-405 leading-normal font-sans">
                          💡 أضف زراً ذكياً يتناسب تماماً مع أبعاد هذا العنصر ويتحرك معه بمرونة عند تكبير أو تصغير الصفحة. يمكنك جعل الزر غطاءً كاملاً بنفس مقاس العنصر.
                        </p>

                        {/* نص الزر */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-300 font-bold font-sans">نص الزر (Button Text):</label>
                          <input
                            type="text"
                            value={targetBtnText}
                            onChange={(e) => setTargetBtnText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-indigo-300 font-sans focus:border-indigo-500 outline-none"
                            placeholder="مثال: اضغط هنا للبدء 🔥"
                          />
                        </div>

                        {/* رابط الزر */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-300 font-bold font-sans">رابط الزر (URL / Path):</label>
                          <input
                            type="text"
                            value={targetBtnLink}
                            onChange={(e) => setTargetBtnLink(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-indigo-400 font-mono focus:border-indigo-500 outline-none"
                            placeholder="مثال: #contact أو https://..."
                            dir="ltr"
                          />
                        </div>

                        {/* طريقة الإلحاق والتموضع */}
                        <div className="space-y-2">
                          <label className="block text-[10px] text-slate-300 font-bold font-sans">طريقة تموضع الزر واستجابته:</label>
                          <div className="grid grid-cols-1 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetBtnPlacement('overlay');
                                setTargetBtnWidthType('full');
                              }}
                              className={`p-2 text-right text-[10px] rounded-lg border transition cursor-pointer flex flex-col gap-0.5 ${
                                targetBtnPlacement === 'overlay'
                                  ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              <span className="font-bold text-xs">🎯 زر غطاء كامل متطابق المقاس (Overlay Cover)</span>
                              <span className="text-[9px] text-slate-500 font-sans">يغطي العنصر الحالي تماماً وبنفس أبعاده المرنة 100% ليتجاوب معه في كافة الشاشات</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setTargetBtnPlacement('inside-end')}
                              className={`p-2 text-right text-[10px] rounded-lg border transition cursor-pointer flex flex-col gap-0.5 ${
                                targetBtnPlacement === 'inside-end'
                                  ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              <span className="font-bold">📥 بداخل العنصر في النهاية (Inside End)</span>
                              <span className="text-[8px] text-slate-500 font-sans">يُدرج الزر كعنصر تابع بالأسفل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setTargetBtnPlacement('inside-start')}
                              className={`p-2 text-right text-[10px] rounded-lg border transition cursor-pointer flex flex-col gap-0.5 ${
                                targetBtnPlacement === 'inside-start'
                                  ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              <span className="font-bold">📤 بداخل العنصر في البداية (Inside Start)</span>
                              <span className="text-[8px] text-slate-500 font-sans">يُدرج الزر كأول عنصر بالداخل</span>
                            </button>

                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTargetBtnPlacement('before')}
                                className={`p-2 text-right text-[10px] rounded-lg border transition cursor-pointer flex flex-col gap-0.5 ${
                                  targetBtnPlacement === 'before'
                                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                <span className="font-bold text-center w-full block">⬅️ قبل العنصر مباشرة</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTargetBtnPlacement('after')}
                                className={`p-2 text-right text-[10px] rounded-lg border transition cursor-pointer flex flex-col gap-0.5 ${
                                  targetBtnPlacement === 'after'
                                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                <span className="font-bold text-center w-full block">➡️ بعد العنصر مباشرة</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* اختيار تصميم ومظهر الزر */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-300 font-bold font-sans">تنسيق لون ومظهر الزر:</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'blue', label: 'أزرق تفاعلي 🌊', classes: 'border-blue-500 text-blue-400 bg-blue-950/20' },
                              { id: 'emerald', label: 'أخضر زمردي 🌿', classes: 'border-emerald-500 text-emerald-400 bg-emerald-950/20' },
                              { id: 'amber', label: 'ذهبي متوهج 🔥', classes: 'border-amber-500 text-amber-400 bg-amber-950/20' },
                              { id: 'transparent', label: 'شفاف / زجاجي ❄️', classes: 'border-slate-400 text-slate-300 bg-slate-950/20' }
                            ].map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => setTargetBtnStyle(preset.id as any)}
                                className={`px-2 py-1.5 text-[10px] rounded-lg border text-center transition cursor-pointer font-sans ${
                                  targetBtnStyle === preset.id
                                    ? `font-bold ${preset.classes}`
                                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* عرض متجاوب (لغير الغطاء الكامل) */}
                        {targetBtnPlacement !== 'overlay' && (
                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-300 font-bold font-sans">حجم عرض الزر:</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTargetBtnWidthType('full')}
                                className={`px-2 py-1 text-[9px] rounded-md border text-center transition cursor-pointer font-sans ${
                                  targetBtnWidthType === 'full'
                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-bold'
                                    : 'bg-slate-950 border-slate-850 text-slate-400'
                                }`}
                              >
                                عرض كامل 100% (W-Full)
                              </button>
                              <button
                                type="button"
                                onClick={() => setTargetBtnWidthType('fit')}
                                className={`px-2 py-1 text-[9px] rounded-md border text-center transition cursor-pointer font-sans ${
                                  targetBtnWidthType === 'fit'
                                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-bold'
                                    : 'bg-slate-950 border-slate-850 text-slate-400'
                                }`}
                              >
                                تلقائي حسب النص (Fit)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* زر التنفيذ النهائي */}
                        <button
                          type="button"
                          onClick={handleAddResponsiveButtonToElement}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer active:scale-[0.98] shadow-md shadow-indigo-950/40 flex items-center justify-center gap-1.5"
                        >
                          <PlusSquare className="w-4 h-4" />
                          <span>إضافة الزر المتجاوب للعنصر المختار الآن</span>
                        </button>
                      </div>
                    )}

                    {/* 🔠 خطوط وتنسيق النصوص */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <p className="text-xs font-bold text-slate-350 pb-2 border-b border-slate-850">تنسيق النصوص والظهور</p>
                        
                        {/* حجم الخط ومحاذاة */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">حجم الخط:</label>
                            <input 
                              type="text" 
                              value={activeConfig.fontSize}
                              onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                              placeholder="16px, 1.2rem..." 
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                              dir="ltr"
                            />
                            {/* خطوط سريعة */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {['12px', '14px', '16px', '18px', '24px', '32px', '48px'].map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => handleStyleChange('fontSize', sz)}
                                  className="text-[9px] font-mono bg-slate-950 text-slate-400 py-0.5 px-1 rounded hover:bg-blue-900/40 hover:text-blue-300 cursor-pointer border border-slate-900"
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">سمك الخط:</label>
                            <select
                              value={activeConfig.fontWeight}
                              onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                            >
                              <option value="normal">عادي (Normal)</option>
                              <option value="medium">متوسط (Medium)</option>
                              <option value="bold">عريض (Bold)</option>
                              <option value="900">عريض جداً (Heavy)</option>
                              <option value="300">نحيف (Light)</option>
                            </select>
                          </div>
                        </div>

                        {/* محاذاة النص واللون */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1.5">لون النص العام:</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={activeConfig.color.startsWith('#') ? activeConfig.color.slice(0, 7) : '#ffffff'}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={activeConfig.color}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 px-2 text-[10px]"
                                dir="ltr"
                              />
                            </div>
                            {/* لوحة الألوان السريعة للخط */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {[
                                { val: '#ffffff', title: 'أبيض' },
                                { val: '#000000', title: 'أسود' },
                                { val: '#1e293b', title: 'رمادي داكن' },
                                { val: '#64748b', title: 'رمادي متوسط' },
                                { val: '#2563eb', title: 'أزرق' },
                                { val: '#10b981', title: 'أخضر' },
                                { val: '#f59e0b', title: 'ذهبي' },
                                { val: '#dc2626', title: 'أحمر' },
                                { val: '#9333ea', title: 'بنفسجي' },
                              ].map((c) => (
                                <button
                                  key={c.val}
                                  type="button"
                                  onClick={() => handleStyleChange('color', c.val)}
                                  className="w-4 h-4 rounded-full border border-slate-800 cursor-pointer shadow-sm hover:scale-125 transition-transform"
                                  style={{ backgroundColor: c.val }}
                                  title={c.title}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">محاذاة النص:</label>
                            <select
                               value={activeConfig.textAlign}
                               onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                               className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                            >
                              <option value="right">يمين (Right)</option>
                              <option value="center">وسط (Center)</option>
                              <option value="left">يسار (Left)</option>
                              <option value="justify">مسافة متساوية (Justify)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
 
                    {/* 🎨 المظهر والخلفية */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <p className="text-xs font-bold text-slate-350 pb-2 border-b border-slate-850">المظهر العام والخلفيات</p>
                        
                        {/* لون الخلفية */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5">لون الخلفية المخصص:</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={activeConfig.backgroundColor.startsWith('#') ? activeConfig.backgroundColor.slice(0, 7) : '#ffffff'}
                              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                              className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                            />
                            <input 
                              type="text"
                              value={activeConfig.backgroundColor}
                              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 px-2 text-[10px]"
                              dir="ltr"
                            />
                          </div>
                          {/* لوحة الألوان السريعة للخلفية */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {[
                              { val: 'transparent', title: 'شفاف' },
                              { val: '#ffffff', title: 'أبيض' },
                              { val: '#f8fafc', title: 'رمادي فاتح' },
                              { val: '#0f172a', title: 'أسود داكن' },
                              { val: '#2563eb', title: 'أزرق' },
                              { val: '#eff6ff', title: 'أزرق خفيف' },
                              { val: '#10b981', title: 'أخضر' },
                              { val: '#ecfdf5', title: 'أخضر خفيف' },
                              { val: '#f59e0b', title: 'ذهبي' },
                              { val: '#dc2626', title: 'أحمر' },
                            ].map((c) => (
                              <button
                                key={c.val}
                                type="button"
                                onClick={() => handleStyleChange('backgroundColor', c.val)}
                                className={`w-8 h-4 rounded text-[9px] border border-slate-800 cursor-pointer shadow-sm hover:scale-105 transition flex items-center justify-center font-medium ${
                                  c.val === 'transparent' ? 'text-slate-405 bg-slate-950 border-dashed border-slate-700' : 'text-slate-900'
                                }`}
                                style={c.val !== 'transparent' ? { backgroundColor: c.val } : undefined}
                                title={c.title}
                              >
                                {c.val === 'transparent' ? 'شفاف' : ''}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* تدوير الزاوية والارتفاع */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">تدوير الحواف:</label>
                            <input 
                              type="text" 
                              value={activeConfig.borderRadius}
                              onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                              placeholder="e.g. 12px, 50%" 
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">الشفافية (Opacity):</label>
                            <input 
                              type="text" 
                              value={activeConfig.opacity}
                              onChange={(e) => handleStyleChange('opacity', e.target.value)}
                              placeholder="e.g. 0.8, 1" 
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✨ الحركات والتأثيرات التفاعلية (Animations & Motion Effects) */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-850 justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                            <div>
                              <p className="text-xs font-bold text-slate-200">الحركات والمؤثرات التفاعلية</p>
                              <p className="text-[10px] text-slate-400">تحريك العناصر لجذب الانتباه وزيادة التفاعل</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-amber-950/60 text-amber-400 px-2 py-0.5 rounded-full font-bold">حركي 🎬</span>
                        </div>

                        {/* نوع الحركة */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-400">أختر نوع الحركة البصرية:</label>
                          <select
                            value={activeConfig.animationType || 'none'}
                            onChange={(e) => handleAnimationSettingsChange(
                              e.target.value,
                              activeConfig.animationTrigger || 'onload',
                              activeConfig.animationDuration || '1s',
                              activeConfig.animationDelay || '0s',
                              activeConfig.animationTiming || 'ease-out'
                            )}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                          >
                            <option value="none">بدون حركة (None)</option>
                            <option value="fade-in">ظهور تدريجي (Fade In)</option>
                            <option value="slide-up">انزلاق للأعلى (Slide Up ⬆️)</option>
                            <option value="slide-down">انزلاق للأسفل (Slide Down ⬇️)</option>
                            <option value="slide-left">انزلاق لليسار (Slide Left ⬅️)</option>
                            <option value="slide-right">انزلاق لليمن (Slide Right ➡️)</option>
                            <option value="zoom-in">تكبير تدريجي (Zoom In 🔍)</option>
                            <option value="zoom-out">تصغير تدريجي (Zoom Out 🔎)</option>
                            <option value="bounce-in">ارتداد دخول (Bounce In 💠)</option>
                            <option value="pulse">نبض مستمر (Pulse 💓)</option>
                            <option value="bounce">ارتداد مستمر (Bounce 🏀)</option>
                            <option value="spin">دوران دائري (Spin 🔄)</option>
                            <option value="float">ارتفاع طافي (Float ☁️)</option>
                            <option value="wiggle">اهتزاز اهتزاز (Wiggle 🔔)</option>
                          </select>
                        </div>

                        {activeConfig.animationType && activeConfig.animationType !== 'none' && (
                          <>
                            {/* طريقة بدء التشغيل */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-slate-400">طريقة تشغيل وبدء الحركة:</label>
                              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl">
                                {[
                                  { id: 'onload', label: 'عند التحميل' },
                                  { id: 'hover', label: 'عند الحوم' },
                                  { id: 'infinite', label: 'لوب مستمر' }
                                ].map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleAnimationSettingsChange(
                                      activeConfig.animationType || 'none',
                                      t.id,
                                      activeConfig.animationDuration || '1s',
                                      activeConfig.animationDelay || '0s',
                                      activeConfig.animationTiming || 'ease-out'
                                    )}
                                    className={`py-1.5 rounded-lg text-[9px] text-center font-semibold transition-all cursor-pointer ${
                                      (activeConfig.animationTrigger || 'onload') === t.id
                                        ? 'bg-amber-600 text-white shadow'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* مدة حركات وسرعة التشغيل */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] text-slate-400">سرعة الحركة (Duration):</label>
                                <span className="text-[10px] font-mono font-bold text-amber-400">{activeConfig.animationDuration || '1s'}</span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={parseFloat(activeConfig.animationDuration || '1')}
                                onChange={(e) => handleAnimationSettingsChange(
                                  activeConfig.animationType || 'none',
                                  activeConfig.animationTrigger || 'onload',
                                  `${e.target.value}s`,
                                  activeConfig.animationDelay || '0s',
                                  activeConfig.animationTiming || 'ease-out'
                                )}
                                className="w-full accent-amber-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                              />
                              {/* أزرار سريعة للسرعة */}
                              <div className="flex gap-1 mt-1.5 justify-start flex-wrap">
                                {['0.3s', '0.5s', '1s', '1.5s', '2s', '3s'].map((pD) => (
                                  <button
                                    key={pD}
                                    type="button"
                                    onClick={() => handleAnimationSettingsChange(
                                      activeConfig.animationType || 'none',
                                      activeConfig.animationTrigger || 'onload',
                                      pD,
                                      activeConfig.animationDelay || '0s',
                                      activeConfig.animationTiming || 'ease-out'
                                    )}
                                    className="text-[9px] font-mono bg-slate-950 text-slate-400 py-0.5 px-1.5 rounded hover:bg-amber-900/40 hover:text-amber-300 cursor-pointer border border-slate-900"
                                  >
                                    {pD}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* تأخير بدء الحركة */}
                            {activeConfig.animationTrigger !== 'infinite' && (
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="block text-[10px] text-slate-400">تأخير بدء الحركة (Delay):</label>
                                  <span className="text-[10px] font-mono font-bold text-amber-400">{activeConfig.animationDelay || '0s'}</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={parseFloat(activeConfig.animationDelay || '0')}
                                  onChange={(e) => handleAnimationSettingsChange(
                                    activeConfig.animationType || 'none',
                                    activeConfig.animationTrigger || 'onload',
                                    activeConfig.animationDuration || '1s',
                                    `${e.target.value}s`,
                                    activeConfig.animationTiming || 'ease-out'
                                  )}
                                  className="w-full accent-amber-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                                />
                                {/* أزرار سريعة للتأخير */}
                                <div className="flex gap-1 mt-1.5 justify-start flex-wrap">
                                  {['0s', '0.2s', '0.5s', '1s', '2s'].map((pDelay) => (
                                    <button
                                      key={pDelay}
                                      type="button"
                                      onClick={() => handleAnimationSettingsChange(
                                        activeConfig.animationType || 'none',
                                        activeConfig.animationTrigger || 'onload',
                                        activeConfig.animationDuration || '1s',
                                        pDelay,
                                        activeConfig.animationTiming || 'ease-out'
                                      )}
                                      className="text-[9px] font-mono bg-slate-950 text-slate-400 py-0.5 px-1.5 rounded hover:bg-amber-900/40 hover:text-amber-300 cursor-pointer border border-slate-900"
                                    >
                                      {pDelay}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* تأثير التسارع والتوجيه */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-slate-400">انحناء التسارع (Timing Curve):</label>
                              <select
                                value={activeConfig.animationTiming || 'ease-out'}
                                onChange={(e) => handleAnimationSettingsChange(
                                  activeConfig.animationType || 'none',
                                  activeConfig.animationTrigger || 'onload',
                                  activeConfig.animationDuration || '1s',
                                  activeConfig.animationDelay || '0s',
                                  e.target.value
                                )}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                              >
                                <option value="ease-out">انسيابي سريع التدريج (Ease Out)</option>
                                <option value="ease-in-out">بداية ونهاية ناعمة (Ease In Out)</option>
                                <option value="linear">سرعة ثابتة منتظمة (Linear)</option>
                                <option value="cubic-bezier(0.34, 1.56, 0.64, 1)">ارتدادي مرن (Spring Boot 🚀)</option>
                              </select>
                            </div>

                            {/* زر لمعاينة الحركة يدوياً ومباشرة */}
                            <button
                              type="button"
                              onClick={() => {
                                handleAnimationSettingsChange(
                                  activeConfig.animationType || 'none',
                                  activeConfig.animationTrigger || 'onload',
                                  activeConfig.animationDuration || '1s',
                                  activeConfig.animationDelay || '0s',
                                  activeConfig.animationTiming || 'ease-out'
                                );
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-amber-950/45 text-amber-400 hover:bg-amber-900/40 border border-amber-900/50 hover:border-amber-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                              <span>🔄 اختبار وتجربة تأثير الحركة</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* 🌀 انتقالات وتأثيرات التمرير والبارالكس (Scroll Transitions & Parallax) */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-850 justify-between">
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <div>
                              <p className="text-xs font-bold text-slate-200">مؤثرات الحركة أثناء السكرول (Scroll)</p>
                              <p className="text-[10px] text-slate-400">تحريك الصور/الفيديو والبارالكس أثناء نزول وتصفح الصفحة</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded-full font-bold">تفاعلي 🔄</span>
                        </div>

                        {/* نوع تأثير التمرير */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-400">أختر حركة التمرير البصرية:</label>
                          <select
                            value={activeConfig.scrollEffect || 'none'}
                            onChange={(e) => handleScrollTransitionChange(
                              e.target.value,
                              activeConfig.scrollRegion || 'element',
                              activeConfig.scrollSpeed || '1'
                            )}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                          >
                            <option value="none">بدون تأثير تمرير (None)</option>
                            <option value="parallax-translate-y">حركة بارالكس عمودية (Parallax Vertical ↕️)</option>
                            <option value="parallax-scale">تكبير وتصغير سلس مع التمرير (Parallax Zoom 🔍)</option>
                            <option value="parallax-opacity">تلاشي وظهور تدريجي مع التمرير (Fade Opacity 🎭)</option>
                            <option value="video-scroll-scrub">تحكم في مشهد فيديو الخلفية ب لفة عجلة السكرول (Video Scrub 📽️)</option>
                          </select>
                        </div>

                        {activeConfig.scrollEffect && activeConfig.scrollEffect !== 'none' && (
                          <>
                            {/* منطقة التشغيل */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-slate-400">منطقة احتساب التمرير:</label>
                              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl">
                                {[
                                  { id: 'element', label: 'عند الاقتراب من العنصر نفسه' },
                                  { id: 'page', label: 'على امتداد الصفحة بالكامل' }
                                ].map((reg) => (
                                  <button
                                    key={reg.id}
                                    type="button"
                                    onClick={() => handleScrollTransitionChange(
                                      activeConfig.scrollEffect || 'none',
                                      reg.id,
                                      activeConfig.scrollSpeed || '1'
                                    )}
                                    className={`py-1.5 px-2 rounded-lg text-[9px] text-center font-semibold transition-all cursor-pointer ${
                                      (activeConfig.scrollRegion || 'element') === reg.id
                                        ? 'bg-emerald-600 text-white shadow'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {reg.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* شدة وسرعة التأثير */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] text-slate-400">شدة / حساسية التأثير (Speed Multiplier):</label>
                                <span className="text-[10px] font-mono font-bold text-emerald-400">{activeConfig.scrollSpeed || '1'}x</span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                value={parseFloat(activeConfig.scrollSpeed || '1')}
                                onChange={(e) => handleScrollTransitionChange(
                                  activeConfig.scrollEffect || 'none',
                                  activeConfig.scrollRegion || 'element',
                                  e.target.value
                                )}
                                className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                              />
                              {/* أزرار سريعة للحساسية */}
                              <div className="flex gap-1 mt-1.5 justify-start flex-wrap">
                                {['0.2', '0.5', '1.0', '1.5', '2.0', '3.0'].map((sp) => (
                                  <button
                                    key={sp}
                                    type="button"
                                    onClick={() => handleScrollTransitionChange(
                                      activeConfig.scrollEffect || 'none',
                                      activeConfig.scrollRegion || 'element',
                                      sp
                                    )}
                                    className="text-[9px] font-mono bg-slate-950 text-slate-400 py-0.5 px-1.5 rounded hover:bg-emerald-900/40 hover:text-emerald-300 cursor-pointer border border-slate-900"
                                  >
                                    {sp}x
                                  </button>
                                ))}
                              </div>
                            </div>

                            <p className="text-[9px] text-slate-450 leading-relaxed bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                              ℹ️ تمكين هذا الخيار يربط حركة ومظهر العنصر (أو إطارات تتابع الفيديو) بمحاذاة تصفح العميل للصفحة صعوداً وهبوطاً لعمل سرد قصصي وبصري فريد للتنقل.
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* 📽️ أداة التحكم بالصوت والفيديو والتمرير (Scroll Video Controller) */}
                    {activeConfig && isVideoSelected && (
                      <div className="space-y-4 p-4 bg-slate-900/95 border-2 border-emerald-500/25 rounded-2xl shadow-xl shadow-emerald-950/20">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-850 justify-between">
                          <div className="flex items-center gap-2 font-bold text-slate-100">
                            <span className="w-4 h-4 text-emerald-400">📽️</span>
                            <div>
                              <p className="text-xs font-bold text-slate-100">متحكم الفيديو الشفاف المستند للسكرول</p>
                              <p className="text-[9px] text-emerald-400 font-sans tracking-tight">Scroll Video Controller</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold">نشط ⚡</span>
                        </div>

                        {/* رابط الفيديو الشفاف */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-400 font-semibold">رابط مقطع الفيديو الشفاف (.webm / .mp4):</label>
                          <input
                            type="text"
                            value={getSelectedVideoSrc()}
                            onChange={(e) => handleScrollVideoPropChange('src', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-emerald-400 font-mono focus:border-emerald-500 outline-none"
                            placeholder="مثال: https://assets.mixkit.co/..."
                          />

                          {/* ملفات مسبقة عالية الدقة */}
                          <div className="space-y-1">
                            <span className="block text-[9px] text-slate-500 font-medium">افتح مجسمات وتأثيرات مسبقة شفافة:</span>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { name: "الكرة الأرضية 🌐", url: "https://assets.mixkit.co/videos/preview/mixkit-transparent-spinning-globe-of-earth-31804-large.mp4" },
                                { name: "مكعب نيون 🧊", url: "https://assets.mixkit.co/videos/preview/mixkit-cyber-punk-futuristic-hologram-cube-31811-large.mp4" },
                                { name: "جزيئات لامعة ✨", url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-gold-bokeh-particles-on-alpha-channel-31810-large.mp4" }
                              ].map((v) => (
                                <button
                                  key={v.name}
                                  type="button"
                                  onClick={() => handleScrollVideoPropChange('src', v.url)}
                                  className="text-[9px] bg-slate-950 hover:bg-slate-850 border border-slate-850 p-1.5 rounded-md text-slate-400 text-center truncate cursor-pointer hover:border-emerald-500/20"
                                >
                                  {v.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* رفع فيديو شفاف محلي بالكامل */}
                          <div className="space-y-1">
                            <span className="block text-[9px] text-slate-500 font-medium">أو ارفع فيديو شفاف من جهازك (webm/mov/mp4):</span>
                            <div className="relative flex items-center justify-center p-2.5 border border-dashed border-slate-800 hover:border-emerald-500/40 rounded-xl transition cursor-pointer bg-slate-950/40">
                              <input
                                type="file"
                                accept="video/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const fileUrl = URL.createObjectURL(file);
                                    handleScrollVideoPropChange('src', fileUrl);
                                  }
                                }}
                              />
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <span className="w-3.5 h-3.5 text-slate-400">📂</span>
                                <span className="text-[10px] font-bold">رفع فيديو أو سيكوينس محلي 📂</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ارتفاع القسم المطاطي المسؤول عن السكرول بالـ vh */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>حجم المسافة المخصصة للسكرول (Scroll Height):</span>
                            <span className="text-emerald-400 font-mono font-bold font-sans">
                              {getSelectedParentHeight()}vh
                            </span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="600"
                            step="50"
                            value={getSelectedParentHeight()}
                            onChange={(e) => handleScrollVideoPropChange('height', e.target.value)}
                            className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <span>100vh (سريع)</span>
                            <span>250vh (معتدل)</span>
                            <span>600vh (بطيء وفائق الدقة)</span>
                          </div>
                        </div>

                        {/* شدة تأثير تمويه وغمر الخلفية */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>قوة تمويه وتظليل الخلفية التلقائي (Blur):</span>
                            <span className="text-emerald-400 font-mono font-bold">
                              {Math.round(parseFloat(getSelectedBlurMultiplier()) * 12)}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="2"
                            step="0.1"
                            value={parseFloat(getSelectedBlurMultiplier())}
                            onChange={(e) => handleScrollVideoPropChange('blur', e.target.value)}
                            className="w-full accent-emerald-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                          />
                          <span className="block text-[9px] text-slate-500 leading-normal">
                            💡 أثناء تصفح المستخدم للقسم، يزداد تركيز المشهد على الكائن ثلاثي الأبعاد بينما يعم هدوء ضبابي رائع في باقي أجزاء الموقع.
                          </span>
                        </div>

                        {/* شرح After Effects للتصدير */}
                        <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-1 text-right">
                          <span className="block text-[10px] font-bold text-sky-400">💡 تعليمات تصدير كائنات شفافة بنقرة واحدة:</span>
                          <ol className="list-decimal list-inside space-y-1 text-[9px] text-slate-400 leading-normal">
                            <li>في برنامج <strong>After Effects</strong> أو <strong>Blender</strong>، امسح الخلفية.</li>
                            <li>عند الإخراج والتصدير، اختر صيغة <strong>WebM VP9</strong> بترميز <strong>Include Alpha Channel</strong>.</li>
                            <li>لأجهزة iOS/Safari، يرجى توفير صيغة <strong>.mov</strong> موازية بترميز <code>Apple ProRes 4444</code>.</li>
                            <li>حافظ على معدلات بت (bitrate) معتدلة للحصول على سرعة تشغيل فورية على الهواتف.</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* 📐 الهوامش والمقاسات والأبعاد */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <p className="text-xs font-bold text-slate-350 pb-2 border-b border-slate-850 flex items-center justify-between">
                          <span>الهوامش والمقاسات التفصيلية</span>
                          <span className="text-[10px] text-blue-400 font-medium font-sans">تحجيم ذكي 📏</span>
                        </p>

                        {/* 📈 أزرار تكبير وتصغير حجم العنصر سريعاً وبتناسق متجاوب */}
                        <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                              <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                              التحكم السريع بالحجم (Quick Scale):
                            </span>
                            <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded-md text-slate-500">متناسق 📱</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleScaleElement(1.1)}
                              className="text-xs font-bold py-2 px-3 rounded-xl bg-blue-600/90 hover:bg-blue-600 border border-blue-500/30 text-white transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 select-none"
                              title="تكبير حجم العنصر الحالي والخطوط بنسبة 10%"
                            >
                              <span>➕ تكبير الحجم (+10%)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScaleElement(0.9)}
                              className="text-xs font-bold py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 select-none"
                              title="تصغير حجم العنصر الحالي والخطوط بنسبة 10%"
                            >
                              <span>➖ تصغير الحجم (-10%)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleScaleElement(1.25)}
                              className="text-[10px] font-semibold py-1.5 px-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/50 text-indigo-200 transition text-center cursor-pointer active:scale-95 select-none"
                              title="تكبير العنصر والخطوط بنسبة ٢٥%"
                            >
                              🚀 تكبير فائق (+25%)
                            </button>

                            <button
                              type="button"
                              onClick={() => handleScaleElement(0.75)}
                              className="text-[10px] font-semibold py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-350 transition text-center cursor-pointer active:scale-95 select-none"
                              title="تصغير العنصر والخطوط بنسبة ٢٥%"
                            >
                              🛡️ تصغير فائق (-25%)
                            </button>
                          </div>

                          <div className="flex gap-2 items-center justify-between pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400">
                            <span>* يعدل العرض والارتفاع والخطوط بتناغم ذكي</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleStyleChange('width', 'auto');
                                handleStyleChange('height', 'auto');
                                handleStyleChange('fontSize', '');
                              }}
                              className="text-[9px] text-blue-400 hover:underline cursor-pointer font-bold"
                            >
                              إعادة تعيين للتلقائي
                            </button>
                          </div>
                        </div>
                        
                        {/* العرض والارتفاع */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">العرض (Width):</label>
                            <input 
                              type="text" 
                              value={activeConfig.width}
                              onChange={(e) => handleStyleChange('width', e.target.value)}
                              placeholder="auto, 100%, 250px" 
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                              dir="ltr"
                            />
                            {/* قياسات سريعة للعرض */}
                            <div className="flex flex-wrap gap-1 mt-1.5 justify-start">
                              {['auto', '25%', '50%', '100%', '200px', '400px'].map((wPreset) => (
                                <button
                                  key={wPreset}
                                  type="button"
                                  onClick={() => handleStyleChange('width', wPreset)}
                                  className="text-[9px] font-mono bg-slate-950 text-slate-400 py-0.5 px-1 rounded hover:bg-blue-900/40 hover:text-blue-300 cursor-pointer border border-slate-900"
                                >
                                  {wPreset}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">الارتفاع (Height):</label>
                            <input 
                              type="text" 
                              value={activeConfig.height}
                              onChange={(e) => handleStyleChange('height', e.target.value)}
                              placeholder="auto, 400px" 
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                              dir="ltr"
                            />
                            {/* قياسات سريعة للارتفاع */}
                            <div className="flex flex-wrap gap-1 mt-1.5 justify-start">
                              {['auto', '50px', '100px', '250px', '400px', '600px'].map((hPreset) => (
                                <button
                                  key={hPreset}
                                  type="button"
                                  onClick={() => handleStyleChange('height', hPreset)}
                                  className="text-[9px] font-mono bg-slate-950 text-slate-400 py-0.5 px-1 rounded hover:bg-blue-900/40 hover:text-blue-300 cursor-pointer border border-slate-900"
                                >
                                  {hPreset}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* الهوامش الداخلية (Padding) */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5">الهوامش الهيكلية الداخلية (Padding):</label>
                          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                            <div>
                              <span className="text-slate-500 block mb-0.5">أعلى</span>
                              <input 
                                type="text" 
                                value={activeConfig.paddingTop}
                                onChange={(e) => handleStyleChange('paddingTop', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">أسفل</span>
                              <input 
                                type="text" 
                                value={activeConfig.paddingBottom}
                                onChange={(e) => handleStyleChange('paddingBottom', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">يمين</span>
                              <input 
                                type="text" 
                                value={activeConfig.paddingRight}
                                onChange={(e) => handleStyleChange('paddingRight', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">يسار</span>
                              <input 
                                type="text" 
                                value={activeConfig.paddingLeft}
                                onChange={(e) => handleStyleChange('paddingLeft', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center"
                                dir="ltr"
                              />
                            </div>
                          </div>
                        </div>

                        {/* الهوامش الخارجية (Margin) */}
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1.5">الهوامش الهيكلية الخارجية (Margin):</label>
                          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                            <div>
                              <span className="text-slate-500 block mb-0.5">أعلى</span>
                              <input 
                                type="text" 
                                value={activeConfig.marginTop}
                                onChange={(e) => handleStyleChange('marginTop', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">أسفل</span>
                              <input 
                                type="text" 
                                value={activeConfig.marginBottom}
                                onChange={(e) => handleStyleChange('marginBottom', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">يمين</span>
                              <input 
                                type="text" 
                                value={activeConfig.marginRight}
                                onChange={(e) => handleStyleChange('marginRight', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">يسار</span>
                              <input 
                                type="text" 
                                value={activeConfig.marginLeft}
                                onChange={(e) => handleStyleChange('marginLeft', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center"
                                dir="ltr"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 📱 التجاوب الذكي والتصميم المرن لجميع الشاشات (Responsive & Flex Layouts) */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                          <Grid className="w-4 h-4 text-indigo-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-200">التجاوب المتناسق والتصميم المرن (Flex & Auto)</p>
                            <p className="text-[10px] text-slate-400">لضمان دقة ظهور العناصر واتساقها على دقة الجوال والكمبيوتر</p>
                          </div>
                        </div>

                        {/* إرشادات التجاوب الذكي */}
                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-350 leading-relaxed space-y-1.5">
                          <div className="flex items-center gap-1 font-bold text-indigo-400">
                            <Info className="w-3.5 h-3.5 mr-1" />
                            <span>💡 حماية التناسق عبر الشاشات:</span>
                          </div>
                          <p>
                            الاعتماد المبالغ فيه على الهوامش والمسافات الثابتة بالبكسل قد يجعل العنصر يخرج عن الشاشة في الهواتف. استخدم أدوات التحويل السريع أدناه لجعل التموضع تلقائياً ومرناً!
                          </p>
                        </div>

                        {/* أدوات التحول السريع للتجاوب */}
                        <div className="space-y-2">
                          <span className="block text-[10px] text-slate-400">إجراءات التجاوب والضبط السريع:</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleStyleChange('marginLeft', 'auto');
                                handleStyleChange('marginRight', 'auto');
                                handleStyleChange('display', 'block');
                              }}
                              className="text-[10px] font-semibold py-2 px-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/50 hover:border-indigo-800 text-indigo-200 transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                              title="يجعل العنصر يتوسط الشاشة تلقائياً في الكمبيوتر ومختلف الهواتف الذكية"
                            >
                              ✨ توسيط متجاوب (Auto-Center)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleStyleChange('width', '100%');
                                handleStyleChange('maxWidth', '100%');
                              }}
                              className="text-[10px] font-semibold py-2 px-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/50 hover:border-indigo-800 text-indigo-200 transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                              title="تمديد العرض ليملا الشاشات تماماً"
                            >
                              📱 ملء العرض (Width: 100%)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleStyleChange('width', 'auto');
                                handleStyleChange('height', 'auto');
                              }}
                              className="text-[10px] font-semibold py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                              title="استرجاع الحجم الافتراضي التلقائي"
                            >
                              🔄 حجم تلقائي (Auto Size)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleStyleChange('objectFit', 'cover');
                                if (selectedElement) {
                                  selectedElement.style.objectFit = 'cover';
                                }
                              }}
                              className="text-[10px] font-semibold py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                              title="يحمي الصور من التشوه والتمطط عبر شاشات العرض المتفاوتة"
                            >
                              🖼️ حماية مظهر الصورة (Cover)
                            </button>
                          </div>
                        </div>

                        {/* نظام التخطيط المرن (Flexbox Container controls) */}
                        <div className="space-y-3 pt-2 border-t border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-300">أدوات ترتيب مرن (CSS Flexbox):</span>
                            <span className="text-[9px] text-slate-500 font-mono">توزيع العناصر داخله</span>
                          </div>

                          {/* تفعيل التصميم المرن display: flex */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStyleChange('display', 'flex')}
                              className={`py-2 rounded-xl text-center text-xs font-semibold transition cursor-pointer ${
                                activeConfig.display === 'flex'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-white'
                              }`}
                            >
                              تفعيل التصميم المرن (Flex)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStyleChange('display', 'block')}
                              className={`py-2 rounded-xl text-center text-xs font-semibold transition cursor-pointer ${
                                activeConfig.display !== 'flex'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-white'
                              }`}
                            >
                              تخطيط طبيعي (Normal)
                            </button>
                          </div>

                          {activeConfig.display === 'flex' && (
                            <div className="space-y-2.5 bg-slate-950/50 p-2.5 rounded-xl border border-slate-850/65">
                              {/* اتجاه المحتوى - Flex Direction */}
                              <div className="space-y-1">
                                <span className="block text-[9px] text-slate-400">اتجاه العناصر (Flex Direction):</span>
                                <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('flexDirection', 'column')}
                                    className={`py-1 rounded-md text-center font-bold transition cursor-pointer ${
                                      activeConfig.flexDirection === 'column'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                    title="ترتيب طولي - ممتاز ومتناسق للغاية مع الهواتف الذكية"
                                  >
                                    طولي (رأسي للجوال)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('flexDirection', 'row')}
                                    className={`py-1 rounded-md text-center font-bold transition cursor-pointer ${
                                      activeConfig.flexDirection === 'row' || !activeConfig.flexDirection
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                    title="ترتيب عرضي - مناسب لأجهزة الكمبيوتر والشاشات العريضة"
                                  >
                                    عرضي (أفقي)
                                  </button>
                                </div>
                              </div>

                              {/* التوزيع الأفقي - Justify Content */}
                              <div className="space-y-1">
                                <span className="block text-[9px] text-slate-400">محاذاة العناصر الأفقي (Justify):</span>
                                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg text-[9px]">
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('justifyContent', 'center')}
                                    className={`py-1 rounded-md transition cursor-pointer ${
                                      activeConfig.justifyContent === 'center' ? 'bg-blue-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    الوسط (Center)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('justifyContent', 'flex-start')}
                                    className={`py-1 rounded-md transition cursor-pointer ${
                                      activeConfig.justifyContent === 'flex-start' ? 'bg-blue-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    البداية
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('justifyContent', 'flex-end')}
                                    className={`py-1 rounded-md transition cursor-pointer ${
                                      activeConfig.justifyContent === 'flex-end' ? 'bg-blue-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    النهاية
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('justifyContent', 'space-between')}
                                    className={`col-span-3 py-1.5 rounded-md transition cursor-pointer mt-1 ${
                                      activeConfig.justifyContent === 'space-between' ? 'bg-blue-700 text-white font-bold' : 'text-slate-400 hover:text-white border border-slate-805'
                                    }`}
                                    title="يقوم بتوزيع العناصر بمسافة متساوية تماماً وتلقائية"
                                  >
                                    توزيع بمسافات متساوية (Space-Between)
                                  </button>
                                </div>
                              </div>

                              {/* التوزيع الرأسي - Align Items */}
                              <div className="space-y-1">
                                <span className="block text-[9px] text-slate-400">محاذاة العناصر الرأسي (Align):</span>
                                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg text-[9px]">
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('alignItems', 'center')}
                                    className={`py-1 rounded-md transition cursor-pointer ${
                                      activeConfig.alignItems === 'center' ? 'bg-blue-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    الوسط (Center)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('alignItems', 'flex-start')}
                                    className={`py-1 rounded-md transition cursor-pointer ${
                                      activeConfig.alignItems === 'flex-start' ? 'bg-blue-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    أعلى
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStyleChange('alignItems', 'flex-end')}
                                    className={`py-1 rounded-md transition cursor-pointer ${
                                      activeConfig.alignItems === 'flex-end' ? 'bg-blue-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    أسفل
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 📐 تصميم مخصص متجاوب لكل شاشة بشكل مستقل */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-850 justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <div>
                              <p className="text-xs font-bold text-slate-200 font-sans">تصميم مستقل لكل شاشة (Per-Screen CSS)</p>
                              <p className="text-[10px] text-slate-400">تعديل دقيق ومنفصل بالكامل لكل جهاز</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-purple-950/65 text-purple-400 px-2 py-0.5 rounded-full font-bold">بث حي ⚡</span>
                        </div>

                        {/* دليل توجيهي للمستخدم */}
                        <div className="bg-slate-950/45 p-2.5 rounded-xl border border-slate-850 text-[10px] text-slate-350 leading-relaxed space-y-1">
                          <p>
                            اضبط حجم الخط، الأبعاد، المساحات، أو الألوان خصيصاً للشاشة التي تختارها، ثم اضغط <strong className="text-purple-400">"حفظ تصميم الشاشة"</strong>. سيقوم النظام تلقائياً بإنشاء Media Queries متجاورة لتبدو الصفحة رائعة ومتناسقة!
                          </p>
                        </div>

                        {/* اختيار الشاشة المراد تعديلها */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-400">1. اختر الشاشة المراد تصميمها:</label>
                          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setResponsiveEditDevice('desktop');
                                setCurrentDevice('desktop');
                              }}
                              className={`py-1.5 rounded-lg text-[10px] text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                responsiveEditDevice === 'desktop'
                                  ? 'bg-purple-650 text-white shadow-sm font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Laptop className="w-3.5 h-3.5" />
                              <span>الكمبيوتر</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResponsiveEditDevice('tablet');
                                setCurrentDevice('tablet');
                              }}
                              className={`py-1.5 rounded-lg text-[10px] text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                responsiveEditDevice === 'tablet'
                                  ? 'bg-purple-650 text-white shadow-sm font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Tablet className="w-3.5 h-3.5" />
                              <span>التابلت</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResponsiveEditDevice('mobile');
                                setCurrentDevice('mobile');
                              }}
                              className={`py-1.5 rounded-lg text-[10px] text-center font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                responsiveEditDevice === 'mobile'
                                  ? 'bg-purple-650 text-white shadow-sm font-bold'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>الجوّال</span>
                            </button>
                          </div>
                        </div>

                        {/* خيار النسخ السريع لبيانات التصميم الافتراضي */}
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={handlePopulateFromCurrentStyles}
                            className="flex-1 text-[9px] font-bold py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-350 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            📥 نسخ قيم التصميم الحالي للشاشة
                          </button>
                          <button
                            type="button"
                            onClick={handleClearResponsiveStyles}
                            className="text-[9px] font-bold py-1.5 px-3 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-900/30 text-red-400 transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            title="إعادة تعيين وإلغاء التصميم المخصص لهذا الحجم"
                          >
                            مسح ❌
                          </button>
                        </div>

                        {/* حقول الإدخال لتصميم الشاشة المحددة */}
                        <div className="space-y-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                          <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                            <span className="text-[10px] font-bold text-slate-300">تعديل قيم ({
                              responsiveEditDevice === 'desktop' ? 'شاشات الكمبيوتر >= 1025px' :
                              responsiveEditDevice === 'tablet' ? 'شاشات التابلت 641px - 1024px' :
                              'شاشات الجوال <= 640px'
                            }) :</span>
                            <span className="text-[9px] text-purple-400 font-mono">CSS Overrides</span>
                          </div>

                          {/* الخط واللون واللون الخلفي */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">حجم الخط (FontSize):</label>
                              <input
                                type="text"
                                placeholder="مثال: 16px, 1.2rem"
                                value={resFontSize}
                                onChange={(e) => handleResponsiveStyleChange('fontSize', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-350"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">محاذاة النص (Align):</label>
                              <select
                                value={resTextAlign}
                                onChange={(e) => handleResponsiveStyleChange('textAlign', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-355"
                              >
                                <option value="">تلقائي</option>
                                <option value="right">يمين (Right)</option>
                                <option value="center">وسط (Center)</option>
                                <option value="left">يسار (Left)</option>
                                <option value="justify">متساوي (Justify)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">لون النص (Color):</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="color"
                                  value={resColor.startsWith('#') && resColor.length === 7 ? resColor : '#ffffff'}
                                  onChange={(e) => handleResponsiveStyleChange('color', e.target.value)}
                                  className="w-8 h-7 bg-slate-900 border border-slate-800 rounded-md p-0.5 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  placeholder="#ffffff"
                                  value={resColor}
                                  onChange={(e) => handleResponsiveStyleChange('color', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-slate-350"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">لون الخلفية (BgColor):</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="color"
                                  value={resBgColor.startsWith('#') && resBgColor.length === 7 ? resBgColor : '#3b82f6'}
                                  onChange={(e) => handleResponsiveStyleChange('backgroundColor', e.target.value)}
                                  className="w-8 h-7 bg-slate-900 border border-slate-800 rounded-md p-0.5 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  placeholder="شفاف أو hex"
                                  value={resBgColor}
                                  onChange={(e) => handleResponsiveStyleChange('backgroundColor', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs text-slate-350"
                                />
                              </div>
                            </div>
                          </div>

                          {/* الأبعاد والعرض والارتفاع */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">العرض (Width):</label>
                              <input
                                type="text"
                                placeholder="مثال: 100%, 320px"
                                value={resWidth}
                                onChange={(e) => handleResponsiveStyleChange('width', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-350"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">الارتفاع (Height):</label>
                              <input
                                type="text"
                                placeholder="مثال: 200px, auto"
                                value={resHeight}
                                onChange={(e) => handleResponsiveStyleChange('height', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-350"
                              />
                            </div>
                          </div>

                          {/* الهوامش والحشو الداخلي */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">حشو داخلي (Padding):</label>
                              <input
                                type="text"
                                placeholder="مثال: 10px 20px"
                                value={resPadding}
                                onChange={(e) => handleResponsiveStyleChange('padding', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-350"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">هامش خارجي (Margin):</label>
                              <input
                                type="text"
                                placeholder="مثال: 10px auto"
                                value={resMargin}
                                onChange={(e) => handleResponsiveStyleChange('margin', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-350"
                              />
                            </div>
                          </div>

                          {/* انحناء الحافات والظهور */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">انحناء الأطراف (Radius):</label>
                              <input
                                type="text"
                                placeholder="مثال: 12px, 50%"
                                value={resBorderRadius}
                                onChange={(e) => handleResponsiveStyleChange('borderRadius', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-350"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-405 block pb-0.2">ظهور وتوزيع (Display):</label>
                              <select
                                value={resDisplay}
                                onChange={(e) => handleResponsiveStyleChange('display', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-355"
                              >
                                <option value="">تلقائي</option>
                                <option value="block">كامل السطر (Block)</option>
                                <option value="inline-block">جزء من السطر (Inline-Block)</option>
                                <option value="flex">مرن (Flex Container)</option>
                                <option value="none font-bold text-red-400">مخفي 👁️‍🌫️ (None)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* زر السيف والحفظ */}
                        <button
                          type="button"
                          onClick={handleSaveResponsiveStyles}
                          className={`w-full text-white font-bold py-2.5 px-4 rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                            isSavedFeedback 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                          }`}
                        >
                          {isSavedFeedback ? (
                            <span>✨ تم الحفر والربط بنجاح! ✓</span>
                          ) : (
                            <span>💾 حفظ كـتصميم مخصص لـ ({
                              responsiveEditDevice === 'desktop' ? 'الكمبيوتر' :
                              responsiveEditDevice === 'tablet' ? 'التابلت' :
                              'الجوّال'
                            })</span>
                          )}
                        </button>

                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span>* لحفظ التعديلات في الكود بشكل دائم، يرجى تحميل الملف عند الانتهاء.</span>
                          {selectedResponsiveStyles[responsiveEditDevice] && (
                            <span className="text-purple-400 font-bold font-sans">معرف مخصص نشط ✓</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 🥞 ترتيب الطبقات والظهور الفوقي (Layers & Z-Index) */}
                    {activeConfig && (
                      <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-850">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                          <Layers className="w-4 h-4 text-blue-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-200">ترتيب الطبقات والارتفاع (Layers)</p>
                            <p className="text-[10px] text-slate-400">التحكم في ظهور عُنصر فوق عُنصر آخر</p>
                          </div>
                        </div>

                        {/* تنبيه تعليمي هام */}
                        <div className="bg-blue-950/20 border border-blue-900/40 p-2.5 rounded-xl text-[10px] text-blue-300 space-y-1">
                          <div className="font-bold flex items-center gap-1">
                            <span>💡 معلومة تصميمية:</span>
                          </div>
                          <p className="leading-relaxed">
                            لتتمكن من رفع عنصر مخصص (Z-Index) فوق الآخرين، يجب أولاً تغيير نوع الموضع (Position) من الخيارات بالأسفل لـ <strong className="underline">نسببي (Relative)</strong> أو <strong className="underline">مطلق (Absolute)</strong>.
                          </p>
                        </div>

                        {/* نوع الموضع Position */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-slate-400">موضع العنصر (Position):</label>
                          <select
                            value={activeConfig.position || 'static'}
                            onChange={(e) => handleStyleChange('position', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                          >
                            <option value="static">تلقائي (Static) - الترتيب الطبيعي</option>
                            <option value="relative">نسبياً (Relative) - يتيح الرفع مع ثبات المساحة</option>
                            <option value="absolute">مطلق (Absolute) - عائم وحر تماماً</option>
                            <option value="fixed">ثابت في الشاشة (Fixed)</option>
                            <option value="sticky">ملتصق أثناء التمرير (Sticky)</option>
                          </select>
                        </div>

                        {/* ترتيب الطبقات Z-Index */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-400">مستوى الطبقة (Z-Index):</label>
                            <span className="text-xs font-mono font-bold text-blue-450">
                              {activeConfig.zIndex || 'تلقائي (auto)'}
                            </span>
                          </div>

                          {/* أزرار سريعة للطبقات */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStyleChange('zIndex', 'auto')}
                              className={`text-[9px] font-medium py-1.5 px-1 rounded-lg transition text-center cursor-pointer ${
                                !activeConfig.zIndex || activeConfig.zIndex === 'auto'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-white'
                              }`}
                            >
                              تلقائي (Auto)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStyleChange('zIndex', '-1')}
                              className={`text-[9px] font-medium py-1.5 px-1 rounded-lg transition text-center cursor-pointer ${
                                activeConfig.zIndex === '-1'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-white'
                              }`}
                              title="وضعه في الخلفية تماماً تحت جميع العناصر"
                            >
                              تحت الكل (1-)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStyleChange('zIndex', '1')}
                              className={`text-[9px] font-medium py-1.5 px-1 rounded-lg transition text-center cursor-pointer ${
                                activeConfig.zIndex === '1'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-white'
                              }`}
                            >
                              طبقة 1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStyleChange('zIndex', '10')}
                              className={`text-[9px] font-medium py-1.5 px-1 rounded-lg transition text-center cursor-pointer ${
                                activeConfig.zIndex === '10'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-white'
                              }`}
                            >
                              طبقة 10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStyleChange('zIndex', '50')}
                              className={`text-[9px] font-medium py-1.5 px-1 rounded-lg transition text-center cursor-pointer ${
                                activeConfig.zIndex === '50'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-white'
                              }`}
                            >
                              طبقة فوق (50)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStyleChange('zIndex', '9999')}
                              className={`text-[9px] font-medium py-1.5 px-1 rounded-lg transition text-center cursor-pointer ${
                                activeConfig.zIndex === '9999'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:text-white'
                              }`}
                              title="المقدمة المطلقة فوق جميع طبقات الصفحة"
                            >
                              الأول (9999)
                            </button>
                          </div>

                          {/* تحرير يدوي دقيق لقيمة Z-Index */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="number"
                              value={isNaN(parseInt(activeConfig.zIndex || '')) ? '' : parseInt(activeConfig.zIndex || '')}
                              placeholder="أدخل قيمة يدوية مخصصة"
                              onChange={(e) => {
                                const val = e.target.value;
                                handleStyleChange('zIndex', val === '' ? 'auto' : val);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-center text-slate-200"
                            />
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(activeConfig.zIndex || '0') || 0;
                                  handleStyleChange('zIndex', String(current - 1));
                                }}
                                className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 rounded-lg text-xs"
                                title="إنقاص خطوة واحدة للأسفل"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(activeConfig.zIndex || '0') || 0;
                                  handleStyleChange('zIndex', String(current + 1));
                                }}
                                className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 rounded-lg text-xs"
                                title="زيادة خطوة واحدة للأعلى"
                              >
                                +1
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 📍 تحديد الموقع الدقيق للطبقة (Coordinates & Positioning) */}
                        <div className="space-y-3 pt-3 border-t border-slate-850">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-300">📍 تحديد الموقع المخصص للطبقة (Top, Left, Right, Bottom):</label>
                            <button
                              type="button"
                              onClick={() => {
                                handleStyleChange('top', '0px');
                                handleStyleChange('left', '0px');
                                handleStyleChange('right', 'auto');
                                handleStyleChange('bottom', 'auto');
                              }}
                              className="text-[9px] text-blue-400 hover:underline cursor-pointer"
                            >
                              تصفير الزوايا (0px, 0px)
                            </button>
                          </div>
                          
                          <p className="text-[9px] text-slate-500 leading-relaxed font-sans">
                            تمكنك هذه الحقول من كتابة أو تعديل إحداثيات ومكان الطبقة بالبكسل أو النسبة المئوية (مثال: 12px, 20%, auto).
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400 block">أعلى (Top):</span>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={activeConfig.top || ''}
                                  placeholder="تلقائي (auto)"
                                  onChange={(e) => handleStyleChange('top', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs font-mono text-slate-200 text-center"
                                  dir="ltr"
                                />
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = parseFloat(activeConfig.top || '0') || 0;
                                      handleStyleChange('top', `${parsed - 5}px`);
                                    }}
                                    className="px-1 text-[8px] bg-slate-850 text-slate-300 hover:text-white rounded"
                                    title="تقليل 5px"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = parseFloat(activeConfig.top || '0') || 0;
                                      handleStyleChange('top', `${parsed + 5}px`);
                                    }}
                                    className="px-1 text-[8px] bg-slate-850 text-slate-300 hover:text-white rounded"
                                    title="زيادة 5px"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400 block">أسفل (Bottom):</span>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={activeConfig.bottom || ''}
                                  placeholder="تلقائي (auto)"
                                  onChange={(e) => handleStyleChange('bottom', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs font-mono text-slate-200 text-center"
                                  dir="ltr"
                                />
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = parseFloat(activeConfig.bottom || '0') || 0;
                                      handleStyleChange('bottom', `${parsed + 5}px`);
                                    }}
                                    className="px-1 text-[8px] bg-slate-850 text-slate-300 hover:text-white rounded"
                                    title="زيادة 5px"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = parseFloat(activeConfig.bottom || '0') || 0;
                                      handleStyleChange('bottom', `${parsed - 5}px`);
                                    }}
                                    className="px-1 text-[8px] bg-slate-850 text-slate-300 hover:text-white rounded"
                                    title="تقليل 5px"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400 block">يسار (Left):</span>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={activeConfig.left || ''}
                                  placeholder="تلقائي (auto)"
                                  onChange={(e) => handleStyleChange('left', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs font-mono text-slate-200 text-center"
                                  dir="ltr"
                                />
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = parseFloat(activeConfig.left || '0') || 0;
                                      handleStyleChange('left', `${parsed - 5}px`);
                                    }}
                                    className="px-1 text-[8px] bg-slate-850 text-slate-300 hover:text-white rounded"
                                    title="تقليل 5px"
                                  >
                                    ◀
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = parseFloat(activeConfig.left || '0') || 0;
                                      handleStyleChange('left', `${parsed + 5}px`);
                                    }}
                                    className="px-1 text-[8px] bg-slate-850 text-slate-300 hover:text-white rounded"
                                    title="زيادة 5px"
                                  >
                                    ▶
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] text-slate-400 block">يمين (Right):</span>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={activeConfig.right || ''}
                                  placeholder="تلقائي (auto)"
                                  onChange={(e) => handleStyleChange('right', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs font-mono text-slate-200 text-center"
                                  dir="ltr"
                                />
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = parseFloat(activeConfig.right || '0') || 0;
                                      handleStyleChange('right', `${parsed + 5}px`);
                                    }}
                                    className="px-1 text-[8px] bg-slate-850 text-slate-300 hover:text-white rounded"
                                    title="زيادة 5px"
                                  >
                                    ◀
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = parseFloat(activeConfig.right || '0') || 0;
                                      handleStyleChange('right', `${parsed - 5}px`);
                                    }}
                                    className="px-1 text-[8px] bg-slate-850 text-slate-300 hover:text-white rounded"
                                    title="تقليل 5px"
                                  >
                                    ▶
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-slate-950 p-2 rounded-xl border border-slate-850 text-[9px] text-slate-405 flex justify-between items-center font-sans">
                            <span>هل تريد تفعيل الطبقات العائمة؟</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleStyleChange('position', 'absolute');
                              }}
                              className="text-purple-400 hover:underline font-bold cursor-pointer"
                            >
                              الموضع مطلق (Absolute) 💡
                            </button>
                          </div>
                        </div>

                        {/* 🌟 ميزة جعل الصورة كخلفية (Layer Underneath Option) */}
                        {selectedElement.tagName === 'IMG' && (
                          <div className="bg-blue-950/20 border border-blue-900/45 p-3.5 rounded-xl space-y-2.5 mt-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-xs font-bold text-slate-200">صناعة خلفيات مذهلة للطبقات</span>
                            </div>
                            <p className="text-[10px] text-slate-350 leading-relaxed">
                              هل ترغب في جعل هذه الصورة <strong className="text-blue-400">خلفية ممتدة (Layer Underneath)</strong> تحت النصوص والأزرار بالكامل داخل الطبقة الحاوية لها؟
                            </p>
                            
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleConvertImageToBackground(true)}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                  activeConfig.position === 'absolute' && activeConfig.zIndex && parseInt(activeConfig.zIndex) < 0
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                {activeConfig.position === 'absolute' && activeConfig.zIndex && parseInt(activeConfig.zIndex) < 0 
                                  ? '✓ مفعل كصورة خلفية' 
                                  : 'جعلها خلفية تحت كود العناصر'}
                              </button>

                              {(activeConfig.position === 'absolute' && activeConfig.zIndex && parseInt(activeConfig.zIndex) < 0) && (
                                <button
                                  type="button"
                                  onClick={() => handleConvertImageToBackground(false)}
                                  className="py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-850 hover:bg-slate-800 text-red-400 hover:text-red-300 transition"
                                  title="إلغاء وضع الخلفية واستعادة الوضع العادي"
                                >
                                  إلغاء
                                </button>
                              )}
                            </div>
                            
                            <p className="text-[9px] text-blue-300 border-t border-slate-800/60 pt-2 leading-snug">
                              * سيتم تصفير أحداث الماوس (Pointer Events) تلقائياً لتتمكن من التفاعل والضغط وتعديل الأزرار أو النصوص فوق الصورة بحرية كاملة. يمكنك دائماً تحديد هذه الصورة من خلال تبويبة شجرة العناصر (DOM) بالأعلى.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* محتويات التبويبة الثانية: إضافة عنصر جديد */}
            {activeTab === 'add' && (
              <div className="space-y-5">
                
                {/* شرح آركية ومكان الإضافة */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-blue-400" />
                    <p className="text-xs font-bold text-slate-200">آلية إدراج العناصر الجديدة</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    حدد موضع الإضافة بالنسبة للعنصر الذي قمت بتحديده داخل الصفحة أولاً، ثم اضغط على زر العنصر الذي ترغب به لإدراجه فوراً.
                  </p>
                  
                  {/* اختيار الموضع من الخيارات المتاحة */}
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-[10px] font-bold text-slate-400">موضع الإدراج النشط:</label>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-medium text-slate-300">
                      <button 
                        onClick={() => setInsertionMode('inside-end')}
                        className={`p-1.5 rounded transition ${insertionMode === 'inside-end' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        في نهاية العنصر
                      </button>
                      <button 
                        onClick={() => setInsertionMode('inside-start')}
                        className={`p-1.5 rounded transition ${insertionMode === 'inside-start' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        في بداية العنصر
                      </button>
                      <button 
                        onClick={() => setInsertionMode('after')}
                        className={`p-1.5 rounded transition ${insertionMode === 'after' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        مباشرة أسفل منه
                      </button>
                      <button 
                        onClick={() => setInsertionMode('before')}
                        className={`p-1.5 rounded transition ${insertionMode === 'before' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        مباشرة أعلى منه
                      </button>
                    </div>
                  </div>
                </div>

                {/* قائمة العناصر مقسمة بالمنفعة */}
                <div className="space-y-4">
                  
                  {/* قسم النصوص */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 mb-2 px-1">عناصر كتابية ونصوص</h3>
                    <div className="space-y-1.5">
                      {ELEMENT_SHORTCUTS.filter(s => s.category === 'text').map((shortcut) => (
                        <button
                          key={shortcut.name + shortcut.tag}
                          onClick={() => handleInsertElement(shortcut)}
                          className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-800 p-2.5 rounded-xl text-xs text-right text-slate-200 transition flex items-center justify-between"
                        >
                          <span className="font-semibold">{shortcut.name}</span>
                          <span className="text-[10px] translate-y-0.5 bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase leading-none">{shortcut.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* قسم الصناديق والأزرار */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 mb-2 px-1">صناديق روابط وأزرار</h3>
                    <div className="space-y-1.5">
                      {ELEMENT_SHORTCUTS.filter(s => s.category === 'container').map((shortcut) => (
                        <button
                          key={shortcut.name + shortcut.tag}
                          onClick={() => handleInsertElement(shortcut)}
                          className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-800 p-2.5 rounded-xl text-xs text-right text-slate-200 transition flex items-center justify-between"
                        >
                          <span className="font-semibold">{shortcut.name}</span>
                          <span className="text-[10px] translate-y-0.5 bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">{shortcut.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* قسم الوسائط والأدوات الأخرى */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 mb-2 px-1">وسائط وأدوات إضافية</h3>
                    <div className="space-y-1.5">
                      {ELEMENT_SHORTCUTS.filter(s => s.category !== 'text' && s.category !== 'container').map((shortcut) => (
                        <button
                          key={shortcut.name + shortcut.tag}
                          onClick={() => handleInsertElement(shortcut)}
                          className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-800 p-2.5 rounded-xl text-xs text-right text-slate-200 transition flex items-center justify-between"
                        >
                          <span className="font-semibold">{shortcut.name}</span>
                          <span className="text-[10px] translate-y-0.5 bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">{shortcut.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* محتويات التبويبة الثالثة: شجرة الكود وهيكلية الصفحة */}
            {activeTab === 'tree' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <p className="text-xs font-bold text-slate-200">هيكلية وشجرة عناصر الصفحة (DOM)</p>
                </div>

                {/* حقل تصفية شجرة المتصفح */}
                <div>
                  <input
                    type="text"
                    placeholder="ابحث عن عناصر معيّنة (مثل h1, p)..."
                    value={searchTreeQuery}
                    onChange={(e) => setSearchTreeQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300"
                  />
                </div>

                {/* شجرة العناصر الفعالة */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-2 overflow-y-auto max-h-[500px]">
                  {currentDomTree ? (
                    <div className="space-y-0.5">
                      {renderTreeNodes(currentDomTree)}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-10 leading-relaxed">يتطلب شجرة العناصر وجود وضع التعديل نشطاً لإجراء تتبع دائم.</p>
                  )}
                </div>
              </div>
            )}

            {/* محتويات التبويبة الرابعة: إدارة ملفات ومجلدات الموقع */}
            {activeTab === 'files' && (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-400" />
                    <p className="text-xs font-bold text-slate-200">ملفات ومجلدات الموقع المستوردة</p>
                  </div>
                  {websiteFiles.length > 0 && (
                    <button
                      onClick={handleCreateFile}
                      className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                      title="إنشاء ملف HTML أو CSS أو JS جديد"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ملف جديد</span>
                    </button>
                  )}
                </div>

                {/* 1. حالة عدم وجود ملفات مستوردة */}
                {websiteFiles.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-2">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-dashed border-slate-800 flex items-center justify-center mb-4 text-slate-450 mx-auto">
                      <FolderOpen className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 mb-1">استورد مجلد موقعك بالكامل</h3>
                    <p className="text-[10px] text-slate-500 max-w-[220px] leading-relaxed mb-6 mx-auto">
                      يمكنك استيراد مجلد كامل يحتوي على صفحات الويب (.html) والملفات المرافقة للتعديل عليها بالكامل وربط المسارات.
                    </p>
                    
                    <input
                      type="file"
                      ref={folderInputRef}
                      onChange={handleFolderUpload}
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => folderInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-lg shadow-indigo-950/40 flex items-center gap-1.5 mx-auto"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>اختر مجلد الموقع من جهازك</span>
                    </button>
                  </div>
                ) : (
                  // 2. حالة وجود ملفات مستوردة
                  <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                    
                    {/* معلومات المجلد الفعال */}
                    <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-3 flex items-center justify-between">
                      <div className="truncate text-right w-[70%]">
                        <p className="text-[10px] text-slate-400 font-sans truncate">اسم المجلد المستورد:</p>
                        <p className="text-xs font-bold text-indigo-300 truncate mt-0.5 font-mono">{uploadedFileName}</p>
                      </div>
                      <div className="shrink-0 text-left">
                        <span className="bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono">
                          {websiteFiles.length} ملفات
                        </span>
                      </div>
                    </div>

                    {/* زر تحميل المشروع كامل */}
                    <button
                      onClick={downloadWebsiteZip}
                      className="w-full bg-linear-to-l from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer active:scale-[0.98] shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل الموقع كاملاً كـ ZIP 📦</span>
                    </button>

                    {/* محرر الأكواد الداخلي النشط لغير الـ HTML */}
                    {isEditingCode && activeFile && (
                      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3 space-y-2 flex flex-col shrink-0">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
                          <p className="text-[10px] text-slate-300 flex items-center gap-1 font-bold">
                            <Code className="w-3 h-3 text-indigo-400" />
                            <span>تعديل كود: <span className="text-indigo-400 font-mono">{activeFile.name}</span></span>
                          </p>
                          <button
                            onClick={() => setIsEditingCode(false)}
                            className="text-slate-500 hover:text-slate-350 text-[10px] cursor-pointer"
                          >
                            إغلاق ❌
                          </button>
                        </div>
                        <textarea
                          value={editingCode}
                          onChange={(e) => setEditingCode(e.target.value)}
                          className="w-full h-44 bg-slate-950 text-slate-200 border-0 outline-none font-mono text-[11px] leading-relaxed p-1 resize-y"
                          dir="ltr"
                          placeholder="اكتب الكود البرمجي هنا..."
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleSaveFileCode}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg cursor-pointer transition text-center"
                          >
                            {isSavedFeedback ? 'تم الحفظ بنجاح! ✓' : 'حفظ كود الملف 💾'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingCode(activeFile.content);
                              setIsSavedFeedback(false);
                            }}
                            className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition"
                          >
                            تراجع
                          </button>
                        </div>
                      </div>
                    )}

                    {/* قائمة الملفات */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 px-1 text-right">شجرة ملفات الـ HTML والـ Assets:</p>
                      {websiteFiles.map((file) => {
                        const isActive = activeFile?.path === file.path;
                        const isHtml = file.type === 'html';
                        const isCss = file.type === 'css';
                        const isJs = file.type === 'js';

                        return (
                          <div
                            key={file.path}
                            className={`group/file flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isActive
                                ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200'
                                : 'bg-slate-900/35 border-slate-850/60 text-slate-350 hover:bg-slate-900/60 hover:text-slate-100'
                            }`}
                          >
                            <button
                              onClick={() => handleSwitchFile(file)}
                              className="flex-1 text-right truncate flex items-center gap-2 cursor-pointer"
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                isHtml ? 'bg-orange-950/40 text-orange-400' :
                                isCss ? 'bg-blue-950/40 text-blue-400' :
                                isJs ? 'bg-yellow-950/40 text-yellow-400' :
                                'bg-slate-950/40 text-slate-400'
                              }`}>
                                {isHtml ? <Code className="w-3.5 h-3.5" /> :
                                 isCss ? <Sliders className="w-3.5 h-3.5" /> :
                                 isJs ? <Sparkles className="w-3.5 h-3.5" /> :
                                 <FileCode className="w-3.5 h-3.5" />}
                              </div>
                              <div className="truncate text-right">
                                <p className="text-[11px] font-bold truncate font-sans">{file.name}</p>
                                <p className="text-[8px] text-slate-500 font-mono truncate direction-ltr" dir="ltr">{file.path}</p>
                              </div>
                            </button>

                            {/* مؤشر نشط أو أدوات التحكم */}
                            <div className="flex items-center gap-1 shrink-0">
                              {isActive && (
                                <span className="bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded-md text-[8px] font-bold font-sans ml-1.5">
                                  {isHtml ? 'نشط 🎨' : 'تعديل ⚙️'}
                                </span>
                              )}
                              
                              <button
                                onClick={() => handleRenameFile(file)}
                                className="opacity-0 group-hover/file:opacity-100 text-slate-500 hover:text-indigo-400 p-1 rounded transition cursor-pointer"
                                title="إعادة تسمية الملف"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteFile(file)}
                                className="opacity-0 group-hover/file:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
                                title="حذف الملف"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* تلميح للاستخدام */}
                    <div className="bg-slate-900/20 border border-slate-900/60 rounded-xl p-2.5 text-[9px] text-slate-400 leading-normal font-sans text-right">
                      💡 <b>نصيحة للمطورين:</b> يمكنك التبديل بين صفحات الـ HTML لتعديلها بصرياً وتصميمها، بينما ملفات الـ CSS والـ JS المستوردة يتم حقنها فورياً وبشكل مرن بالصفحة لتشغيل المؤثرات والأنماط!
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* 💻 المتصفح والسطح التفاعلي الفرداني ( الأيسر) */}
        <main className="flex-1 bg-slate-900 flex flex-col p-6 overflow-hidden">
          
          {/* محاكي المتصفح العلوي */}
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-2xl border-t border-x border-slate-800 gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
            </div>
            
            <div className="flex-1 max-w-xl bg-slate-900 px-4 py-1 rounded-xl text-center text-xs text-slate-400 truncate direction-ltr flex items-center justify-center gap-2 border border-slate-800">
              <span className="text-slate-500 text-[10px]">https://</span>
              <span className="font-mono text-[11px] text-slate-350 truncate">{uploadedFileName || 'visual-editor-workspace.html'}</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold shrink-0">
              <span className="bg-slate-900 border border-slate-800/80 px-2 py-1 rounded-lg">وضع التعديل: {isEditMode ? 'مفتوح 🔓' : 'مغلق 🔒'}</span>
            </div>
          </div>

          {/* مساحة الـ Iframe التفاعلي والمسند إليه أبعاد الشاشات */}
          <div className="flex-1 w-full flex items-center justify-center bg-slate-900/40 border-b border-x border-slate-800 p-2 sm:p-5 overflow-auto rounded-b-2xl">
            <div 
              className={`h-full bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 relative ${
                currentDevice === 'tablet' 
                  ? 'w-[768px]' 
                  : currentDevice === 'mobile' 
                  ? 'w-[390px]'
                  : 'w-full'
              }`}
            >
              {!htmlContent && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-950 text-slate-100 z-50">
                  <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20 text-4xl">
                    🌟
                  </div>
                  <h3 className="text-xl font-bold mb-3">أهلاً بك في محرر ومُنظّم المواقع المرئي</h3>
                  <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
                    منصة مرئية بالكامل تتيح لك رفع وتعديل أي ملف HTML دون كتابة أي سطر كود، كما تدعم القوالب العصرية المعدّة لك سلفاً.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => loadTemplate(templates[0])}
                      className="bg-blue-600 hover:bg-blue-705 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
                    >
                      البدء بقالب افتراضي مذهل
                    </button>
                    <button 
                      onClick={triggerDragUpload}
                      className="bg-slate-800 hover:bg-slate-705 text-slate-205 border border-slate-700 font-semibold px-6 py-3 rounded-xl text-sm transition"
                    >
                      رفع ملف من الحاسوب
                    </button>
                  </div>
                </div>
              )}

              <iframe
                ref={iframeRef}
                className="w-full h-full bg-white"
                title="لوحة المعاينة والتصميم المرئي للمواقع والصفحات"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
