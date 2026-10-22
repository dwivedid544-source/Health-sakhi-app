import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Play, Star, Users, Volume2, VolumeX, Globe, Check, Headphones, ChevronRight } from 'lucide-react-native';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import apiClient, { API_BASE_URL } from '../api/apiClient';
import { COLORS, SPACING, SHADOWS } from '../theme/theme';
import { WebView } from 'react-native-webview';
import { parseContentAssetMetadata, normalizeChapterItem } from '../utils/assetParser';

const BOOKS_CHAPTER_MAPPING = {
  1: ['Phase 1: Menstrual Flow & Rest', 'Phase 2: Follicular Energy & Bloom', 'Phase 3: Ovulatory Vitality', 'Phase 4: Luteal Balance', 'The HealthSakhi Way to Total Health'],
  2: ['Morning Self-Care & Natural Radiance', 'Holistic Hair & Scalp Care Rituals', 'Skin Nutrition & Herbal Remedies', 'Evening Rejuvenation & Detox', 'Timeless Wellness Practices'],
  3: ['Understanding Solitude & Inner Peace', 'The Power of Self-Dialogue & Awareness', 'Building Emotional Anchors', 'Connecting Outward with Confidence', 'Sustained Mental Well-being'],
  4: ['Understanding PCOD & Hormonal Health', 'The Insulin & Metabolic Connection', 'Dietary Protocols for Balance', 'Movement & Lifestyle as Medicine', 'Long-term Wellness & Vitality'],
  5: ['The Neuroscience of Human Connection', 'Understanding Attraction & Chemistry', 'Building Deep Emotional Intimacy', 'Biological Anchors & Relationship Health', 'Sustaining Mutual Bonds'],
  6: ['The Verse of Self-Discovery', 'Emotional Nuances & Inner Harmony', 'Strength in Softness & Resilience', 'The Narrative of Womanhood', 'Living with Grace & Purpose']
};

const generateDynamicChapters = (title = '', category = '', rawChapters = [], bookId = null) => {
  if (bookId && BOOKS_CHAPTER_MAPPING[bookId]) {
    return BOOKS_CHAPTER_MAPPING[bookId];
  }

  if (Array.isArray(rawChapters) && rawChapters.length > 0 && typeof rawChapters[0] === 'string' && !rawChapters[0].toLowerCase().includes('chapter 1: introduction')) {
    return rawChapters;
  }

  const t = (title || '').toLowerCase();

  if (t.includes('child development') || t.includes('parenting') || t.includes('beyond parenting') || t.includes('child')) {
    return [
      'Understanding Child Development (Ages 2-10)',
      'Building Emotional Intelligence & Resilience',
      'Physical Health & Nutritional Guidance',
      'Positive Communication & Daily Habits',
      'Nurturing Growth & Future Potential'
    ];
  }

  if (t.includes('beauty') || t.includes('parlour') || t.includes('skin') || t.includes('hair')) {
    return [
      'Morning Self-Care & Natural Radiance',
      'Holistic Hair & Scalp Care Rituals',
      'Skin Nutrition & Herbal Remedies',
      'Evening Rejuvenation & Detox',
      'Timeless Wellness Practices'
    ];
  }

  if (t.includes('loneliness') || t.includes('mind') || t.includes('peace') || t.includes('mental')) {
    return [
      'Understanding Solitude & Inner Peace',
      'The Power of Self-Dialogue & Awareness',
      'Building Emotional Anchors',
      'Connecting Outward with Confidence',
      'Sustained Mental Well-being'
    ];
  }

  if (t.includes('pcod') || t.includes('pcos') || t.includes('hormon')) {
    return [
      'Understanding PCOD & Hormonal Health',
      'The Insulin & Metabolic Connection',
      'Dietary Protocols for Balance',
      'Movement & Lifestyle as Medicine',
      'Long-term Wellness & Vitality'
    ];
  }

  if (t.includes('desire') || t.includes('relation') || t.includes('intimacy') || t.includes('love') || t.includes('shaadi') || t.includes('shadi')) {
    return [
      'The Neuroscience of Human Connection',
      'Understanding Attraction & Chemistry',
      'Building Deep Emotional Intimacy',
      'Biological Anchors & Relationship Health',
      'Sustaining Mutual Bonds'
    ];
  }

  if (t.includes('poem') || t.includes('woman') || t.includes('grace')) {
    return [
      'The Verse of Self-Discovery',
      'Emotional Nuances & Inner Harmony',
      'Strength in Softness & Resilience',
      'The Narrative of Womanhood',
      'Living with Grace & Purpose'
    ];
  }

  if (t.includes('monthly') || t.includes('wellness') || t.includes('cycle')) {
    return [
      'Phase 1: Menstrual Flow & Rest',
      'Phase 2: Follicular Energy & Bloom',
      'Phase 3: Ovulatory Vitality',
      'Phase 4: Luteal Balance',
      'The HealthSakhi Way to Total Health'
    ];
  }

  const cleanTitle = title || 'HealthSakhi Guide';
  return [
    `Introduction to ${cleanTitle}`,
    `Core Foundations & Health Insights`,
    `Practical Strategies for ${category || 'Well-being'}`,
    `Daily Rituals & Lifestyle Integration`,
    `Summary & Long-term Growth`
  ];
};

