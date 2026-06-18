// System Global State Management
const state = {
    currentTab: 'text',
    primaryColor: '#2563EB',
    gradientColor: '#00D2FF',
    colorMode: 'solid', // solid, gradient
    bgColor: '#FFFFFF',
    moduleStyle: 'classic', // classic, rounded, dots, liquid
    eyeStyle: 'classic', // classic, rounded, circular
    logoType: 'none', // none, custom, link, wifi, mail, shield
    customLogoDataUrl: null,
    canvasSize: 1024, // Internal High-Res generation size
    qrContent: 'https://google.com',
    generationProgress: 1.0,
    isAnimateCompiling: false
};

const qrCanvas = document.getElementById('qrCanvas');
const ctx = qrCanvas.getContext('2d');
const ambientBgCanvas = document.getElementById('ambientBgCanvas');
const bgCtx = ambientBgCanvas.getContext('2d');
const previewCard = document.getElementById('previewCard');
const glareEffect = document.getElementById('glareEffect');

window.onload = function() {
    lucide.createIcons();
    initAmbientCanvas();
    setup3DTilt();
    updateQRRealtime();
    triggerBuildUpAnimation();
};

let particles = [];
let mouseX = 0;
let mouseY = 0;

function initAmbientCanvas() {
    resizeBgCanvas();
    window.addEventListener('resize', resizeBgCanvas);
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    particles = [];
    const particleCount = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 25000));
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * ambientBgCanvas.width,
            y: Math.random() * ambientBgCanvas.height,
            radius: Math.random() * 2 + 1,
            color: Math.random() > 0.5 ? 'rgba(37, 99, 235, 0.15)' : 'rgba(0, 210, 255, 0.15)',
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4
        });
    }
    requestAnimationFrame(animateAmbientCanvas);
}

function resizeBgCanvas() {
    ambientBgCanvas.width = window.innerWidth;
    ambientBgCanvas.height = window.innerHeight;
}

function animateAmbientCanvas() {
    bgCtx.clearRect(0, 0, ambientBgCanvas.width, ambientBgCanvas.height);
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = ambientBgCanvas.width;
        if (p.x > ambientBgCanvas.width) p.x = 0;
        if (p.y < 0) p.y = ambientBgCanvas.height;
        if (p.y > ambientBgCanvas.height) p.y = 0;
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 250) {
            p.x += (dx / dist) * 0.15;
            p.y += (dy / dist) * 0.15;
        }
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        bgCtx.fillStyle = p.color;
        bgCtx.fill();
        for (let j = index + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const d = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (d < 120) {
                const alpha = (1 - d / 120) * 0.08;
                bgCtx.beginPath();
                bgCtx.moveTo(p.x, p.y);
                bgCtx.lineTo(p2.x, p2.y);
                bgCtx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
                bgCtx.lineWidth = 0.5;
                bgCtx.stroke();
            }
        }
    });
    requestAnimationFrame(animateAmbientCanvas);
}

