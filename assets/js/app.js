const GALLERY_DATA = [
    { id: 1, title: "Fenerbahçe", url: "https://livezival.github.io/sushipuzzle/assets/img/puzzles/fenerbahce.png" },
    { id: 2, title: "Sushi Süt", url: "https://livezival.github.io/sushipuzzle/assets/img/puzzles/sushi-süt.png" },
    { id: 3, title: "Sushi Keyif", url: "https://livezival.github.io/sushipuzzle/assets/img/puzzles/sushi-keyif.png" },
    { id: 4, title: "Pembiş Sushi", url: "https://livezival.github.io/sushipuzzle/assets/img/puzzles/pembiş-sushi.png" },
    { id: 5, title: "Valorant Clove", url: "https://livezival.github.io/sushipuzzle/assets/img/puzzles/valorant-clove.png" }
];

// DOM Elemanları
const canvas = document.getElementById('puzzleCanvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('imageInput');
const difficultySelect = document.getElementById('difficulty');
const resetBtn = document.getElementById('resetBtn');
const restartBtn = document.getElementById('restartBtn');
const toggleHintBtn = document.getElementById('toggleHint');
const progressText = document.getElementById('progress');
const winModal = document.getElementById('winModal');
const placeholder = document.getElementById('upload-placeholder');
const galToggleBtn = document.getElementById('galToggleBtn');
const galleryPanel = document.getElementById('gallery-panel');
const galleryGrid = document.getElementById('galleryGrid');

// Oyun Durum Değişkenleri
let img = null;
let pieces = [];
let difficulty = 4;
let showHint = false;
let isWon = false;
let board = { x: 0, y: 50, w: 0, h: 0 };
let laneWidth = 180;
let draggingPiece = null;
let offset = { x: 0, y: 0 };

// Başlangıç Fonksiyonları
initGallery();

function initGallery() {
    if (!galleryGrid) return;
    GALLERY_DATA.forEach(data => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${data.url}" alt="${data.title}">`;
        item.onclick = () => loadFromGallery(data.url);
        galleryGrid.appendChild(item);
    });
}

function loadFromGallery(url) {
    if (placeholder) placeholder.style.display = 'none';
    if (galleryPanel) galleryPanel.style.display = 'none';
    img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = setupGame;
    img.src = url;
    if (progressText) progressText.textContent = "RESİM YÜKLENİYOR...";
}

// Event Listeners
if (galToggleBtn) {
    galToggleBtn.onclick = () => {
        galleryPanel.style.display = galleryPanel.style.display === 'block' ? 'none' : 'block';
    };
}

if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            img = new Image();
            img.onload = setupGame;
            img.src = event.target.result;
            if (placeholder) placeholder.style.display = 'none';
            if (galleryPanel) galleryPanel.style.display = 'none';
        };
        reader.readAsDataURL(file);
    });
}

if (difficultySelect) difficultySelect.onchange = () => { if(img) setupGame(); };
if (resetBtn) resetBtn.onclick = () => { if(img) setupGame(); };
if (restartBtn) {
    restartBtn.onclick = () => { 
        winModal.style.display = 'none'; 
        if(img) setupGame(); 
    };
}

if (toggleHintBtn) {
    toggleHintBtn.onclick = () => {
        showHint = !showHint;
        toggleHintBtn.textContent = `İPUCU: ${showHint ? 'AÇIK' : 'KAPALI'}`;
    };
}