const getPdfReaderHtml = (pdfUrl, initialPage, langCode, apiBaseUrl, isTranslationNeeded) => {
  const startPage = initialPage > 0 ? initialPage : 1;
  const currentLang = langCode || 'en';
  const apiBase = apiBaseUrl || 'https://health-sakhi-production.up.railway.app/api/v1';
  const transNeeded = isTranslationNeeded ? 'true' : 'false';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #FAF5F5;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          align-items: center;
        }
        #canvas-container {
          flex: 1;
          width: 100%;
          height: 0;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          background-color: #FAF5F5;
        }
        canvas {
          max-width: 100%;
          max-height: 95%;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          background-color: white;
          border: 1px solid #F3E8FF;
        }
        #text-container {
          width: 100%;
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          padding: 24px;
          box-sizing: border-box;
          background-color: white;
          border-radius: 12px;
          border: 1px solid #F3E8FF;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          font-size: 16px;
          line-height: 2.0;
          color: #334155;
          text-align: justify;
          white-space: pre-wrap;
        }
        #controls {
          width: 100%;
          background-color: white;
          border-top: 1px solid #F3E8FF;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 16px;
          box-sizing: border-box;
          box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.02);
          gap: 8px;
        }
        #pagination-row {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          height: 48px;
        }
        #audio-player-row {
          display: none;
          width: 100%;
          align-items: center;
          gap: 12px;
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          padding: 8px 16px;
          border-radius: 16px;
          box-sizing: border-box;
          height: 48px;
        }
        button {
          background-color: #EC4899;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(236, 72, 153, 0.2);
          transition: all 0.2s ease;
          text-transform: uppercase;
        }
        button:active {
          transform: scale(0.95);
        }
        button:disabled {
          background-color: #E2E8F0;
          color: #94A3B8;
          box-shadow: none;
          pointer-events: none;
        }
        #audio-btn-stop {
          background-color: #EF4444;
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
        }
        #audio-slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: #E2E8F0;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }
        #audio-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #6BCB77;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #audio-time {
          font-size: 10px;
          font-weight: 850;
          color: #94A3B8;
          font-family: monospace;
          min-w: 68px;
          text-align: right;
        }
        #page-info {
          font-size: 11px;
          color: #4A044E;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        #loading {
          position: absolute;
          top: 45%;
          font-size: 16px;
          color: #EC4899;
          font-weight: 800;
          letter-spacing: 1px;
          z-index: 100;
        }
      </style>
    </head>
    <body>
      <div id="loading">LOADING BOOK PAGES...</div>
      <div id="canvas-container">
        <canvas id="pdf-canvas"></canvas>
        <div id="text-container" style="display: none;"></div>
      </div>
      <div id="controls">
        <div id="audio-player-row">
          <button id="audio-btn-stop" onclick="stopAudio()">⏹ STOP LISTENING</button>
          <input type="range" id="audio-slider" min="0" max="100" value="0" oninput="onSliderInput(this.value)" onchange="onSliderChange(this.value)" />
          <span id="audio-time">0:00 / 0:00</span>
        </div>
        <div id="pagination-row">
          <button id="prev-btn" onclick="onPrevPage()" disabled>PREV</button>
          <button id="inline-listen-btn" onclick="toggleAudio()">🎧 LISTEN</button>
          <div id="page-info">PAGE <span id="page-num">0</span> OF <span id="page-count">0</span></div>
          <button id="next-btn" onclick="onNextPage()" disabled>NEXT</button>
        </div>
      </div>
      <audio id="webview-audio-player" style="display: none;"></audio>

      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        let pdfDoc = null;
        let docxPages = [];
        let pageNum = ${startPage};
        let pageRendering = false;
        let pageNumPending = null;
        let canvas = document.getElementById('pdf-canvas');
        let ctx = canvas.getContext('2d');
        
        let targetLang = "${currentLang}";
        let currentTextForAudio = "";
        let isAudioPlaying = false;
        const isTranslationNeeded = ${transNeeded};

        const docUrl = "${pdfUrl}";
        const isDocx = docUrl.toLowerCase().indexOf('.docx') !== -1 || docUrl.toLowerCase().indexOf('.doc') !== -1;

        window.onTtsPlaybackEnded = function() {
          isAudioPlaying = false;
          
          const playerRow = document.getElementById('audio-player-row');
          const inlineListenBtn = document.getElementById('inline-listen-btn');
          if (playerRow) playerRow.style.display = 'none';
          if (inlineListenBtn) inlineListenBtn.style.display = 'inline-block';
          
          const slider = document.getElementById('audio-slider');
          if (slider) {
            slider.value = 0;
            slider.style.background = '#E2E8F0';
          }
          const timeLabel = document.getElementById('audio-time');
          if (timeLabel) timeLabel.textContent = '0:00 / 0:00';
        };

        window.onTtsProgress = function(currentTime, duration) {
          isAudioPlaying = true;
          
          const playerRow = document.getElementById('audio-player-row');
          const inlineListenBtn = document.getElementById('inline-listen-btn');
          if (playerRow && playerRow.style.display === 'none') {
            playerRow.style.display = 'flex';
          }
          if (inlineListenBtn && inlineListenBtn.style.display !== 'none') {
            inlineListenBtn.style.display = 'none';
          }

          const stopBtn = document.getElementById('audio-btn-stop');
          if (stopBtn && stopBtn.textContent !== '⏹ STOP LISTENING') {
            stopBtn.textContent = '⏹ STOP LISTENING';
            stopBtn.style.backgroundColor = '#EF4444';
          }

          const slider = document.getElementById('audio-slider');
          if (slider) {
            slider.max = duration || 100;
            slider.value = currentTime;
            
            const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
            slider.style.background = \`linear-gradient(to right, #6BCB77 0%, #6BCB77 \${pct}%, #E2E8F0 \${pct}%, #E2E8F0 100%)\`;
          }

          const timeLabel = document.getElementById('audio-time');
          if (timeLabel) {
            const formatTime = (secs) => {
              if (isNaN(secs) || secs === Infinity) return '0:00';
              const m = Math.floor(secs / 60);
              const s = Math.floor(secs % 60);
              return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
            };
            timeLabel.textContent = \`\${formatTime(currentTime)} / \${formatTime(duration)}\`;
          }
        };

        function stopAudio() {
          isAudioPlaying = false;
          window.onTtsPlaybackEnded();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'STOP_TTS'
          }));
        }

        function toggleAudio() {
          if (!currentTextForAudio || currentTextForAudio.length < 5) {
            alert('Please wait, page text content is loading...');
            return;
          }

          isAudioPlaying = true;
          
          const playerRow = document.getElementById('audio-player-row');
          const inlineListenBtn = document.getElementById('inline-listen-btn');
          if (playerRow) playerRow.style.display = 'flex';
          if (inlineListenBtn) inlineListenBtn.style.display = 'none';
          
          const stopBtn = document.getElementById('audio-btn-stop');
          if (stopBtn) {
            stopBtn.textContent = '⏳ LOADING...';
            stopBtn.style.backgroundColor = '#94A3B8';
          }

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PLAY_TTS',
            text: currentTextForAudio,
            lang: targetLang
          }));
        }

        function onSliderInput(value) {
          const slider = document.getElementById('audio-slider');
          const maxVal = parseFloat(slider.max) || 100;
          const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
          slider.style.background = \`linear-gradient(to right, #6BCB77 0%, #6BCB77 \${pct}%, #E2E8F0 \${pct}%, #E2E8F0 100%)\`;
          
          const timeLabel = document.getElementById('audio-time');
          if (timeLabel) {
            const formatTime = (secs) => {
              if (isNaN(secs) || secs === Infinity) return '0:00';
              const m = Math.floor(secs / 60);
              const s = Math.floor(secs % 60);
              return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
            };
            timeLabel.textContent = \`\${formatTime(parseFloat(value))} / \${formatTime(maxVal)}\`;
          }
        }

        function onSliderChange(value) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SEEK_TTS',
            time: parseFloat(value)
          }));
        }

        window.onTranslationResult = function(translatedText) {
          document.getElementById('loading').style.display = 'none';
          if (isDocx) {
            renderDocxPageContent(window.currentPageNum, translatedText);
          } else {
            renderPageContent(window.currentPageObj, window.currentPageNum, translatedText);
          }
        };

        function renderPage(num) {
          pageRendering = true;
          document.getElementById('page-num').textContent = num;
          stopAudio();
          
          pdfDoc.getPage(num).then((page) => {
            window.currentPageObj = page;
            window.currentPageNum = num;
            if (isTranslationNeeded) {
              document.getElementById('loading').textContent = 'TRANSLATING PAGE...';
              document.getElementById('loading').style.display = 'block';
              
              page.getTextContent().then((textContent) => {
                let rawText = textContent.items
                  .map(item => item.str)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                
                if (rawText.length < 10) {
                  document.getElementById('loading').style.display = 'none';
                  renderPageContent(page, num, "");
                } else {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'TRANSLATE_TEXT',
                    text: rawText,
                    lang: targetLang
                  }));
                }
              });
            } else {
              document.getElementById('loading').style.display = 'none';
              renderPageContent(page, num, "");
            }
          });

          // Update button states
          document.getElementById('prev-btn').disabled = (num <= 1);
          if (num >= pdfDoc.numPages) {
            document.getElementById('next-btn').textContent = 'FINISH';
            document.getElementById('next-btn').disabled = false;
          } else {
            document.getElementById('next-btn').textContent = 'NEXT';
            document.getElementById('next-btn').disabled = false;
          }
        }

        function renderPageContent(page, num, translatedText) {
          let canvas = document.getElementById('pdf-canvas');
          let textDiv = document.getElementById('text-container');
          
          if (translatedText) {
            canvas.style.display = 'none';
            textDiv.style.display = 'block';
            textDiv.innerHTML = translatedText;
            currentTextForAudio = translatedText;
            
            pageRendering = false;
            if (pageNumPending !== null) {
              renderPage(pageNumPending);
              pageNumPending = null;
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAGE_CHANGE',
              current: num
            }));
          } else {
            canvas.style.display = 'block';
            textDiv.style.display = 'none';
            
            let viewport = page.getViewport({ scale: 2.0 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            let renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };
            let renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
              pageRendering = false;
              if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
              }
              page.getTextContent().then((textContent) => {
                currentTextForAudio = textContent.items
                  .map(item => item.str)
                  .join(' ')
                  .replace(/\s+/g, ' ')
                  .trim();
              });

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAGE_CHANGE',
                current: num
              }));
            });
          }
        }

        function renderDocxPage(num) {
          pageRendering = true;
          document.getElementById('page-num').textContent = num;
          stopAudio();

          const pageHtml = docxPages[num - 1] || 'No content';
          window.currentPageHtmlContent = pageHtml;
          window.currentPageNum = num;

          if (isTranslationNeeded) {
            document.getElementById('loading').textContent = 'TRANSLATING PAGE...';
            document.getElementById('loading').style.display = 'block';

            // Get plain text of the html for translation API
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = pageHtml;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";

            if (plainText.length < 10) {
              document.getElementById('loading').style.display = 'none';
              renderDocxPageContent(num, pageHtml);
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'TRANSLATE_TEXT',
                text: plainText,
                lang: targetLang
              }));
            }
          } else {
            document.getElementById('loading').style.display = 'none';
            renderDocxPageContent(num, pageHtml);
          }

          // Update button states
          document.getElementById('prev-btn').disabled = (num <= 1);
          if (num >= docxPages.length) {
            document.getElementById('next-btn').textContent = 'FINISH';
            document.getElementById('next-btn').disabled = false;
          } else {
            document.getElementById('next-btn').textContent = 'NEXT';
            document.getElementById('next-btn').disabled = false;
          }
        }

        function renderDocxPageContent(num, pageHtml) {
          let canvas = document.getElementById('pdf-canvas');
          let textDiv = document.getElementById('text-container');

          canvas.style.display = 'none';
          textDiv.style.display = 'block';
          textDiv.innerHTML = pageHtml;

          // Strip HTML tags for audio text
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = pageHtml;
          currentTextForAudio = tempDiv.textContent || tempDiv.innerText || "";

          pageRendering = false;
          if (pageNumPending !== null) {
            renderDocxPage(pageNumPending);
            pageNumPending = null;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAGE_CHANGE',
            current: num
          }));
        }

        function queueRenderPage(num) {
          if (pageRendering) {
            pageNumPending = num;
          } else {
            renderPage(num);
          }
        }

        function queueRenderDocxPage(num) {
          if (pageRendering) {
            pageNumPending = num;
          } else {
            renderDocxPage(num);
          }
        }

        function onPrevPage() {
          if (pageNum <= 1) return;
          pageNum--;
          if (isDocx) {
            queueRenderDocxPage(pageNum);
          } else {
            queueRenderPage(pageNum);
          }
        }

        function onNextPage() {
          const total = isDocx ? docxPages.length : pdfDoc.numPages;
          if (pageNum >= total) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'COMPLETED'
            }));
            return;
          }
          pageNum++;
          if (isDocx) {
            queueRenderDocxPage(pageNum);
          } else {
            queueRenderPage(pageNum);
          }
        }

        const parseDocxXmlToPages = (xmlText) => {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            const rawPages = [];
            let currentPageHtml = '';

            const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));

            paragraphs.forEach((p) => {
              const pPr = p.getElementsByTagName('w:pPr')[0];
              let pAlign = 'left';
              let borderStyle = '';

              if (pPr) {
                const jc = pPr.getElementsByTagName('w:jc')[0];
                if (jc) pAlign = jc.getAttribute('w:val') || 'left';

                const pBdr = pPr.getElementsByTagName('w:pBdr')[0];
                if (pBdr) {
                  const bottom = pBdr.getElementsByTagName('w:bottom')[0];
                  if (bottom) {
                    const bColor = bottom.getAttribute('w:color') || 'A82E4E';
                    const hexColor = bColor === 'auto' ? '#A82E4E' : '#' + bColor;
                    borderStyle += 'border-bottom: 1.5px solid ' + hexColor + '; padding-bottom: 0.5rem; margin-bottom: 0.75rem;';
                  }
                  const top = pBdr.getElementsByTagName('w:top')[0];
                  if (top) {
                    const tColor = top.getAttribute('w:color') || 'A82E4E';
                    const hexColor = tColor === 'auto' ? '#A82E4E' : '#' + tColor;
                    borderStyle += 'border-top: 1.5px solid ' + hexColor + '; padding-top: 0.5rem; margin-top: 0.75rem;';
                  }
                }
              }

              let breakAfter = false;
              const brs = Array.from(p.getElementsByTagName('w:br'));
              for (let b of brs) {
                if (b.getAttribute('w:type') === 'page') {
                  breakAfter = true;
                }
              }
              if (p.getElementsByTagName('w:lastRenderedPageBreak').length > 0) {
                breakAfter = true;
              }

              let pContentHtml = '';
              let plainText = '';

              const children = Array.from(p.childNodes);
              children.forEach((child) => {
                if (child.nodeName === 'w:r') {
                  const rPr = child.getElementsByTagName('w:rPr')[0];
                  let color = null;
                  let fontSize = null;
                  let font = null;
                  let isBold = false;
                  let isItalic = false;

                  if (rPr) {
                    const colorEl = rPr.getElementsByTagName('w:color')[0];
                    if (colorEl) color = colorEl.getAttribute('w:val');

                    const szEl = rPr.getElementsByTagName('w:sz')[0];
                    if (szEl) {
                      const val = parseInt(szEl.getAttribute('w:val'));
                      if (!isNaN(val)) fontSize = (val / 2).toFixed(1);
                    }

                    const fontEl = rPr.getElementsByTagName('w:rFonts')[0];
                    if (fontEl) font = fontEl.getAttribute('w:ascii') || fontEl.getAttribute('w:hAnsi');

                    if (rPr.getElementsByTagName('w:b').length > 0) isBold = true;
                    if (rPr.getElementsByTagName('w:i').length > 0) isItalic = true;
                  }

                  const tEls = child.getElementsByTagName('w:t');
                  let runText = '';
                  for (let t of Array.from(tEls)) {
                    runText += t.textContent;
                  }

                  if (runText) {
                    plainText += runText;
                    let styleStr = '';
                    if (color && color !== 'auto') styleStr += 'color: #' + color + ';';
                    if (fontSize) styleStr += 'font-size: ' + fontSize + 'pt;';
                    if (font) styleStr += 'font-family: "' + font + '", Georgia, serif;';
                    if (isBold) styleStr += 'font-weight: bold;';
                    if (isItalic) styleStr += 'font-style: italic;';

                    pContentHtml += '<span style="' + styleStr + '">' + runText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
                  }
                }
              });

              const trimmedPlain = plainText.trim();
              const isDedication = trimmedPlain.toLowerCase() === 'dedication' || trimmedPlain.toLowerCase().startsWith('dedication');

              if (isDedication && currentPageHtml.trim()) {
                rawPages.push(currentPageHtml);
                currentPageHtml = '';
              }

              if (pContentHtml.trim()) {
                let alignStyle = pAlign === 'center' ? 'text-align: center;' : pAlign === 'right' ? 'text-align: right;' : pAlign === 'justify' ? 'text-align: justify;' : 'text-align: left;';

                let extraLine = '';
                if (isDedication) {
                  extraLine = '<hr style="border: 0; border-top: 1.5px solid #A82E4E; margin: 0.75rem auto 1.25rem auto; width: 90%; opacity: 0.85;" />';
                } else if (trimmedPlain.includes('www.HealthSakhi.com')) {
                  borderStyle = 'border-top: 1px solid #fecdd3; border-bottom: 1px solid #fecdd3; padding: 0.35rem 0; margin: 0.75rem 0;';
                }

                currentPageHtml += '<p style="' + alignStyle + ' ' + borderStyle + ' margin-bottom: 0.75rem; line-height: 1.8;">' + pContentHtml + '</p>' + extraLine;
              }

              if (breakAfter && !isDedication && currentPageHtml.trim()) {
                rawPages.push(currentPageHtml);
                currentPageHtml = '';
              }
            });

            if (currentPageHtml.trim()) {
              rawPages.push(currentPageHtml);
            }

            const finalPages = rawPages.map(pageHtml => {
              const topHeader = '<div style="display: flex; align-items: center; justify-content: center; font-size: 9.5pt; color: #A82E4E; font-family: Georgia, serif; border-bottom: 1px solid #fecdd3; padding-bottom: 0.35rem; margin-bottom: 1.25rem; letter-spacing: 0.05em;">Heart to Heart ✦ HealthSakhi</div>';
              return topHeader + pageHtml;
            });

            return finalPages;
          } catch (err) {
            console.error('[BookScreen] XML parse error:', err);
            return [];
          }
        };

        const parseDocxToPages = async (fileUrl) => {
          try {
            const response = await fetch(fileUrl);
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();

            try {
              const zip = await JSZip.loadAsync(arrayBuffer);
              const docXmlFile = zip.file("word/document.xml");
              if (docXmlFile) {
                const xmlText = await docXmlFile.async("text");
                const xmlPages = parseDocxXmlToPages(xmlText);
                if (xmlPages && xmlPages.length > 0) {
                  return xmlPages;
                }
              }
            } catch (zipErr) {
              console.warn('[BookScreen] XML parsing fallback to mammoth:', zipErr);
            }

            // Mammoth fallback if XML parsing fails
            const options = {
              convertImage: mammoth.images.inline((element) => {
                return element.read("base64").then((imageBuffer) => {
                  return {
                    src: "data:" + element.contentType + ";base64," + imageBuffer
                  };
                });
              })
            };

            const result = await mammoth.convertToHtml({ arrayBuffer }, options);
            const fullHtml = result.value;

            if (!fullHtml || !fullHtml.trim()) return null;

            const parser = new DOMParser();
            const doc = parser.parseFromString(fullHtml, 'text/html');
            const childNodes = Array.from(doc.body.childNodes);

            const pages = [];
            let currentPageHtml = '';
            let currentParagraphCount = 0;

            childNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const outer = node.outerHTML;
                currentPageHtml += outer;
                
                if (node.nodeName === 'P' || node.nodeName.startsWith('H')) {
                  currentParagraphCount++;
                  if (currentParagraphCount >= 6) {
                    pages.push(currentPageHtml);
                    currentPageHtml = '';
                    currentParagraphCount = 0;
                  }
                }
              }
            });

            if (currentPageHtml.trim()) {
              pages.push(currentPageHtml);
            }

            return pages.map(pHtml => {
              const topHeader = '<div style="display: flex; align-items: center; justify-content: center; font-size: 9.5pt; color: #A82E4E; font-family: Georgia, serif; border-bottom: 1px solid #fecdd3; padding-bottom: 0.35rem; margin-bottom: 1.25rem; letter-spacing: 0.05em;">Heart to Heart ✦ HealthSakhi</div>';
              return topHeader + pHtml;
            });
          } catch (err) {
            console.error('Failed to parse docx:', err);
            return null;
          }
        };

        if (isDocx) {
          document.getElementById('loading').textContent = 'PARSING WORD DOCUMENT...';
          parseDocxToPages(docUrl).then((pages) => {
            if (pages && pages.length > 0) {
              docxPages = pages;
              const total = docxPages.length;
              document.getElementById('page-count').textContent = total;
              document.getElementById('loading').style.display = 'none';
              renderDocxPage(pageNum);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'LOADED',
                total: total,
                current: pageNum
              }));
            } else {
              document.getElementById('loading').textContent = 'Error parsing DOCX file';
            }
          }).catch((err) => {
            document.getElementById('loading').textContent = 'Error loading DOCX: ' + err.message;
          });
        } else {
          pdfjsLib.getDocument(docUrl).promise.then((pdfDoc_) => {
            pdfDoc = pdfDoc_;
            const total = pdfDoc.numPages;
            document.getElementById('page-count').textContent = total;
            document.getElementById('loading').style.display = 'none';
            renderPage(pageNum);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'LOADED',
              total: total,
              current: pageNum
            }));
          }).catch((err) => {
            document.getElementById('loading').textContent = 'Error loading PDF: ' + err.message;
          });
        }
      </script>
    </body>
    </html>
  `;
};

function BookCoverImage({ uri, initials, style }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error || !uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF5FF' }]}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.primary }}>{initials}</Text>
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }]}>
      <Image
        source={{ uri, cache: 'force-cache' }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setError(true)}
      />
      {loading && (
        <ActivityIndicator
          style={{ position: 'absolute' }}
          color={COLORS.secondary}
          size="small"
        />
      )}
    </View>
  );
}

