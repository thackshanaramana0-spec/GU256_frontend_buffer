/* ==========================================================================
   GU256 Platform Core JavaScript Controller
   Optimized for 60fps performance and dynamic layout updates
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. Loading Screen & Particle Field
  // ==========================================================================
  const loadingScreen = document.getElementById('loading-screen');
  const loadingBarProgress = document.getElementById('loading-bar-progress');
  const loadingText = document.getElementById('loading-text');
  const loadingPercentage = document.getElementById('loading-percentage');
  const loadingFrameCount = document.getElementById('loading-frame-count');
  const loadingCanvas = document.getElementById('loading-particles');
  const loadingCtx = loadingCanvas.getContext('2d');
  
  // Fit loading canvas to window
  function resizeLoadingCanvas() {
    loadingCanvas.width = window.innerWidth;
    loadingCanvas.height = window.innerHeight;
  }
  resizeLoadingCanvas();
  window.addEventListener('resize', resizeLoadingCanvas);
  
  // Loading screen chaotic particles representation
  const loadingParticles = [];
  for (let i = 0; i < 60; i++) {
    loadingParticles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: (Math.random() - 0.5) * 1.5,
      color: Math.random() > 0.4 ? '#3B82F6' : '#06B6D4',
      opacity: Math.random() * 0.5 + 0.2
    });
  }
  
  let particlesAnimationActive = true;
  function animateLoadingParticles() {
    if (!particlesAnimationActive) return;
    loadingCtx.clearRect(0, 0, loadingCanvas.width, loadingCanvas.height);
    
    loadingParticles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Boundary check
      if (p.x < 0 || p.x > loadingCanvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > loadingCanvas.height) p.speedY *= -1;
      
      loadingCtx.beginPath();
      loadingCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      loadingCtx.fillStyle = p.color;
      loadingCtx.globalAlpha = p.opacity;
      loadingCtx.fill();
    });
    
    // Draw lines between close particles
    loadingCtx.globalAlpha = 0.05;
    loadingCtx.strokeStyle = '#3B82F6';
    for (let i = 0; i < loadingParticles.length; i++) {
      for (let j = i + 1; j < loadingParticles.length; j++) {
        const dx = loadingParticles[i].x - loadingParticles[j].x;
        const dy = loadingParticles[i].y - loadingParticles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) {
          loadingCtx.beginPath();
          loadingCtx.moveTo(loadingParticles[i].x, loadingParticles[i].y);
          loadingCtx.lineTo(loadingParticles[j].x, loadingParticles[j].y);
          loadingCtx.stroke();
        }
      }
    }
    
    requestAnimationFrame(animateLoadingParticles);
  }
  animateLoadingParticles();

  // ==========================================================================
  // 2. WebP Frame Preloading
  // ==========================================================================
  const frameImages = [];
  let isManifestLoaded = false;
  let totalFrames = 0;
  let loadedFramesCount = 0;
  
  // Setup primary Canvas - must happen immediately for correct sizing
  const heroCanvas = document.getElementById('hero-canvas');
  const heroCtx = heroCanvas.getContext('2d');
  const heroCanvasContainer = document.getElementById('hero-canvas-container');
  
  // Set canvas pixel-perfect dimensions immediately
  function resizeHeroCanvas() {
    const dpr = window.devicePixelRatio || 1;
    heroCanvas.width = window.innerWidth * dpr;
    heroCanvas.height = window.innerHeight * dpr;
    heroCanvas.style.width = window.innerWidth + 'px';
    heroCanvas.style.height = window.innerHeight + 'px';
    heroCtx.scale(dpr, dpr);
    renderCurrentFrame();
  }
  resizeHeroCanvas();
  window.addEventListener('resize', resizeHeroCanvas);
  
  // Load WebP manifest
  fetch('./hero-sequence/manifest.json')
    .then(res => {
      if (!res.ok) throw new Error('Manifest not found');
      return res.json();
    })
    .then(data => {
      const framesList = data.frames || [];
      totalFrames = framesList.length;
      
      if (totalFrames === 0) {
        throw new Error('No frames in manifest');
      }
      
      loadingFrameCount.innerText = `0 / ${totalFrames} Frames Preloaded`;
      
      // Load frames asynchronously in parallel
      framesList.forEach((framePath, idx) => {
        const img = new Image();
        img.src = `./hero-sequence/${framePath}`;
        img.onload = () => {
          frameImages[idx] = img;
          loadedFramesCount++;
          updateProgress();
        };
        img.onerror = () => {
          console.warn(`Failed to load frame at index: ${idx}`);
          loadedFramesCount++;
          updateProgress();
        };
      });
    })
    .catch(err => {
      console.error('Error fetching manifest or loading frames:', err);
      loadingText.innerText = 'Preload failed. Starting fallback mode...';
      setTimeout(dismissLoadingScreen, 1500);
    });
    
  function updateProgress() {
    if (totalFrames === 0) return;
    const percentage = Math.floor((loadedFramesCount / totalFrames) * 100);
    loadingBarProgress.style.width = `${percentage}%`;
    loadingPercentage.innerText = `${percentage}%`;
    loadingFrameCount.innerText = `${loadedFramesCount} / ${totalFrames} Frames Preloaded`;
    
    if (loadedFramesCount >= totalFrames) {
      setTimeout(dismissLoadingScreen, 600);
    }
  }
  
  function dismissLoadingScreen() {
    // Fade out loading screen
    loadingScreen.style.opacity = '0';
    loadingScreen.style.pointerEvents = 'none';
    
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      particlesAnimationActive = false;
    }, 800);
    
    // Initialize interactive components
    initializeInteractiveComponents();
  }

  // ==========================================================================
  // 3. Hero Section Scroll Renderer (60 FPS requestAnimationFrame)
  // ==========================================================================
  const heroSection = document.getElementById('hero-section');
  const heroContent = document.querySelector('.hero-content-wrapper');
  const header = document.getElementById('site-header');
  
  let lastScrollY = window.scrollY;
  let ticking = false;
  
  function handleScroll() {
    lastScrollY = window.scrollY;
    
    // Sticky header transparency toggle
    if (lastScrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateRailProgress();
        animateRevealElements();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', handleScroll);
  
  // Smooth frame interpolation - lerp target for cinematic feel
  let currentFrameF = 0; // fractional frame index for smooth interpolation
  let targetFrameF = 0;
  
  function renderCurrentFrame() {
    if (frameImages.length === 0 || totalFrames === 0) return;
    
    const heroSectionEl = document.getElementById('hero-section');
    const rect = heroSectionEl.getBoundingClientRect();
    const scrollHeight = heroSectionEl.offsetHeight - window.innerHeight;
    let scrollProgress = -rect.top / scrollHeight;
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));
    
    // Set target frame
    targetFrameF = scrollProgress * (totalFrames - 1);
    // Lerp current towards target for smooth cinematic motion
    currentFrameF += (targetFrameF - currentFrameF) * 0.18;
    
    const frameIndex = Math.round(Math.max(0, Math.min(totalFrames - 1, currentFrameF)));
    const currentImg = frameImages[frameIndex];
    
    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;
    
    if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
      heroCtx.clearRect(0, 0, canvasW, canvasH);
      
      // Cover-fit calculation
      const imgRatio = currentImg.naturalWidth / currentImg.naturalHeight;
      const canvasRatio = canvasW / canvasH;
      
      let drawW, drawH, offsetX = 0, offsetY = 0;
      if (canvasRatio > imgRatio) {
        drawW = canvasW;
        drawH = canvasW / imgRatio;
        offsetY = (canvasH - drawH) / 2;
      } else {
        drawH = canvasH;
        drawW = canvasH * imgRatio;
        offsetX = (canvasW - drawW) / 2;
      }
      
      heroCtx.drawImage(currentImg, offsetX, offsetY, drawW, drawH);
    }
    
    // Fade hero text out in the first third of scroll
    const heroLeft = document.querySelector('.hero-left');
    if (heroLeft) {
      const fadeStart = 0.15;
      const fadeEnd = 0.45;
      let textOpacity = 1;
      if (scrollProgress > fadeStart) {
        textOpacity = Math.max(0, 1 - (scrollProgress - fadeStart) / (fadeEnd - fadeStart));
      }
      heroLeft.style.opacity = textOpacity.toString();
      heroLeft.style.transform = `translateY(${(1 - textOpacity) * -40}px)`;
    }
    
    // Fade canvas out as user scrolls past hero into content sections
    if (rect.bottom < window.innerHeight) {
      const fadeRatio = Math.max(0, rect.bottom / window.innerHeight);
      heroCanvasContainer.style.opacity = (fadeRatio * 0.85).toString();
    } else {
      heroCanvasContainer.style.opacity = '0.85';
    }
  }
  
  // Continuous rAF loop for smooth frame rendering even between scroll events
  function animationLoop() {
    renderCurrentFrame();
    requestAnimationFrame(animationLoop);
  }
  animationLoop();

  // ==========================================================================
  // 4. Navigation Rail Progress
  // ==========================================================================
  const railDots = document.querySelectorAll('.rail-dot');
  const railProgressBar = document.getElementById('rail-progress-bar');
  const sectionsList = [
    document.getElementById('hero-section'),
    document.getElementById('problem-section'),
    document.getElementById('architecture-section'),
    document.getElementById('benchmarks-section'),
    document.getElementById('search-section'),
    document.getElementById('ai-section'),
    document.getElementById('healing-section'),
    document.getElementById('infrastructure-section'),
    document.getElementById('arcs-section'),
    document.getElementById('impact-section')
  ];
  
  function updateRailProgress() {
    const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (window.scrollY / totalDocHeight) * 100;
    railProgressBar.style.height = `${scrollPercent}%`;
    
    // Highlight correct dot based on scroll intersection
    let currentActiveIdx = 0;
    sectionsList.forEach((sec, idx) => {
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      // Highlight dot if the section occupies top of window
      if (rect.top <= window.innerHeight * 0.4) {
        currentActiveIdx = idx;
      }
    });
    
    railDots.forEach((dot, idx) => {
      if (idx === currentActiveIdx) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Smooth scroll links mapping
  railDots.forEach((dot, idx) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSec = sectionsList[idx];
      if (targetSec) {
        let targetY = targetSec.offsetTop;
        // Adjust for the long hero scroll height
        if (idx === 0) targetY = 0;
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==========================================================================
  // 5. Scroll Reveals
  // ==========================================================================
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const statElements = document.querySelectorAll('.animate-stat');
  
  function animateRevealElements() {
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elemTop = rect.top;
      const elemBottom = rect.bottom;
      
      // If element is partially visible
      if (elemTop < window.innerHeight * 0.85 && elemBottom > 0) {
        el.classList.add('active');
        
        // Trigger count animations inside the card if present
        const stats = el.querySelectorAll('.animate-stat');
        stats.forEach(triggerStatAnimation);
      }
    });
  }
  
  function triggerStatAnimation(statEl) {
    if (statEl.classList.contains('counted')) return;
    statEl.classList.add('counted');
    
    const target = parseFloat(statEl.getAttribute('data-target'));
    const isWinRatio = statEl.innerText.includes('/');
    const isMultiplier = statEl.innerText.includes('×');
    
    let count = 0;
    const duration = 1200; // ms
    const startTime = performance.now();
    
    function updateCount(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easedProgress = progress * (2 - progress);
      
      const currentVal = Math.floor(easedProgress * target);
      
      if (isWinRatio) {
        statEl.innerText = `${currentVal}/15`;
      } else if (isMultiplier) {
        statEl.innerText = `${currentVal.toLocaleString()}×`;
      } else {
        statEl.innerText = currentVal.toLocaleString();
      }
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        // Guarantee final numbers match precisely
        if (isWinRatio) statEl.innerText = `${target}/15`;
        else if (isMultiplier) statEl.innerText = `${target.toLocaleString()}×`;
        else statEl.innerText = target.toLocaleString();
      }
    }
    
    requestAnimationFrame(updateCount);
  }

  // ==========================================================================
  // 6. Interactive layered architecture (Section 2)
  // ==========================================================================
  const layersContainer = document.getElementById('layered-container');
  const layers = document.querySelectorAll('.core-layer');
  const archCards = document.querySelectorAll('.arch-layer-card');
  const architectureSection = document.getElementById('architecture-section');
  
  function animateArchitectureLayers() {
    if (!architectureSection || !layersContainer) return;
    
    const rect = architectureSection.getBoundingClientRect();
    const sectionHeight = rect.height;
    
    // Offset layers on scroll down
    let scrollProgress = -rect.top / (sectionHeight - window.innerHeight);
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));
    
    // Translate layers based on index to expand outwards in Z-plane
    layers.forEach((layer, idx) => {
      const layerIndex = parseInt(layer.getAttribute('data-layer'));
      const defaultZ = -15 + (layerIndex - 1) * 25; // Default stack
      const expandedZ = defaultZ + (scrollProgress * (layerIndex * 28)); // Expand on scroll
      
      // Update element transforms
      layer.style.transform = `translateZ(${expandedZ}px)`;
    });
    
    // Map scroll progress inside this section to highlighting the cards
    let cardIdx = Math.floor(scrollProgress * archCards.length);
    cardIdx = Math.max(0, Math.min(archCards.length - 1, cardIdx));
    
    highlightLayer(cardIdx + 1);
  }
  
  function highlightLayer(layerNum) {
    layers.forEach(layer => {
      if (parseInt(layer.getAttribute('data-layer')) === layerNum) {
        layer.classList.add('highlighted');
      } else {
        layer.classList.remove('highlighted');
      }
    });
    
    archCards.forEach((card, idx) => {
      if (idx + 1 === layerNum) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }
  
  // Attach hover triggers
  archCards.forEach((card, idx) => {
    card.addEventListener('mouseenter', () => {
      highlightLayer(idx + 1);
    });
  });
  
  // Listen to architecture container scroll logic
  window.addEventListener('scroll', () => {
    window.requestAnimationFrame(animateArchitectureLayers);
  });

  // ==========================================================================
  // 7. Interactive Benchmarks Chart (Section 3)
  // ==========================================================================
  const chartTabs = document.querySelectorAll('.chart-tab');
  const datasetSize = document.getElementById('dataset-size');
  const compressedSize = document.getElementById('compressed-size');
  const ratioVal = document.getElementById('ratio-improvement');
  
  // Elements for bars
  const barGu = document.getElementById('bar-gu');
  const barSpring = document.getElementById('bar-spring');
  const barGenozip = document.getElementById('bar-genozip');
  const barFq = document.getElementById('bar-fq');
  const barDsrc = document.getElementById('bar-dsrc');
  
  const valGu = document.getElementById('val-gu');
  const valSpring = document.getElementById('val-spring');
  const valGenozip = document.getElementById('val-genozip');
  const valFq = document.getElementById('val-fq');
  const valDsrc = document.getElementById('val-dsrc');
  
  const benchmarkData = {
    human: {
      size: '3.2 GB',
      compressed: '256 MB',
      ratio: '12.5×',
      bars: { gu: 8, spring: 25, genozip: 45, fq: 60, dsrc: 90 },
      vals: { gu: '0.25 GB', spring: '0.78 GB', genozip: '1.44 GB', fq: '1.92 GB', dsrc: '2.88 GB' }
    },
    sars: {
      size: '1.8 GB',
      compressed: '1.45 MB',
      ratio: '1238×',
      bars: { gu: 1.5, spring: 18, genozip: 40, fq: 55, dsrc: 85 },
      vals: { gu: '1.45 MB', spring: '32.4 MB', genozip: '72.0 MB', fq: '99.0 MB', dsrc: '153 MB' }
    },
    metagenome: {
      size: '12.4 GB',
      compressed: '1.11 GB',
      ratio: '11.1×',
      bars: { gu: 9, spring: 27, genozip: 45, fq: 60, dsrc: 85 },
      vals: { gu: '1.11 GB', spring: '3.35 GB', genozip: '5.58 GB', fq: '7.44 GB', dsrc: '10.54 GB' }
    }
  };
  
  function loadBenchmarkDataset(datasetName) {
    const data = benchmarkData[datasetName];
    if (!data) return;
    
    // Update summary stats text
    datasetSize.innerText = data.size;
    compressedSize.innerText = data.compressed;
    ratioVal.innerText = data.ratio;
    
    // Update bar sizes
    barGu.style.width = `${data.bars.gu}%`;
    barSpring.style.width = `${data.bars.spring}%`;
    barGenozip.style.width = `${data.bars.genozip}%`;
    barFq.style.width = `${data.bars.fq}%`;
    barDsrc.style.width = `${data.bars.dsrc}%`;
    
    // Update values text
    valGu.innerText = data.vals.gu;
    valSpring.innerText = data.vals.spring;
    valGenozip.innerText = data.vals.genozip;
    valFq.innerText = data.vals.fq;
    valDsrc.innerText = data.vals.dsrc;
  }
  
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const dataset = tab.getAttribute('data-dataset');
      loadBenchmarkDataset(dataset);
    });
  });

  // ==========================================================================
  // 8. Search Simulator (Section 4)
  // ==========================================================================
  const querySelect = document.getElementById('sample-queries');
  const runQueryBtn = document.getElementById('run-query-btn');
  const terminalOutput = document.getElementById('terminal-output');
  const archiveShield = document.getElementById('archive-shield');
  
  const queryOutputs = {
    'ATGCTAGCTAGCTAGCTAGCTAGCTAGCTA': [
      '[SYSTEM] Initializing gu256 client search engine...',
      '[SYSTEM] Loading index headers for GU256 object standard...',
      '[SYSTEM] Target pattern: ATGCTAGCTAGCTAGCTAGCTAGCTAGCTA (K=31)',
      '[ENGINE] Scanning GU-TENSOR k-mer indices...',
      '[ENGINE] Graph intersection matches identified in block #1042',
      '[RESULT] Pattern MATCH found!',
      '[RESULT] Location coordinates: Chr17 [35201449 - 35201480]',
      '[RESULT] Context: SARS-CoV-2 Spike Protein Receptor Binding Domain Alignment',
      '[RESULT] Latency: 2.14 ms | Integrity: VALIDATED (SHA-256 matches)'
    ],
    'CGTACGTACGTACGTACGTACGTACGTACG': [
      '[SYSTEM] Initializing gu256 client search engine...',
      '[SYSTEM] Target pattern: CGTACGTACGTACGTACGTACGTACGTACG (K=31)',
      '[ENGINE] Querying local genome codebook tables...',
      '[ENGINE] Scanning bit vectors for reference overlaps...',
      '[RESULT] Pattern MATCH found!',
      '[RESULT] Location coordinates: Chr7 [117232201 - 117232232]',
      '[RESULT] Context: CFTR Cystic Fibrosis Transmembrane conductance regulator variant candidate',
      '[RESULT] Latency: 3.82 ms | Integrity: VALIDATED'
    ],
    'AAAAAGGGGGTTTTTCCCCCAAAAAGGGGG': [
      '[SYSTEM] Initializing gu256 client search engine...',
      '[SYSTEM] Target pattern: AAAAAGGGGGTTTTTCCCCCAAAAAGGGGG (K=31)',
      '[ENGINE] Scanning structural repeat arrays...',
      '[RESULT] Pattern MATCH found!',
      '[RESULT] Location coordinates: ChrX [4802 - 4833] (Telomeric Segment)',
      '[RESULT] Hit Frequency: 1,482 occurrences detected across reads',
      '[RESULT] Latency: 2.91 ms | Integrity: VALIDATED'
    ]
  };
  
  function executeSearchQuery() {
    const selectedPattern = querySelect.value;
    const outputs = queryOutputs[selectedPattern];
    if (!outputs) return;
    
    runQueryBtn.disabled = true;
    terminalOutput.innerText = '';
    
    // Add glowing border to archive closed container representing search pinging the closed shell
    archiveShield.style.borderColor = 'var(--accent-cyan)';
    archiveShield.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.3)';
    
    let lineIdx = 0;
    function printNextLine() {
      if (lineIdx < outputs.length) {
        terminalOutput.innerText += outputs[lineIdx] + '\n';
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        lineIdx++;
        // Print lines rapidly to simulate real query times
        setTimeout(printNextLine, 150);
      } else {
        runQueryBtn.disabled = false;
        // Reset shield style
        archiveShield.style.borderColor = '';
        archiveShield.style.boxShadow = '';
      }
    }
    
    printNextLine();
  }
  
  if (runQueryBtn) {
    runQueryBtn.addEventListener('click', executeSearchQuery);
  }

  // ==========================================================================
  // 9. Genomic AI Canvas Particle Flow (Section 5)
  // ==========================================================================
  const aiCanvas = document.getElementById('tensor-particles-canvas');
  let aiCtx = null;
  let aiParticles = [];
  let aiAnimFrame = null;
  
  function initAiCanvas() {
    if (!aiCanvas) return;
    aiCtx = aiCanvas.getContext('2d');
    
    const wrapper = aiCanvas.parentElement;
    aiCanvas.width = wrapper.clientWidth;
    aiCanvas.height = wrapper.clientHeight;
    
    aiParticles = [];
    // Generate streams of numerical particles flowing from left (genome) to right (model)
    for (let i = 0; i < 40; i++) {
      resetAiParticle(i);
    }
  }
  
  function resetAiParticle(idx) {
    const canvasWidth = aiCanvas.width;
    const canvasHeight = aiCanvas.height;
    
    // Random position on the left or middle
    aiParticles[idx] = {
      x: Math.random() * (canvasWidth * 0.2),
      y: (canvasHeight * 0.3) + Math.random() * (canvasHeight * 0.4),
      value: Math.random() > 0.5 ? '1' : '0',
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.7 + 0.3,
      size: Math.floor(Math.random() * 8 + 8)
    };
  }
  
  function animateAiParticles() {
    if (!aiCtx || !aiCanvas) return;
    aiCtx.clearRect(0, 0, aiCanvas.width, aiCanvas.height);
    
    const canvasWidth = aiCanvas.width;
    const canvasHeight = aiCanvas.height;
    
    aiCtx.font = "bold 10px monospace";
    
    aiParticles.forEach((p, idx) => {
      p.x += p.speed;
      
      // Add wave movement in y axis
      p.y += Math.sin(p.x / 30) * 0.8;
      
      aiCtx.beginPath();
      aiCtx.fillStyle = '#3B82F6';
      aiCtx.globalAlpha = p.opacity;
      
      // Render text numbers for tensors (0 or 1)
      aiCtx.fillText(p.value, p.x, p.y);
      
      // Draw path connections to show model ingestion in the last sector
      if (p.x > canvasWidth * 0.8) {
        aiCtx.globalAlpha = p.opacity * 0.3;
        aiCtx.strokeStyle = '#06B6D4';
        aiCtx.beginPath();
        aiCtx.moveTo(p.x, p.y);
        aiCtx.lineTo(canvasWidth * 0.9, canvasHeight * 0.5);
        aiCtx.stroke();
      }
      
      // If particle reaches the end, reset it to the start
      if (p.x > canvasWidth * 0.9) {
        resetAiParticle(idx);
      }
    });
    
    aiAnimFrame = requestAnimationFrame(animateAiParticles);
  }
  
  // Resize handler for AI canvas
  window.addEventListener('resize', () => {
    if (aiCanvas) {
      initAiCanvas();
    }
  });

  // ==========================================================================
  // 10. Self-Healing Simulator Blocks (Section 6)
  // ==========================================================================
  const blocksContainer = document.getElementById('blocks-grid-container');
  const corruptBtn = document.getElementById('corrupt-btn');
  const repairBtn = document.getElementById('repair-btn');
  
  const blockCount = 64;
  const blocks = [];
  
  function initBlocksGrid() {
    if (!blocksContainer) return;
    blocksContainer.innerHTML = '';
    blocks.length = 0;
    
    for (let i = 0; i < blockCount; i++) {
      const block = document.createElement('div');
      block.className = 'grid-block';
      block.title = `Block #${i + 1} Status: Verified`;
      blocksContainer.appendChild(block);
      blocks.push(block);
    }
  }
  
  let corruptedIndices = [];
  
  function simulateBitRot() {
    corruptedIndices = [];
    // Reset any previously repaired blocks back to original state
    blocks.forEach(b => {
      b.className = 'grid-block';
      b.style.transform = '';
    });
    
    // Randomly select 8-12 blocks to corrupt
    const numToCorrupt = Math.floor(Math.random() * 5) + 8;
    while (corruptedIndices.length < numToCorrupt) {
      const idx = Math.floor(Math.random() * blockCount);
      if (!corruptedIndices.includes(idx)) {
        corruptedIndices.push(idx);
      }
    }
    
    corruptedIndices.forEach(idx => {
      blocks[idx].classList.add('corrupted');
      blocks[idx].title = `Block #${idx + 1} Status: Bit-Rot Corrupted (Checksum Error)`;
    });
    
    corruptBtn.disabled = true;
    repairBtn.disabled = false;
  }
  
  function runReedSolomonRepair() {
    repairBtn.disabled = true;
    let repairStep = 0;
    
    function repairNextBlock() {
      if (repairStep < corruptedIndices.length) {
        const idx = corruptedIndices[repairStep];
        const block = blocks[idx];
        
        block.classList.remove('corrupted');
        block.classList.add('repaired');
        block.title = `Block #${idx + 1} Status: Restored via Reed-Solomon RS(255,223)`;
        
        repairStep++;
        // Cascade repairs
        setTimeout(repairNextBlock, 150);
      } else {
        // Complete
        setTimeout(() => {
          // Reset repaired block sizes back to normal standard
          blocks.forEach(b => {
            if (b.classList.contains('repaired')) {
              b.classList.remove('repaired');
              b.style.transform = '';
            }
          });
          corruptBtn.disabled = false;
        }, 1200);
      }
    }
    
    repairNextBlock();
  }
  
  if (corruptBtn && repairBtn) {
    corruptBtn.addEventListener('click', simulateBitRot);
    repairBtn.addEventListener('click', runReedSolomonRepair);
  }

  // ==========================================================================
  // 11. Ecosystem Node Graph Connections (Section 7)
  // ==========================================================================
  const mapSvg = document.getElementById('ecosystem-map');
  const linesGroup = document.getElementById('map-lines');
  
  const outerNodeIds = ['node-sequencers', 'node-models', 'node-labs', 'node-hospitals', 'node-biobanks', 'node-government'];
  
  function drawMapNetworkLines() {
    if (!mapSvg || !linesGroup) return;
    linesGroup.innerHTML = '';
    
    const coreNode = document.getElementById('node-core');
    const coreX = 400;
    const coreY = 200;
    
    outerNodeIds.forEach(id => {
      const nodeEl = document.getElementById(id);
      if (!nodeEl) return;
      
      // Extract translation coordinates
      const transformAttr = nodeEl.getAttribute('transform');
      const coords = transformAttr.match(/translate\(([^,]+),\s*([^)]+)\)/);
      if (!coords) return;
      
      const nodeX = parseFloat(coords[1]);
      const nodeY = parseFloat(coords[2]);
      
      // Draw background network line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', coreX);
      line.setAttribute('y1', coreY);
      line.setAttribute('x2', nodeX);
      line.setAttribute('y2', nodeY);
      line.setAttribute('class', 'network-line');
      line.id = `line-${id}`;
      linesGroup.appendChild(line);
      
      // Draw data pulse circle traversing the line
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('r', '4');
      pulse.setAttribute('class', 'network-pulse');
      linesGroup.appendChild(pulse);
      
      animateNodePulse(pulse, coreX, coreY, nodeX, nodeY);
    });
  }
  
  function animateNodePulse(pulseEl, x1, y1, x2, y2) {
    const duration = 2000 + Math.random() * 1500;
    const startTime = performance.now();
    
    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      
      // Interpolate coordinates
      const currX = x1 + (x2 - x1) * progress;
      const currY = y1 + (y2 - y1) * progress;
      
      pulseEl.setAttribute('cx', currX);
      pulseEl.setAttribute('cy', currY);
      
      // Vary opacity based on progress
      pulseEl.setAttribute('opacity', (1 - progress).toString());
      
      requestAnimationFrame(step);
    }
    
    requestAnimationFrame(step);
  }
  
  // Connect hover events to highlight paths
  outerNodeIds.forEach(id => {
    const nodeEl = document.getElementById(id);
    if (!nodeEl) return;
    
    nodeEl.addEventListener('mouseenter', () => {
      const line = document.getElementById(`line-${id}`);
      if (line) line.classList.add('active');
    });
    
    nodeEl.addEventListener('mouseleave', () => {
      const line = document.getElementById(`line-${id}`);
      if (line) line.classList.remove('active');
    });
  });

  // ==========================================================================
  // 12. ARCS MST Graph Spanning Tree Canvas (Section 8)
  // ==========================================================================
  const arcsCanvas = document.getElementById('arcs-graph-canvas');
  let arcsCtx = null;
  let arcsNodes = [];
  let arcsConnections = [];
  let arcsAnimFrame = null;
  
  function initArcsGraph() {
    if (!arcsCanvas) return;
    arcsCtx = arcsCanvas.getContext('2d');
    
    const wrapper = arcsCanvas.parentElement;
    arcsCanvas.width = wrapper.clientWidth;
    arcsCanvas.height = wrapper.clientHeight;
    
    arcsNodes = [];
    arcsConnections = [];
    
    const nodeCount = 14;
    
    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      arcsNodes.push({
        x: 40 + Math.random() * (arcsCanvas.width - 80),
        y: 40 + Math.random() * (arcsCanvas.height - 80),
        radius: Math.random() * 3 + 3,
        pulseRadius: 0,
        pulseSpeed: 0.05 + Math.random() * 0.05,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4
      });
    }
    
    // Build a simple Minimum Spanning Tree (MST) structure by connecting nodes
    // Sort nodes based on proximity and connect sequentially to form a spanning graph
    for (let i = 0; i < arcsNodes.length - 1; i++) {
      arcsConnections.push({
        from: i,
        to: i + 1,
        opacity: Math.random() * 0.3 + 0.1
      });
      // Add occasional secondary branches
      if (i > 2 && Math.random() > 0.7) {
        arcsConnections.push({
          from: i,
          to: i - 3,
          opacity: 0.15
        });
      }
    }
  }
  
  function animateArcsGraph() {
    if (!arcsCtx || !arcsCanvas) return;
    arcsCtx.clearRect(0, 0, arcsCanvas.width, arcsCanvas.height);
    
    const w = arcsCanvas.width;
    const h = arcsCanvas.height;
    
    // Update node positions gently
    arcsNodes.forEach(node => {
      node.x += node.speedX;
      node.y += node.speedY;
      
      if (node.x < 20 || node.x > w - 20) node.speedX *= -1;
      if (node.y < 20 || node.y > h - 20) node.speedY *= -1;
      
      // Update pulse radius
      node.pulseRadius += node.pulseSpeed;
      if (node.pulseRadius > 10) node.pulseRadius = 0;
      
      // Draw pulse glow
      arcsCtx.beginPath();
      arcsCtx.arc(node.x, node.y, node.radius + node.pulseRadius, 0, Math.PI * 2);
      arcsCtx.strokeStyle = 'var(--accent-blue)';
      arcsCtx.globalAlpha = (1 - (node.pulseRadius / 10)) * 0.3;
      arcsCtx.stroke();
      
      // Draw core node
      arcsCtx.beginPath();
      arcsCtx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      arcsCtx.fillStyle = '#F8FAFC';
      arcsCtx.globalAlpha = 0.8;
      arcsCtx.fill();
    });
    
    // Draw Spanning Tree branches
    arcsCtx.strokeStyle = '#3B82F6';
    arcsConnections.forEach(conn => {
      const fromNode = arcsNodes[conn.from];
      const toNode = arcsNodes[conn.to];
      
      if (fromNode && toNode) {
        arcsCtx.beginPath();
        arcsCtx.moveTo(fromNode.x, fromNode.y);
        arcsCtx.lineTo(toNode.x, toNode.y);
        arcsCtx.lineWidth = 1;
        arcsCtx.globalAlpha = conn.opacity;
        arcsCtx.stroke();
      }
    });
    
    arcsAnimFrame = requestAnimationFrame(animateArcsGraph);
  }
  
  window.addEventListener('resize', () => {
    if (arcsCanvas) {
      initArcsGraph();
    }
  });

  // ==========================================================================
  // 13. Vision Statements Highlight (Section 10)
  // ==========================================================================
  const visionSection = document.getElementById('vision-section');
  const visionStmts = document.querySelectorAll('.vision-stmt');
  
  function highlightVisionStatements() {
    if (!visionSection || visionStmts.length === 0) return;
    
    const rect = visionSection.getBoundingClientRect();
    const sectionHeight = rect.height;
    
    // Calculate progress through this section
    let progress = -rect.top / (sectionHeight - window.innerHeight);
    progress = Math.max(0, Math.min(1, progress));
    
    // Highlight one statement at a time sequentially based on progress
    const segment = 1 / visionStmts.length;
    
    visionStmts.forEach((stmt, idx) => {
      const segmentStart = idx * segment;
      const segmentEnd = (idx + 1) * segment;
      
      if (progress >= segmentStart && progress < segmentEnd) {
        stmt.classList.add('highlighted');
      } else {
        stmt.classList.remove('highlighted');
      }
    });
  }
  
  window.addEventListener('scroll', () => {
    window.requestAnimationFrame(highlightVisionStatements);
  });

  // ==========================================================================
  // 14. Initialize Components Function
  // ==========================================================================
  function initializeInteractiveComponents() {
    // 1. Initial trigger of reveals
    animateRevealElements();
    
    // 2. Initial trigger of scroll progress dot rail
    updateRailProgress();
    
    // 3. Load initial benchmark dataset
    loadBenchmarkDataset('human');
    
    // 4. Draw ecosystem map connecting elements
    drawMapNetworkLines();
    
    // 5. Initialize Self-Healing blocks
    initBlocksGrid();
    
    // 6. Initialize AI canvas particles
    if (aiCanvas) {
      initAiCanvas();
      animateAiParticles();
    }
    
    // 7. Initialize ARCS MST Graph
    if (arcsCanvas) {
      initArcsGraph();
      animateArcsGraph();
    }
  }
  
  // Direct scroll setup for performance
  window.addEventListener('scroll', () => {
    animateRevealElements();
  });
  
});