function setupGame() {
    difficulty = parseInt(difficultySelect.value);
    isWon = false;
    if (winModal) winModal.style.display = 'none';
    if (progressText) progressText.style.display = 'block';

    const aw = Math.min(window.innerWidth - 60, 1000);
    laneWidth = aw > 700 ? 180 : 0;
    const mbw = Math.min(aw - (laneWidth * 2), 550);
    const sc = mbw / img.width;
    
    board.w = mbw; 
    board.h = img.height * sc;
    canvas.width = board.w + (laneWidth * 2);
    canvas.height = Math.max(board.h + 150, 500);
    board.x = laneWidth; 
    board.y = (canvas.height - board.h) / 2 - 20;

    const pw = board.w / difficulty;
    const ph = board.h / difficulty;

    const rows = difficulty;
    const cols = difficulty;
    
    // Rastgele girinti/çıkıntı (tab) verilerini oluştur
    const hTabs = [];
    const vTabs = [];

    for (let r = 0; r < rows; r++) {
        hTabs[r] = [];
        for (let c = 0; c < cols - 1; c++) hTabs[r][c] = Math.random() > 0.5 ? 1 : -1;
    }
    for (let r = 0; r < rows - 1; r++) {
        vTabs[r] = [];
        for (let c = 0; c < cols; c++) vTabs[r][c] = Math.random() > 0.5 ? 1 : -1;
    }

    pieces = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const sideTypes = {
                top: r === 0 ? 0 : -vTabs[r - 1][c],
                right: c === cols - 1 ? 0 : hTabs[r][c],
                bottom: r === rows - 1 ? 0 : vTabs[r][c],
                left: c === 0 ? 0 : -hTabs[r][c - 1]
            };

            let rx, ry;
            if (laneWidth > 0) {
                const side = Math.random() > 0.5 ? 'left' : 'right';
                rx = (side === 'left') ? Math.random() * (laneWidth - pw - 10) : board.x + board.w + 10 + Math.random() * (laneWidth - pw - 10);
                ry = Math.random() * (canvas.height - ph);
            } else {
                rx = Math.random() * (canvas.width - pw);
                ry = board.y + board.h + 20 + Math.random() * (canvas.height - board.y - board.h - ph - 20);
            }

            pieces.push({
                id: r * cols + c,
                sx: (c * img.width) / cols, sy: (r * img.height) / rows,
                sw: img.width / cols, sh: img.height / rows,
                correctX: board.x + c * pw, correctY: board.y + r * ph,
                x: rx, y: ry,
                isLocked: false,
                sides: sideTypes
            });
        }
    }
    updateProgress();
    requestAnimationFrame(gameLoop);
}

/**
 * Yapboz parçasının yolunu çizer
 */
function drawJigsawPath(ctx, x, y, w, h, sides) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (sides.top === 0) ctx.lineTo(x + w, y); else drawBulb(ctx, x, y, x + w, y, sides.top);
    if (sides.right === 0) ctx.lineTo(x + w, y + h); else drawBulb(ctx, x + w, y, x + w, y + h, sides.right);
    if (sides.bottom === 0) ctx.lineTo(x, y + h); else drawBulb(ctx, x + w, y + h, x, y + h, sides.bottom);
    if (sides.left === 0) ctx.lineTo(x, y); else drawBulb(ctx, x, y + h, x, y, sides.left);
    ctx.closePath();
}

/**
 * Yapboz kulağını/çıkıntısını çizer
 */
function drawBulb(ctx, x1, y1, x2, y2, type) {
    const v = type; 
    const dx = x2 - x1; const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const h = dist * 0.22;
    const nx = -dy / dist; const ny = dx / dist;

    const p1x = x1 + dx * 0.38; const p1y = y1 + dy * 0.38;
    const p2x = x1 + dx * 0.62; const p2y = y1 + dy * 0.62;
    const midX = x1 + dx * 0.5 + nx * h * v; const midY = y1 + dy * 0.5 + ny * h * v;

    const cp1x = x1 + dx * 0.30 + nx * h * v * 0.5; const cp1y = y1 + dy * 0.30 + ny * h * v * 0.5;
    const cp2x = x1 + dx * 0.35 + nx * h * v * 1.3; const cp2y = y1 + dy * 0.35 + ny * h * v * 1.3;
    const cp3x = x1 + dx * 0.65 + nx * h * v * 1.3; const cp3y = y1 + dy * 0.65 + ny * h * v * 1.3;
    const cp4x = x1 + dx * 0.70 + nx * h * v * 0.5; const cp4y = y1 + dy * 0.70 + ny * h * v * 0.5;

    ctx.lineTo(p1x, p1y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, midX, midY);
    ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, p2x, p2y);
    ctx.lineTo(x2, y2);
}