export default function BookDetailScreen({ route, navigation }) {
  const { bookId, book: passedBook } = route.params || {};
  const { langCode, setLanguage } = useLanguage();
  const [book, setBook] = useState(passedBook || null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [readingMode, setReadingMode] = useState(false);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [translating, setTranslating] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [currentLang, setCurrentLang] = useState(langCode);
  const [translationNeeded, setTranslationNeeded] = useState(false);

  // Book content pages from compiled JSON
  const [bookData, setBookData] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);
  const [showPdfReader, setShowPdfReader] = useState(false);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [pdfInitialPage, setPdfInitialPage] = useState(1);
  const [activeTtsUrl, setActiveTtsUrl] = useState(null);
  const [availableLangs, setAvailableLangs] = useState(['en']);
  const [variantsMap, setVariantsMap] = useState({});
  const readerWebViewRef = useRef(null);
  const ttsWebViewRef = useRef(null);

  const cleanHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  const requestSeqRef = useRef(0);

  const loadBookData = async (lang, seqId) => {
    if (!bookId) return false;
    const currentSeq = seqId || requestSeqRef.current;
    setLoading(true);
    setTranslating(false);

    try {
      const apiRes = await apiClient.get(`/content-assets/${bookId}`);
      if (currentSeq !== requestSeqRef.current) return false;

      if (apiRes.data && apiRes.data.success && apiRes.data.data) {
        const rawAsset = apiRes.data.data;
        const groupKey = (rawAsset.groupKey && rawAsset.groupKey.trim() !== '')
          ? rawAsset.groupKey.trim()
          : (rawAsset.title ? rawAsset.title.toLowerCase().trim().replace(/[^\w\s-]+/g, '').replace(/[\s_]+/g, '-') : '');

        let groupVariants = [rawAsset];
        try {
          const allRes = await apiClient.get('/content-assets', { params: { type: 'Book', status: 'Published' } });
          if (allRes.data && allRes.data.success && Array.isArray(allRes.data.data)) {
            const normalizeKey = (str) => (!str ? '' : str.toLowerCase().trim().replace(/[^\w\s-]+/g, '').replace(/[\s_]+/g, '-'));
            const matched = allRes.data.data.filter(b => {
              const k = (b.groupKey && b.groupKey.trim() !== '') ? b.groupKey.trim() : normalizeKey(b.title);
              return k === groupKey;
            });
            if (matched.length > 0) {
              groupVariants = matched;
            }
          }
        } catch (e) {
          console.log('[BookDetailScreen] Error fetching group variants:', e.message);
        }

        const vMap = {};
        const langsFound = [];

        groupVariants.forEach(v => {
          let code = (v.languageCode || '').toLowerCase().trim();
          if (!code && v.language) {
            const lLower = v.language.toLowerCase();
            if (lLower.includes('hindi') || lLower.includes('हिन्दी')) code = 'hi';
            else if (lLower.includes('marathi') || lLower.includes('मराठी')) code = 'mr';
            else if (lLower.includes('english')) code = 'en';
          }
          if (!code) code = 'en';

          vMap[code] = v;
          if (!langsFound.includes(code)) {
            langsFound.push(code);
          }
        });

        setVariantsMap(vMap);
        setAvailableLangs(langsFound.length > 0 ? langsFound : ['en']);

        const activeVar = vMap[lang] || vMap['en'] || groupVariants[0];
        const parsed = parseContentAssetMetadata(activeVar.description);

        const canonicalBook = {
          id: String(activeVar.id),
          title: activeVar.title,
          category: activeVar.category || 'Women Health',
          description: parsed.description || 'A handpicked health guide by HealthSakhi.',
          coverUrl: parsed.coverUrl || activeVar.coverUrl || activeVar.image,
          mediaUrl: activeVar.mediaUrl,
          isPaid: parsed.isPaid
        };

        setBook(canonicalBook);

        if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
          const normChaps = parsed.chapters.map((c, i) => normalizeChapterItem(c, i));
          setChapters(normChaps);
          setLoading(false);
          return false;
        } else {
          const dynTitles = generateDynamicChapters(activeVar.title, activeVar.category, null, activeVar.id);
          setChapters(dynTitles.map((c, i) => normalizeChapterItem(c, i)));
          setLoading(false);
          return false;
        }
      }
    } catch (err) {
      console.log('[BookDetailScreen] Canonical asset fetch error:', err.message);
    }

    if (currentSeq !== requestSeqRef.current) return false;

    // Secondary source: static JSON for compiled format assets
    try {
      const url = `https://healthsakhis.kiaansoftware.com/books/book_${bookId}_${lang}.json`;
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (currentSeq !== requestSeqRef.current) return false;
        setBookData(json);
        setPages(json.pages || []);
        if (Array.isArray(json.chapters) && json.chapters.length > 0) {
          setChapters(json.chapters.map((c, i) => normalizeChapterItem(c, i)));
        }
        if (json.title) {
          setBook(prev => ({
            ...prev,
            title: json.title,
            description: json.desc || prev?.description
          }));
        }
        setLoading(false);
        return false;
      }
    } catch (e) {
      console.log('[BookDetailScreen] Static JSON fetch error:', e.message);
    }

    if (currentSeq !== requestSeqRef.current) return false;

    // Fallback source: dynamic chapter titles mapping
    const dynTitles = generateDynamicChapters(book?.title, book?.category, null, bookId);
    setChapters(dynTitles.map((c, i) => normalizeChapterItem(c, i)));
    setLoading(false);
    return false;
  };

  const switchBookLanguage = (targetLang) => {
    if (!targetLang) return;
    setCurrentLang(targetLang);
    const targetVariant = variantsMap[targetLang];
    if (targetVariant) {
      const parsed = parseContentAssetMetadata(targetVariant.description);
      const updatedBook = {
        id: String(targetVariant.id),
        title: targetVariant.title,
        category: targetVariant.category || 'Women Health',
        description: parsed.description || 'A handpicked health guide by HealthSakhi.',
        coverUrl: parsed.coverUrl || targetVariant.coverUrl || targetVariant.image,
        mediaUrl: targetVariant.mediaUrl,
        isPaid: parsed.isPaid
      };
      setBook(updatedBook);
      if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
        setChapters(parsed.chapters.map((c, i) => normalizeChapterItem(c, i)));
      } else {
        const dynTitles = generateDynamicChapters(targetVariant.title, targetVariant.category, null, targetVariant.id);
        setChapters(dynTitles.map((c, i) => normalizeChapterItem(c, i)));
      }
    } else {
      handleTranslate(targetLang);
    }
  };

  const loadProgress = async () => {
    if (!bookId) return;
    try {
      const res = await apiClient.get(`/content-assets/${bookId}/progress`);
      if (res.data && res.data.success && res.data.progress) {
        setProgress(res.data.progress.position || 0);
      }
    } catch (err) {
      console.log('Failed to load progress:', err.message);
    }
  };

  const handleTranslate = async (targetLang) => {
    setCurrentLang(targetLang);
    setLanguage(targetLang);
    setShowLangPicker(false);
    const resolvedTransNeeded = await loadBookData(targetLang);
    
    // Dynamically update the target language and translationNeeded inside WebView and translate current page
    if (readerWebViewRef.current) {
      readerWebViewRef.current.injectJavaScript(`
        if (typeof targetLang !== 'undefined') {
          targetLang = "${targetLang}";
        }
        if (typeof isTranslationNeeded !== 'undefined') {
          isTranslationNeeded = ${resolvedTransNeeded ? 'true' : 'false'};
        }
        if (typeof isDocx !== 'undefined' && isDocx) {
          if (typeof renderDocxPage !== 'undefined' && typeof pageNum !== 'undefined') {
            renderDocxPage(pageNum);
          }
        } else {
          if (typeof renderPage !== 'undefined' && typeof pageNum !== 'undefined') {
            renderPage(pageNum);
          }
        }
      `);
    }
  };

  const updatePageProgress = async (pageIdx, customTotal) => {
    if (!bookId) return;
    const finalTotal = customTotal || pdfTotalPages || pages.length || 1;
    try {
      await apiClient.post(`/content-assets/${bookId}/progress`, {
        position: pageIdx + 1,
        completed: pageIdx + 1 === finalTotal
      });
      setProgress(pageIdx + 1);
    } catch (err) {
      console.log('Progress save failed:', err.message);
    }
  };

  const handleExitPdfReader = () => {
    setShowPdfReader(false);
    if (progress >= 2 && !feedbackSubmitted) {
      setShowFeedbackModal(true);
    }
  };

  const handleExitTextReader = () => {
    setReadingMode(false);
    if (progress >= 2 && !feedbackSubmitted) {
      setShowFeedbackModal(true);
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      await apiClient.post(`/content-assets/${bookId}/feedback`, {
        rating: feedbackRating,
        comment: feedbackText
      });
      setFeedbackSubmitted(true);
      setShowFeedbackModal(false);
      Alert.alert("Success", "Thank you for your feedback! 🌸");
    } catch (err) {
      console.log('Failed to submit feedback:', err.message);
      setFeedbackSubmitted(true);
      setShowFeedbackModal(false);
    }
  };

  const handleFeedbackSkip = () => {
    setShowFeedbackModal(false);
  };

  const handlePlaySummaryTts = async () => {
    if (activeTtsUrl) {
      setActiveTtsUrl(null);
      return;
    }
    try {
      const chaptersText = chapters && chapters.length > 0
        ? `. Chapters: ${chapters.map((ch, idx) => `Chapter ${idx + 1}: ${ch.title}`).join(', ')}`
        : '';
      const textToSpeak = `Title: ${book.title}. Summary: ${book.description}${chaptersText}`;
      const res = await apiClient.post('/i18n/tts', {
        text: textToSpeak.substring(0, 1000),
        language: currentLang
      });
      if (res.data && res.data.success && res.data.audioUrl) {
        setActiveTtsUrl(res.data.audioUrl);
      }
    } catch (err) {
      console.log('Failed to generate summary TTS:', err.message);
    }
  };

  const handlePlayPageTts = async (text, lang) => {
    try {
      const res = await apiClient.post('/i18n/tts', {
        text: text,
        language: lang
      });
      if (res.data && res.data.success && res.data.audioUrl) {
        setActiveTtsUrl(res.data.audioUrl);
      }
    } catch (err) {
      console.log('Failed to play page TTS:', err.message);
    }
  };

  const handleTranslatePageText = async (text, targetLang) => {
    try {
      const res = await apiClient.post('/i18n/translate', {
        texts: [text],
        target: targetLang
      });
      const translated = (res.data && res.data.success && res.data.translations && res.data.translations[0]) ? res.data.translations[0] : text;
      if (readerWebViewRef.current) {
        readerWebViewRef.current.injectJavaScript(`if (window.onTranslationResult) { window.onTranslationResult(${JSON.stringify(translated)}); }`);
      }
    } catch (err) {
      console.log('Failed to translate page text:', err.message);
      if (readerWebViewRef.current) {
        readerWebViewRef.current.injectJavaScript(`if (window.onTranslationResult) { window.onTranslationResult(${JSON.stringify(text)}); }`);
      }
    }
  };

  const handleResumeJourney = () => {
    const fullMediaUrl = book?.mediaUrl ? (book.mediaUrl.startsWith('http') ? book.mediaUrl : 'https://health-sakhi-production.up.railway.app' + book.mediaUrl) : null;
    const isPdf = fullMediaUrl && fullMediaUrl.toLowerCase().includes('.pdf');
    const isDocx = fullMediaUrl && (fullMediaUrl.toLowerCase().includes('.docx') || fullMediaUrl.toLowerCase().includes('.doc'));
    
    if (isPdf || isDocx) {
      setPdfInitialPage(progress > 0 ? progress : 1);
      setShowPdfReader(true);
    } else {
      setReadingMode(true);
      const resumeIdx = progress > 0 && progress <= pages.length ? progress - 1 : 0;
      setActivePageIdx(resumeIdx);
    }
  };

  useEffect(() => {
    const nextSeq = ++requestSeqRef.current;
    if (passedBook && String(passedBook.id) === String(bookId)) {
      setBook(passedBook);
    } else {
      setBook(null);
    }
    setChapters([]);
    setPages([]);
    setLoading(true);

    loadBookData(langCode, nextSeq);
    loadProgress();
  }, [bookId, langCode]);

  const totalPages = pdfTotalPages > 0 ? pdfTotalPages : (pages.length || 1);
  const progressPct = Math.round((progress / totalPages) * 100);
  const displayLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
  const activePickerLangs = LANGUAGES.filter(l => availableLangs.includes(l.code.toLowerCase()));

  // Helper to find which chapter a page belongs to
  const getActiveChapterTitle = () => {
    if (chapters.length === 0) return `Page ${activePageIdx + 1}`;
    const matched = chapters.find(ch => activePageIdx >= ch.startPage && activePageIdx <= ch.endPage);
    return matched ? matched.title : chapters[0].title;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.secondary} size="large" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: COLORS.textMuted }}>Book not found.</Text>
      </View>
    );
  }

  // Reading Mode View
  if (readingMode) {
    return (
      <SafeAreaView style={styles.readerContainer}>
        {/* Reader Header */}
        <View style={styles.readerHeader}>
          <TouchableOpacity onPress={handleExitTextReader}>
            <ArrowLeft size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.readerTitle} numberOfLines={1}>{book.title}</Text>
          
          {availableLangs.length > 1 && (
            <View style={styles.langSelectorRowHeader}>
              {availableLangs.map(code => (
                <TouchableOpacity
                  key={code}
                  style={[styles.langChipHeader, currentLang === code && styles.activeLangChipHeader]}
                  onPress={() => switchBookLanguage(code)}
                >
                  <Text style={[styles.langChipHeaderText, currentLang === code && styles.activeLangChipHeaderText]}>
                    {code.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Page tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chaptersTabRow} contentContainerStyle={{ padding: 8 }}>
          {pages.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.chapterTab, activePageIdx === idx && styles.activeChapterTab]}
              onPress={() => {
                setActivePageIdx(idx);
                updatePageProgress(idx);
              }}
            >
              <Text style={[styles.chapterTabText, activePageIdx === idx && styles.activeChapterTabText]}>
                {idx + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Page Content */}
        <ScrollView style={styles.readerContent} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={styles.chapterTitle}>{getActiveChapterTitle()}</Text>
          <Text style={styles.readerText}>
            {cleanHtml(pages[activePageIdx]) || 'No content on this page.'}
          </Text>
        </ScrollView>

        {/* Bottom progress bar */}
        <View style={styles.readerBottom}>
          <Text style={styles.readerProgressLabel}>
            {book.title} · {progressPct}% READ PROGRESS
          </Text>
          <View style={styles.readerProgressBar}>
            <View style={[styles.readerProgressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Language Modal */}
        <Modal visible={showLangPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowLangPicker(false)}>
            <View style={styles.langModalContent}>
              <Text style={styles.langModalTitle}>SELECT LANGUAGE</Text>
              {activePickerLangs.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langModalOption, currentLang === lang.code && styles.activeLangModalOption]}
                  onPress={() => handleTranslate(lang.code)}
                  disabled={translating}
                >
                  <Text style={[styles.langModalText, currentLang === lang.code && { color: COLORS.secondary }]}>
                    {lang.nativeLabel} ({lang.label})
                  </Text>
                  {currentLang === lang.code && <Check size={14} color={COLORS.secondary} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Detail</Text>
        
        {availableLangs.length > 1 ? (
          <View style={styles.langSelectorRowHeader}>
            {availableLangs.map(code => (
              <TouchableOpacity
                key={code}
                style={[styles.langChipHeader, currentLang === code && styles.activeLangChipHeader]}
                onPress={() => switchBookLanguage(code)}
              >
                <Text style={[styles.langChipHeaderText, currentLang === code && styles.activeLangChipHeaderText]}>
                  {code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {/* Language dropdown */}
      {showLangPicker && availableLangs.length > 1 && (
        <View style={styles.langDropdown}>
          {activePickerLangs.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langOption, currentLang === lang.code && styles.activeLangOption]}
              onPress={() => handleTranslate(lang.code)}
              disabled={translating}
            >
              <View style={styles.langBtns}>
                <Text style={styles.langBtnText}>{lang.nativeLabel}</Text>
                <Text style={styles.langBtnSubText}>{lang.label}</Text>
              </View>
              {currentLang === lang.code && <Check size={14} color={COLORS.secondary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Book card */}
        <View style={styles.bookDetailCard}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.badgeText}>{(book.category || 'RELATIONSHIPS').toUpperCase()}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.categoryBadge, { backgroundColor: activeTtsUrl ? '#EF4444' : '#E0F2F1' }]}
              onPress={handlePlaySummaryTts}
            >
              <Headphones size={10} color={activeTtsUrl ? '#FFFFFF' : '#0F766E'} style={{ marginRight: 3 }} />
              <Text style={[styles.badgeText, { color: activeTtsUrl ? '#FFFFFF' : '#0F766E' }]}>
                {activeTtsUrl ? 'STOP SUMMARY' : 'LISTEN SUMMARY'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bookInfoRow}>
            <View style={styles.coverBox}>
              <BookCoverImage uri={book.coverUrl} initials={book.title ? book.title.substring(0, 2).toUpperCase() : ''} style={styles.cover} />
            </View>

            <View style={styles.bookDetails}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>BY HEALTHSAKHI EXPERT</Text>

              <View style={styles.statsRow}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.statsText}>4.8</Text>
                <Users size={12} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
                <Text style={styles.statsText}>{bookData?.reads || '1.2K'} Reads</Text>
                <BookOpen size={12} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
                <Text style={styles.statsText}>{chapters.length || 5} chapters</Text>
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{progress} / {totalPages} PAGES COMPLETED</Text>
                <Text style={styles.progressPct}>{progressPct}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {translating && (
          <View style={styles.translatingRow}>
            <ActivityIndicator size="small" color={COLORS.secondary} />
            <Text style={styles.translatingText}>Translating to {displayLang.nativeLabel}...</Text>
          </View>
        )}

        {/* Book Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>BOOK SUMMARY</Text>
          <Text style={styles.summaryText}>{book.description}</Text>
        </View>

        {/* Chapters */}
        <Text style={styles.chaptersTitle}>CHAPTERS</Text>
        <View style={styles.chaptersGrid}>
          {loading ? (
            <ActivityIndicator color={COLORS.secondary} size="small" style={{ paddingVertical: 16 }} />
          ) : (
            (chapters.length > 0 ? chapters : generateDynamicChapters(book?.title, book?.category, null, bookId)).map((ch, idx) => {
              const norm = normalizeChapterItem(ch, idx);

              return (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.chapterItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    const fullMediaUrl = book?.mediaUrl ? (book.mediaUrl.startsWith('http') ? book.mediaUrl : 'https://health-sakhi-production.up.railway.app' + book.mediaUrl) : null;
                    const isPdf = fullMediaUrl && fullMediaUrl.toLowerCase().includes('.pdf');
                    const isDocx = fullMediaUrl && (fullMediaUrl.toLowerCase().includes('.docx') || fullMediaUrl.toLowerCase().includes('.doc'));
                    
                    if (isPdf || isDocx) {
                      setPdfInitialPage(norm.page || idx + 1);
                      setShowPdfReader(true);
                    } else {
                      const targetPage = norm.startPage !== undefined ? norm.startPage : (norm.page ? norm.page - 1 : idx);
                      setActivePageIdx(targetPage);
                      updatePageProgress(targetPage);
                      setReadingMode(true);
                    }
                  }}
                >
                  <View style={styles.chapterIndexBubble}>
                    <Text style={styles.chapterIndexText}>{norm.chapterNumber}</Text>
                  </View>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={styles.chapterName} numberOfLines={2}>{norm.title}</Text>
                  </View>
                  {norm.page !== undefined ? (
                    <View style={styles.pgBadge}>
                      <Text style={styles.pgBadgeText}>PG {norm.page}</Text>
                    </View>
                  ) : null}
                  <ChevronRight size={14} color={COLORS.secondary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <TouchableOpacity style={styles.resumeBtn} onPress={handleResumeJourney}>
          <Play size={16} color={COLORS.white} fill={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.resumeBtnText}>RESUME JOURNEY</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PDF Reader Modal */}
      {showPdfReader && book?.mediaUrl && (
        <Modal visible={showPdfReader} animationType="slide" onRequestClose={handleExitPdfReader}>
          <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
            <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: COLORS.border, justifyContent: 'space-between', paddingHorizontal: 16 }]}>
              <TouchableOpacity onPress={handleExitPdfReader} style={{ padding: 6 }}>
                <ArrowLeft size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center', marginLeft: 8, marginRight: 4 }]} numberOfLines={1}>
                {book.title}
              </Text>
              {availableLangs.length > 1 ? (
                <View style={styles.langSelectorRowHeader}>
                  {availableLangs.map(code => (
                    <TouchableOpacity
                      key={code}
                      style={[styles.langChipHeader, currentLang === code && styles.activeLangChipHeader]}
                      onPress={() => switchBookLanguage(code)}
                    >
                      <Text style={[styles.langChipHeaderText, currentLang === code && styles.activeLangChipHeaderText]}>
                        {code.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ width: 32 }} />
              )}
            </View>
            <WebView
              ref={readerWebViewRef}
              source={{ html: getPdfReaderHtml(book.mediaUrl.startsWith('http') ? book.mediaUrl : 'https://health-sakhi-production.up.railway.app' + book.mediaUrl, pdfInitialPage, currentLang, API_BASE_URL, translationNeeded) }}
              style={{ flex: 1 }}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
              pinchGestureEnabled={true}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              startInLoadingState={true}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'LOADED') {
                    if (data.total) {
                      setPdfTotalPages(data.total);
                      if (data.current) {
                        updatePageProgress(data.current - 1, data.total);
                      }
                    }
                  } else if (data.type === 'PAGE_CHANGE') {
                    if (data.current) {
                      updatePageProgress(data.current - 1);
                    }
                  } else if (data.type === 'COMPLETED') {
                    setShowPdfReader(false);
                    if (!feedbackSubmitted) {
                      setShowFeedbackModal(true);
                    }
                  } else if (data.type === 'PLAY_TTS') {
                    if (data.text) {
                      handlePlayPageTts(data.text, data.lang);
                    }
                  } else if (data.type === 'STOP_TTS') {
                    setActiveTtsUrl(null);
                    if (readerWebViewRef.current) {
                      readerWebViewRef.current.injectJavaScript('if (window.onTtsPlaybackEnded) { window.onTtsPlaybackEnded(); }');
                    }
                  } else if (data.type === 'SEEK_TTS') {
                    if (ttsWebViewRef.current) {
                      ttsWebViewRef.current.injectJavaScript(`
                        const audio = document.getElementById('tts-audio');
                        if (audio) {
                          audio.currentTime = ${data.time};
                        }
                      `);
                    }
                  } else if (data.type === 'TRANSLATE_TEXT') {
                    if (data.text) {
                      handleTranslatePageText(data.text, data.lang);
                    }
                  }
                } catch (e) {
                  console.log('PDF WebView Message Error:', e.message);
                }
              }}
              renderLoading={() => (
                <ActivityIndicator
                  color={COLORS.secondary}
                  size="large"
                  style={{ position: 'absolute', top: '40%', left: '48%' }}
                />
              )}
            />
            <Modal visible={showLangPicker} transparent animationType="fade" onRequestClose={() => setShowLangPicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowLangPicker(false)}>
                <View style={styles.langModalContent}>
                  <Text style={styles.langModalTitle}>SELECT LANGUAGE</Text>
                  {activePickerLangs.map(lang => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.langModalOption, currentLang === lang.code && styles.activeLangModalOption]}
                      onPress={() => handleTranslate(lang.code)}
                      disabled={translating}
                    >
                      <Text style={[styles.langModalText, currentLang === lang.code && { color: COLORS.secondary }]}>
                        {lang.nativeLabel} ({lang.label})
                      </Text>
                      {currentLang === lang.code && <Check size={14} color={COLORS.secondary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </SafeAreaView>
        </Modal>
      )}

      {/* Book Feedback Modal */}
      {showFeedbackModal && (
        <Modal visible={showFeedbackModal} transparent={true} animationType="fade" onRequestClose={() => setShowFeedbackModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.feedbackCard}>
              <View style={styles.feedbackIconBg}>
                <Text style={{ fontSize: 32 }}>💬</Text>
              </View>
              <Text style={styles.feedbackTitle}>How was your reading?</Text>
              <Text style={styles.feedbackSubtitle}>Share your experience with <Text style={{ color: '#EC4899', fontWeight: 'bold' }}>{book?.title}</Text></Text>

              {/* Star Rating */}
              <Text style={styles.rateLabel}>RATE THIS BOOK</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setFeedbackRating(star)} activeOpacity={0.7}>
                    <Star 
                      size={32} 
                      color={feedbackRating >= star ? '#F59E0B' : '#CBD5E1'} 
                      fill={feedbackRating >= star ? '#F59E0B' : 'none'} 
                      style={{ marginHorizontal: 4 }} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {feedbackRating > 0 && (
                <Text style={styles.ratingText}>
                  {feedbackRating === 1 ? 'Not helpful' : feedbackRating === 2 ? 'Needs improvement' : feedbackRating === 3 ? 'Good read' : feedbackRating === 4 ? 'Really helpful!' : 'Amazing! Loved it! ✨'}
                </Text>
              )}

              {/* Thoughts Input */}
              <Text style={styles.rateLabel}>YOUR THOUGHTS (OPTIONAL)</Text>
              <TextInput
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="What did you learn? What could be better?"
                placeholderTextColor={COLORS.textMuted}
                multiline={true}
                numberOfLines={3}
                style={styles.feedbackInput}
              />

              {/* Actions */}
              <View style={styles.feedbackActions}>
                <TouchableOpacity style={styles.feedbackSkipBtn} onPress={handleFeedbackSkip}>
                  <Text style={styles.feedbackSkipText}>SKIP</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.feedbackSubmitBtn, feedbackRating === 0 && { opacity: 0.5 }]} 
                  onPress={handleFeedbackSubmit}
                  disabled={feedbackRating === 0}
                >
                  <Text style={styles.feedbackSubmitText}>SUBMIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {activeTtsUrl && (
        <View style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}>
          <WebView
            ref={ttsWebViewRef}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <body>
                  <audio id="tts-audio" src="${activeTtsUrl}" autoplay inline></audio>
                  <script>
                    const audio = document.getElementById('tts-audio');
                    function startPlay() {
                      audio.play().catch(err => {
                        setTimeout(startPlay, 100);
                      });
                    }
                    audio.ontimeupdate = () => {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'TTS_PROGRESS',
                        currentTime: audio.currentTime,
                        duration: audio.duration || 0
                      }));
                    };
                    audio.onloadedmetadata = () => {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'TTS_PROGRESS',
                        currentTime: audio.currentTime,
                        duration: audio.duration || 0
                      }));
                    };
                    audio.onended = () => {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TTS_ENDED' }));
                    };
                    audio.onerror = () => {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TTS_ENDED' }));
                    };
                    startPlay();
                  </script>
                </body>
                </html>
              `
            }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'TTS_ENDED') {
                  setActiveTtsUrl(null);
                  if (readerWebViewRef.current) {
                    readerWebViewRef.current.injectJavaScript('if (window.onTtsPlaybackEnded) { window.onTtsPlaybackEnded(); }');
                  }
                } else if (data.type === 'TTS_PROGRESS') {
                  if (readerWebViewRef.current) {
                    readerWebViewRef.current.injectJavaScript(`if (window.onTtsProgress) { window.onTtsProgress(${data.currentTime}, ${data.duration}); }`);
                  }
                }
              } catch (e) {
                console.log(e);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '850',
    color: COLORS.primary,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderColor: '#FBE8EB',
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  langDropdown: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.medium,
    zIndex: 100,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeLangOption: {
    backgroundColor: '#FFF0F5',
  },
  langBtns: { flexDirection: 'column' },
  langBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  langBtnSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  bookDetailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EC489914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#EC4899',
  },
  bookInfoRow: {
    flexDirection: 'row',
    gap: 14,
  },
  coverBox: {
    width: 100,
    height: 130,
    flexShrink: 0,
  },
  cover: {
    width: 100,
    height: 130,
    borderRadius: 14,
  },
  coverFallback: {
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverInitials: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  bookDetails: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 24,
  },
  bookAuthor: {
    fontSize: 9,
    fontWeight: '850',
    color: COLORS.secondary,
    marginTop: 2,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  progressPct: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#FBE8EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  translatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  translatingText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    fontWeight: '600',
  },
  chaptersTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  chaptersGrid: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    ...SHADOWS.light,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(75, 30, 90, 0.06)',
  },
  chapterIndexBubble: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chapterIndexText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  chapterName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  pgBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  pgBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  resumeBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    ...SHADOWS.medium,
  },
  resumeBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Reader styles
  readerContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  readerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '850',
    color: COLORS.primary,
    marginLeft: 12,
    marginRight: 8,
  },
  langPickerSmall: {
    padding: 6,
  },
  chaptersTabRow: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 50,
  },
  chapterTab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChapterTab: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  chapterTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  activeChapterTabText: {
    color: COLORS.white,
  },
  readerContent: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 16,
  },
  readerText: {
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.primary,
    fontWeight: '500',
  },
  readerBottom: {
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  readerProgressLabel: {
    fontSize: 8,
    fontWeight: '850',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  readerProgressBar: {
    height: 4,
    backgroundColor: '#FBE8EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  readerProgressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  langModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '80%',
    ...SHADOWS.medium,
  },
  langModalTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  langModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeLangModalOption: {
    backgroundColor: '#FFF0F5',
  },
  langModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  feedbackIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  feedbackSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  rateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    fontSize: 13,
    color: COLORS.primary,
    textAlignVertical: 'top',
    height: 70,
    marginBottom: 20,
  },
  feedbackActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  feedbackSkipBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  feedbackSkipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  feedbackSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
  },
  feedbackSubmitText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  langSelectorRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langChipHeader: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  activeLangChipHeader: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  langChipHeaderText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
  },
  activeLangChipHeaderText: {
    color: COLORS.white,
  },
});