function setup3DTilt() {
    previewCard.addEventListener('mousemove', (e) => {
        const rect = previewCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((centerY - y) / centerY) * 10;
        const rotateY = ((x - centerX) / centerX) * 10;
        previewCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        glareEffect.style.opacity = '1';
        glareEffect.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 60%)`;
    });
    previewCard.addEventListener('mouseleave', () => {
        previewCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        glareEffect.style.opacity = '0';
    });
}

function switchInputType(type) {
    state.currentTab = type;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab', 'bg-tech-600', 'text-white', 'shadow-md');
        btn.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100');
    });
    const activeBtn = document.getElementById(`tab-${type}`);
    activeBtn.classList.add('active-tab', 'bg-tech-600', 'text-white', 'shadow-md');
    activeBtn.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100');
    document.querySelectorAll('.input-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    document.getElementById(`panel-${type}`).classList.remove('hidden');
    updateQRRealtime();
    triggerBuildUpAnimation();
}

function updateCharCount(len) {
    document.getElementById('charCount').textContent = `${len} character${len === 1 ? '' : 's'}`;
}

async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            document.getElementById('inputText').value = text;
            updateQRRealtime();
            showNotification('success', 'Content Cloned', 'Clipboard data pasted cleanly.');
        }
    } catch (err) {
        showNotification('info', 'System Access Needed', 'Please allow clipboard permissions to paste contents.');
    }
}

function clearInput(elementId) {
    document.getElementById(elementId).value = '';
    updateQRRealtime();
}

function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(`eye-${fieldId}`);
    if (field.type === 'password') {
        field.type = 'text';
        eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
        field.type = 'password';
        eyeIcon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

function setColorMode(mode) {
    state.colorMode = mode;
    const btnSolid = document.getElementById('colorModeSolid');
    const btnGrad = document.getElementById('colorModeGradient');
    const gradContainer = document.getElementById('gradColorContainer');
    if (mode === 'solid') {
        btnSolid.classList.add('bg-white', 'text-tech-600', 'shadow-sm');
        btnSolid.classList.remove('text-slate-500');
        btnGrad.classList.remove('bg-white', 'text-tech-600', 'shadow-sm');
        btnGrad.classList.add('text-slate-500');
        gradContainer.classList.add('hidden');
    } else {
        btnGrad.classList.add('bg-white', 'text-tech-600', 'shadow-sm');
        btnGrad.classList.remove('text-slate-500');
        btnSolid.classList.remove('bg-white', 'text-tech-600', 'shadow-sm');
        btnSolid.classList.add('text-slate-500');
        gradContainer.classList.remove('hidden');
    }
    updateQRRealtime();
}

function applyPreset(primary, secondary, mode) {
    document.getElementById('primaryColor').value = primary;
    document.getElementById('gradientColor').value = secondary;
    state.primaryColor = primary;
    state.gradientColor = secondary;
    setColorMode(mode);
}

function selectLogoPreset(type) {
    state.logoType = type;
    document.querySelectorAll('.logo-tab').forEach(tab => {
        tab.classList.remove('active-logo', 'bg-tech-600', 'text-white', 'border-tech-500');
        tab.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
    });
    document.querySelectorAll('.logo-preset').forEach(btn => {
        btn.classList.remove('bg-tech-100', 'text-tech-600');
    });
    const uploadContainer = document.getElementById('customLogoUploadContainer');
    uploadContainer.classList.add('hidden');
    if (type === 'none') {
        document.getElementById('logo-none').classList.add('active-logo', 'bg-tech-600', 'text-white', 'border-tech-500');
    } else if (type === 'custom') {
        document.getElementById('logo-custom').classList.add('active-logo', 'bg-tech-600', 'text-white', 'border-tech-500');
        uploadContainer.classList.remove('hidden');
    } else {
        document.getElementById(`logo-${type}`).classList.add('bg-tech-100', 'text-tech-600');
    }
    updateQRRealtime();
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
        showNotification('error', 'Asset Overflow', 'Logo size exceeds 500kb limits.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        state.customLogoDataUrl = e.target.result;
        document.getElementById('uploadedLogoLabel').textContent = `Loaded: ${file.name.substring(0,18)}...`;
        updateQRRealtime();
        showNotification('success', 'Central Logo Active', 'Custom image processed successfully.');
    };
    reader.readAsDataURL(file);
}

function getComputedInputData() {
    switch (state.currentTab) {
        case 'text':
            const textVal = document.getElementById('inputText').value.trim();
            updateCharCount(textVal.length);
            return textVal || 'https://google.com';
        case 'wifi':
            const ssid = document.getElementById('wifiSsid').value.trim();
            const auth = document.getElementById('wifiAuth').value;
            const pass = document.getElementById('wifiPass').value.trim();
            const authToggle = document.getElementById('wifiPasswordContainer');
            if (auth === 'nopass') {
                authToggle.classList.add('hidden');
                return `WIFI:S:${ssid};T:nopass;;`;
            } else {
                authToggle.classList.remove('hidden');
                return `WIFI:S:${ssid};T:${auth};P:${pass};;`;
            }
        case 'vcard':
            const first = document.getElementById('vcardFirst').value.trim();
            const last = document.getElementById('vcardLast').value.trim();
            const org = document.getElementById('vcardOrg').value.trim();
            const job = document.getElementById('vcardTitle').value.trim();
            const phone = document.getElementById('vcardPhone').value.trim();
            const email = document.getElementById('vcardEmail').value.trim();
            const url = document.getElementById('vcardUrl').value.trim();
            return [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `N:${last};${first};;;`,
                `FN:${first} ${last}`,
                `ORG:${org}`,
                `TITLE:${job}`,
                `TEL;TYPE=CELL:${phone}`,
                `EMAIL;TYPE=PREF,INTERNET:${email}`,
                `URL:${url}`,
                'END:VCARD'
            ].join('\n');
        case 'email':
            const to = document.getElementById('emailTo').value.trim();
            const subject = encodeURIComponent(document.getElementById('emailSubject').value.trim());
            const body = encodeURIComponent(document.getElementById('emailBody').value.trim());
            return `mailto:${to}?subject=${subject}&body=${body}`;
        case 'sms':
            const tel = document.getElementById('smsPhone').value.trim();
            const msg = document.getElementById('smsText').value.trim();
            return `SMSTO:${tel}:${msg}`;
    }
    return 'https://google.com';
}

function updateQRRealtime() {
    state.primaryColor = document.getElementById('primaryColor').value;
    state.gradientColor = document.getElementById('gradientColor').value;
    state.bgColor = document.getElementById('bgColor').value;
    state.moduleStyle = document.getElementById('moduleStyle').value;
    state.eyeStyle = document.getElementById('eyeStyle').value;
    const rawContent = getComputedInputData();
    state.qrContent = rawContent;
    qrCanvas.width = state.canvasSize;
    qrCanvas.height = state.canvasSize;
    try {
        const ecLevel = document.getElementById('errorCorrection').value;
        const qr = qrcode(0, ecLevel);
        qr.addData(rawContent);
        qr.make();
        const moduleCount = qr.getModuleCount();
        renderQRDesign(qr, moduleCount);
        document.getElementById('quickSpecs').textContent = `Grid size: ${moduleCount}x${moduleCount}`;
        document.getElementById('hudResolution').textContent = `${document.getElementById('exportSize').value}px`;
    } catch (err) {
        console.error('QR Blueprint configuration overflow:', err);
    }
}

function renderQRDesign(qr, count) {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, state.canvasSize, state.canvasSize);
    const padding = 64;
    const drawAreaSize = state.canvasSize - (padding * 2);
    const cellSize = drawAreaSize / count;
    let fgStyle;
    if (state.colorMode === 'gradient') {
        fgStyle = ctx.createLinearGradient(padding, padding, state.canvasSize - padding, state.canvasSize - padding);
        fgStyle.addColorStop(0, state.primaryColor);
        fgStyle.addColorStop(1, state.gradientColor);
    } else {
        fgStyle = state.primaryColor;
    }
    ctx.fillStyle = fgStyle;
    const isEyeModule = (row, col) => {
        if (row < 7 && col < 7) return true;
        if (row < 7 && col >= count - 7) return true;
        if (row >= count - 7 && col < 7) return true;
        return false;
    };
    const centerMargin = Math.floor(count * 0.22);
    const centerStart = Math.floor((count - centerMargin) / 2);
    const centerEnd = centerStart + centerMargin;
    const isCenterLogoRegion = (row, col) => {
        if (state.logoType === 'none') return false;
        return (row >= centerStart && row < centerEnd && col >= centerStart && col < centerEnd);
    };
    for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
            if (isEyeModule(r, c) || isCenterLogoRegion(r, c)) continue;
            if (qr.isDark(r, c)) {
                const x = padding + (c * cellSize);
                const y = padding + (r * cellSize);
                const dynamicScale = state.generationProgress;
                const cellPadding = (cellSize * (1 - dynamicScale)) / 2;
                const currentCellSize = cellSize * dynamicScale;
                ctx.fillStyle = fgStyle;
                if (state.moduleStyle === 'dots') {
                    ctx.beginPath();
                    ctx.arc(x + cellSize / 2, y + cellSize / 2, (currentCellSize / 2) * 0.82, 0, Math.PI * 2);
                    ctx.fill();
                } else if (state.moduleStyle === 'rounded') {
                    drawRoundedRect(ctx, x + cellPadding, y + cellPadding, currentCellSize * 0.9, currentCellSize * 0.9, currentCellSize * 0.25);
                } else if (state.moduleStyle === 'liquid') {
                    const top = r > 0 && qr.isDark(r - 1, c) && !isEyeModule(r - 1, c);
                    const bottom = r < count - 1 && qr.isDark(r + 1, c) && !isEyeModule(r + 1, c);
                    const left = c > 0 && qr.isDark(r, c - 1) && !isEyeModule(r, c - 1);
                    const right = c < count - 1 && qr.isDark(r, c + 1) && !isEyeModule(r, c + 1);
                    drawLiquidModule(ctx, x, y, cellSize, top, bottom, left, right, dynamicScale);
                } else {
                    ctx.fillRect(x + cellPadding, y + cellPadding, currentCellSize, currentCellSize);
                }
            }
        }
    }
    drawPositionPattern(ctx, padding, padding, cellSize, state.eyeStyle, fgStyle);
    drawPositionPattern(ctx, padding + (count - 7) * cellSize, padding, cellSize, state.eyeStyle, fgStyle);
    drawPositionPattern(ctx, padding, padding + (count - 7) * cellSize, cellSize, state.eyeStyle, fgStyle);
    if (state.logoType !== 'none') {
        drawBrandLogo(ctx, drawAreaSize, padding, fgStyle);
    }
}

function drawRoundedRect(canvasCtx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x + r, y);
    canvasCtx.arcTo(x + w, y, x + w, y + h, r);
    canvasCtx.arcTo(x + w, y + h, x, y + h, r);
    canvasCtx.arcTo(x, y + h, x, y, r);
    canvasCtx.arcTo(x, y, x + w, y, r);
    canvasCtx.closePath();
    canvasCtx.fill();
}

function drawLiquidModule(canvasCtx, x, y, size, t, b, l, r, scale) {
    const radius = (size / 2) * scale;
    const cx = x + size / 2;
    const cy = y + size / 2;
    canvasCtx.beginPath();
    canvasCtx.arc(cx, cy, radius * 0.9, 0, Math.PI * 2);
    canvasCtx.fill();
    canvasCtx.fillStyle = ctx.fillStyle;
    const bridgeW = size * 0.45;
    if (t && scale > 0.8) canvasCtx.fillRect(cx - bridgeW / 2, y, bridgeW, size / 2);
    if (b && scale > 0.8) canvasCtx.fillRect(cx - bridgeW / 2, cy, bridgeW, size / 2);
    if (l && scale > 0.8) canvasCtx.fillRect(x, cy - bridgeW / 2, size / 2, bridgeW);
    if (r && scale > 0.8) canvasCtx.fillRect(cx, cy - bridgeW / 2, size / 2, bridgeW);
}

function drawPositionPattern(canvasCtx, x, y, cellSize, style, fgStyle) {
    const eyeSize = cellSize * 7;
    canvasCtx.fillStyle = fgStyle;
    if (style === 'circular') {
        canvasCtx.beginPath();
        canvasCtx.arc(x + eyeSize / 2, y + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
        canvasCtx.arc(x + eyeSize / 2, y + eyeSize / 2, eyeSize / 2 - cellSize, 0, Math.PI * 2, true);
        canvasCtx.fill();
        canvasCtx.beginPath();
        canvasCtx.arc(x + eyeSize / 2, y + eyeSize / 2, eyeSize / 2 - cellSize * 2, 0, Math.PI * 2);
        canvasCtx.fill();
    } else if (style === 'rounded') {
        canvasCtx.beginPath();
        drawRoundedRect(canvasCtx, x, y, eyeSize, eyeSize, eyeSize * 0.28);
        canvasCtx.fillStyle = state.bgColor;
        drawRoundedRect(canvasCtx, x + cellSize, y + cellSize, eyeSize - cellSize * 2, eyeSize - cellSize * 2, (eyeSize - cellSize * 2) * 0.25);
        canvasCtx.fillStyle = fgStyle;
        drawRoundedRect(canvasCtx, x + cellSize * 2, y + cellSize * 2, eyeSize - cellSize * 4, eyeSize - cellSize * 4, (eyeSize - cellSize * 4) * 0.22);
    } else {
        canvasCtx.fillRect(x, y, eyeSize, eyeSize);
        canvasCtx.fillStyle = state.bgColor;
        canvasCtx.fillRect(x + cellSize, y + cellSize, eyeSize - cellSize * 2, eyeSize - cellSize * 2);
        canvasCtx.fillStyle = fgStyle;
        canvasCtx.fillRect(x + cellSize * 2, y + cellSize * 2, eyeSize - cellSize * 4, eyeSize - cellSize * 4);
    }
}

function drawBrandLogo(canvasCtx, drawAreaSize, padding, fgStyle) {
    const logoContainerSize = state.canvasSize * 0.2;
    const logoInteriorSize = logoContainerSize * 0.72;
    const centerPos = (state.canvasSize - logoContainerSize) / 2;
    canvasCtx.fillStyle = state.bgColor;
    drawRoundedRect(canvasCtx, centerPos, centerPos, logoContainerSize, logoContainerSize, logoContainerSize * 0.3);
    canvasCtx.strokeStyle = 'rgba(37, 99, 235, 0.08)';
    canvasCtx.lineWidth = 4;
    canvasCtx.stroke();
    const iconCenter = centerPos + (logoContainerSize - logoInteriorSize) / 2;
    if (state.logoType === 'custom' && state.customLogoDataUrl) {
        const img = new Image();
        img.src = state.customLogoDataUrl;
        if (img.complete) {
            canvasCtx.drawImage(img, iconCenter, iconCenter, logoInteriorSize, logoInteriorSize);
        } else {
            img.onload = () => {
                canvasCtx.drawImage(img, iconCenter, iconCenter, logoInteriorSize, logoInteriorSize);
            };
        }
    } else if (state.logoType !== 'none') {
        canvasCtx.fillStyle = fgStyle;
        drawSvgPreset(canvasCtx, state.logoType, iconCenter, iconCenter, logoInteriorSize);
    }
}

function drawSvgPreset(canvasCtx, type, x, y, size) {
    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.scale(size / 24, size / 24);
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = state.primaryColor;
    canvasCtx.lineWidth = 2.2;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
    if (type === 'link') {
        canvasCtx.arc(12, 12, 10, 0, Math.PI * 2);
        canvasCtx.moveTo(2, 12);
        canvasCtx.lineTo(22, 12);
        canvasCtx.ellipse(12, 12, 4, 10, 0, 0, Math.PI * 2);
        canvasCtx.stroke();
    } else if (type === 'wifi') {
        canvasCtx.moveTo(12, 19.5);
        canvasCtx.arc(12, 19.5, 0.5, 0, Math.PI * 2);
        canvasCtx.fillStyle = state.primaryColor;
        canvasCtx.fill();
        canvasCtx.beginPath();
        canvasCtx.arc(12, 19.5, 5, -Math.PI * 0.75, -Math.PI * 0.25);
        canvasCtx.stroke();
        canvasCtx.beginPath();
        canvasCtx.arc(12, 19.5, 10, -Math.PI * 0.75, -Math.PI * 0.25);
        canvasCtx.stroke();
        canvasCtx.beginPath();
        canvasCtx.arc(12, 19.5, 15, -Math.PI * 0.75, -Math.PI * 0.25);
        canvasCtx.stroke();
    } else if (type === 'mail') {
        canvasCtx.rect(3, 5, 18, 14);
        canvasCtx.moveTo(3, 7);
        canvasCtx.lineTo(12, 13);
        canvasCtx.lineTo(21, 7);
        canvasCtx.stroke();
    } else if (type === 'shield') {
        canvasCtx.rect(5, 11, 14, 10);
        canvasCtx.moveTo(9, 11);
        canvasCtx.arc(12, 11, 3, Math.PI, 0);
        canvasCtx.stroke();
    }
    canvasCtx.restore();
}

function triggerBuildUpAnimation() {
    if (state.isAnimateCompiling) return;
    state.isAnimateCompiling = true;
    const scanner = document.getElementById('scannerLine');
    scanner.classList.remove('hidden');
    let start = null;
    const duration = 850;
    function step(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1.0);
        state.generationProgress = easeOutBack(progress);
        updateQRRealtime();
        if (progress < 1.0) {
            requestAnimationFrame(step);
        } else {
            state.generationProgress = 1.0;
            updateQRRealtime();
            state.isAnimateCompiling = false;
        }
    }
    requestAnimationFrame(step);
}

function easeOutBack(x) {
    const c1 = 1.30158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function downloadQR() {
    const targetResolution = parseInt(document.getElementById('exportSize').value);
    const dlCanvas = document.createElement('canvas');
    dlCanvas.width = targetResolution;
    dlCanvas.height = targetResolution;
    const dlCtx = dlCanvas.getContext('2d');
    const scaleFactor = targetResolution / state.canvasSize;
    dlCtx.scale(scaleFactor, scaleFactor);
    dlCtx.drawImage(qrCanvas, 0, 0);
    const image = dlCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-studio-architect-${targetResolution}x${targetResolution}.png`;
    link.href = image;
    link.click();
    confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.8 },
        colors: [state.primaryColor, state.gradientColor, '#10B981']
    });
    showNotification('success', 'Blueprint Saved', 'High-fidelity asset saved successfully.');
}

