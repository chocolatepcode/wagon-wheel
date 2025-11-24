// === script.js – FIXED VERSION WITH TRUE STROBOSCOPIC SAMPLING ===

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const bladeSpeedSlider = document.getElementById('bladeSpeed');
const frameRateSlider = document.getElementById('frameRate');
const playBtn = document.getElementById('playBtn');
const realSpeedSpan = document.getElementById('realSpeed');
const sampledSpeedSpan = document.getElementById('sampledSpeed');

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const bladeLength = 180;
const numBlades = 4;

let animationId = null;
let lastFrameTime = null;
let isRunning = false;
let trueAngle = 0;  // continuous real angle

function rpmToRadPerSec(rpm) {
    return rpm * 2 * Math.PI / 60;
}

function drawHub() {
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fill();
}

function drawBlades(angle) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    
    for (let i = 0; i < numBlades; i++) {
        const offset = i * 2 * Math.PI / numBlades;
        const x = Math.cos(angle + offset) * bladeLength;
        const y = Math.sin(angle + offset) * bladeLength;
        
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ctx.restore();
    drawHub();
}

function updateDisplay() {
    const rpm = Number(bladeSpeedSlider.value);
    const fps = Number(frameRateSlider.value);
    realSpeedSpan.textContent = rpm;
    
    const degPerFrame = (rpm * 360) / fps;
    const apparentDeg = ((degPerFrame % 360) + 360) % 360;
    const effective = apparentDeg > 180 ? apparentDeg - 360 : apparentDeg;
    
    sampledSpeedSpan.textContent = effective.toFixed(1) + '°';
    sampledSpeedSpan.style.color = Math.abs(effective) < 1 ? '#d00' : 
                                   Math.abs(effective) < 10 ? '#d80' : '#000';
}

let sampledAngle = 0;  // This is what the "camera" sees

function animate(now) {
    if (!lastFrameTime) lastFrameTime = now;
    
    const rpm = Number(bladeSpeedSlider.value);
    const fps = Number(frameRateSlider.value);
    const frameIntervalMs = 1000 / fps;
    
    const elapsedTotal = now - lastFrameTime;
    
    // Update true continuous rotation
    trueAngle += rpmToRadPerSec(rpm) * (elapsedTotal / 1000);
    
    // But only sample (draw) at exact camera frame rate
    if (elapsedTotal >= frameIntervalMs) {
        // Advance sampled angle by exactly one frame's worth of real rotation
        sampledAngle += rpmToRadPerSec(rpm) * (frameIntervalMs / 1000);
        
        // This creates perfect aliasing!
        drawBlades(sampledAngle);
        updateDisplay();
        
        lastFrameTime = now;
    }
    
    animationId = requestAnimationFrame(animate);
}

// Start/Stop
playBtn.addEventListener('click', () => {
    if (isRunning) {
        cancelAnimationFrame(animationId);
        animationId = null;
        lastFrameTime = null;
        isRunning = false;
        playBtn.textContent = 'Start Animation';
    } else {
        lastFrameTime = performance.now();
        animationId = requestAnimationFrame(animate);
        playBtn.textContent = 'Stop Animation';
        isRunning = true;
    }
});

// Sliders
bladeSpeedSlider.addEventListener('input', () => {
    updateDisplay();
    if (isRunning) {
        // Reset timing on change for instant response
        lastFrameTime = performance.now();
    }
});
frameRateSlider.addEventListener('input', updateDisplay);

// Presets - NOW WITH CORRECT VALUES FOR TRUE ILLUSIONS
document.querySelectorAll('.presets button').forEach(btn => {
    btn.addEventListener('click', () => {
        const rpm = btn.dataset.rpm;
        const fps = btn.dataset.fps;
        bladeSpeedSlider.value = rpm;
        frameRateSlider.value = fps;
        updateDisplay();
        sampledAngle = 0;  // reset for clean effect
        if (isRunning) lastFrameTime = performance.now();
        if (!isRunning) drawBlades(0);
    });
});

// URL params
function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const rpm = parseInt(params.get('rpm'));
    const fps = parseInt(params.get('fps'));
    if (rpm >= 60 && rpm <= 2000) bladeSpeedSlider.value = rpm;
    if (fps >= 10 && fps <= 120) frameRateSlider.value = fps;
    updateDisplay();
    sampledAngle = 0;
    if (isRunning) lastFrameTime = performance.now();
    drawBlades(0);
}
window.addEventListener('load', applyUrlParams);

// Initial draw
updateDisplay();
drawBlades(0);