function gameLoop() {
    if (!img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Tahta alanı
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(board.x - 4, board.y - 4, board.w + 8, board.h + 8, 12);
    else ctx.rect(board.x - 4, board.y - 4, board.w + 8, board.h + 8);
    ctx.fill();

    // İpucu
    if (showHint) { 
        ctx.globalAlpha = 0.12; 
        ctx.drawImage(img, board.x, board.y, board.w, board.h); 
        ctx.globalAlpha = 1.0; 
    }

    // Parçaları çiz
    pieces.filter(p => p.isLocked).forEach(p => drawPiece(p));
    pieces.filter(p => !p.isLocked && p !== draggingPiece).forEach(p => drawPiece(p));
    if (draggingPiece) drawPiece(draggingPiece, true);
    
    requestAnimationFrame(gameLoop);
}

function drawPiece(p, isDrag = false) {
    const pw = board.w / difficulty; 
    const ph = board.h / difficulty;
    ctx.save();
    
    if (isDrag) { 
        ctx.shadowBlur = 25; 
        ctx.shadowColor = "black"; 
        ctx.translate(-3, -3); 
    }
    
    // Jigsaw şeklini maske olarak kullan
    drawJigsawPath(ctx, p.x, p.y, pw, ph, p.sides);
    ctx.clip();
    
    // Resmi, girintileri de kapsayacak şekilde %160 boyutunda çiz
    const px = pw * 0.3; 
    const py = ph * 0.3;
    ctx.drawImage(img, p.sx - (p.sw*0.3), p.sy - (p.sh*0.3), p.sw*1.6, p.sh*1.6, p.x - px, p.y - py, pw*1.6, ph*1.6);
    
    // Kenarlık
    ctx.strokeStyle = p.isLocked ? "rgba(16, 185, 129, 0.4)" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2; 
    ctx.stroke();
    ctx.restore();
}

function onStart(e) {
    if (isWon) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    const pw = board.w / difficulty;
    
    // Tıklanan parçayı bul (kilitlenmemiş olanlar arasında en üstteki)
    draggingPiece = [...pieces].reverse().find(p => 
        !p.isLocked && x >= p.x - pw*0.2 && x <= p.x + pw*1.2 && y >= p.y - pw*0.2 && y <= p.y + pw*1.2
    );
    
    if (draggingPiece) { 
        offset.x = x - draggingPiece.x; 
        offset.y = y - draggingPiece.y; 
    }
}

function onMove(e) {
    if (!draggingPiece) return;
    const r = canvas.getBoundingClientRect();
    draggingPiece.x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) - offset.x;
    draggingPiece.y = ((e.touches ? e.touches[0].clientY : e.clientY) - r.top) - offset.y;
}

function onEnd() {
    if (!draggingPiece) return;
    // Yerine oturtma kontrolü (25 piksel tolerans)
    if (Math.hypot(draggingPiece.x - draggingPiece.correctX, draggingPiece.y - draggingPiece.correctY) < 25) {
        draggingPiece.x = draggingPiece.correctX; 
        draggingPiece.y = draggingPiece.correctY; 
        draggingPiece.isLocked = true;
        updateProgress(); 
        
        if (pieces.every(p => p.isLocked)) { 
            isWon = true; 
            setTimeout(() => { if (winModal) winModal.style.display='flex'; }, 400); 
        }
    }
    draggingPiece = null;
}

function updateProgress() {
    const l = pieces.filter(p => p.isLocked).length;
    const pct = Math.round((l / pieces.length) * 100);
    if (progressText) {
        progressText.textContent = `İLERLEME: %${pct} (${l}/${pieces.length})`;
    }
}

// Global Eventler
canvas.onmousedown = onStart; 
window.onmousemove = onMove; 
window.onmouseup = onEnd;

canvas.ontouchstart = (e) => { 
    if (e.cancelable) e.preventDefault(); 
    onStart(e); 
};
window.ontouchmove = onMove; 
window.ontouchend = onEnd;