async function copyToClipboard() {
    try {
        qrCanvas.toBlob(async (blob) => {
            if (!blob) {
                showNotification('error', 'Clipboard Error', 'Fail to compile vector structure.');
                return;
            }
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                showNotification('success', 'Asset Copied', 'QR Image cloned to system clipboard.');
            } catch (err) {
                showNotification('info', 'Secure Safe Mode', 'Clipboard image copy blocked. Try downloading.');
            }
        });
    } catch (err) {
        showNotification('error', 'Failure', 'Browser block clipboard capabilities.');
    }
}

async function triggerWebShare() {
    if (navigator.share) {
        try {
            qrCanvas.toBlob(async (blob) => {
                const file = new File([blob], 'matrix-qr.png', { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: 'QR Studio Architect',
                    text: 'Scan this customized high-tech code segment.'
                });
            }, 'image/png');
        } catch (err) {
            console.log('Share operations aborted');
        }
    } else {
        showNotification('info', 'System Access Status', 'Web Share is only supported on mobile platforms.');
    }
}

function showNotification(type, title, message) {
    const toast = document.getElementById('notificationToast');
    const iconWrap = document.getElementById('toastIcon');
    const tTitle = document.getElementById('toastTitle');
    const tMessage = document.getElementById('toastMessage');
    toast.className = toast.className.replace(/border-l-\w+-\d+/g, '');
    if (type === 'success') {
        toast.classList.add('border-l-emerald-500');
        iconWrap.className = 'w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600';
        iconWrap.innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5"></i>';
    } else if (type === 'error') {
        toast.classList.add('border-l-rose-500');
        iconWrap.className = 'w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600';
        iconWrap.innerHTML = '<i data-lucide="alert-triangle" class="w-5 h-5"></i>';
    } else {
        toast.classList.add('border-l-tech-500');
        iconWrap.className = 'w-8 h-8 rounded-full bg-tech-50 flex items-center justify-center text-tech-600';
        iconWrap.innerHTML = '<i data-lucide="info" class="w-5 h-5"></i>';
    }
    tTitle.textContent = title;
    tMessage.textContent = message;
    lucide.createIcons();
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 4500);
}

function showTutorial() {
    showNotification('info', 'Matrix Guide', 'Select dynamic presets, type inputs, and custom design vectors will compile live!');
}
