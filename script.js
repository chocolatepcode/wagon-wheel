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
let startTime = null;
let isRunning = false;
let currentAngle = 0;

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
        ctx.lineWidth = 8;
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
    
    sampledSpeedSpan.textContent = effective.toFixed(1);
    sampledSpeedSpan.style.color = Math.abs(effective) < 5 ? '#d00' : '#000';
}

// ←←← THIS IS THE IMPORTANT FIX
function restartTimingIfRunning() {
    if (isRunning && startTime !== null) {
        const rpm = Number(bladeSpeedSlider.value);
        // Keep the current visible angle but restart the clock so the new speed takes effect instantly
        const elapsedSec = (performance.now() - startTime) / 1000;
        currentAngle = rpmToRadPerSec(rpm) * elapsedSec;
        startTime = performance.now();  // reset clock
    }
}

function animate(now) {
    if (!startTime) startTime = now;
    const elapsedSec = (now - startTime) / 1000;
    const rpm = Number(bladeSpeedSlider.value);
    currentAngle = rpmToRadPerSec(rpm) * elapsedSec;
    
    drawBlades(currentAngle);
    updateDisplay();
    animationId = requestAnimationFrame(animate);
}

playBtn.addEventListener('click', () => {
    if (isRunning) {
        cancelAnimationFrame(animationId);
        animationId = null;
        startTime = null;
        playBtn.textContent = 'Start Animation';
        isRunning = false;
    } else {
        startTime = performance.now();
        animationId = requestAnimationFrame(animate);
        playBtn.textContent = 'Stop Animation';
        isRunning = true;
    }
});

bladeSpeedSlider.addEventListener('input', () => {
    updateDisplay();
    restartTimingIfRunning();
});

frameRateSlider.addEventListener('input', updateDisplay);

// Preset buttons – now instantly correct even while running
document.querySelectorAll('.presets button').forEach(btn => {
    btn.addEventListener('click', () => {
        bladeSpeedSlider.value = btn.dataset.rpm;
        frameRateSlider.value = btn.dataset.fps;
        updateDisplay();
        restartTimingIfRunning();
        if (!isRunning) drawBlades(currentAngle);
    });
});

// URL parameters (?rpm=450&fps=30)
function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const rpm = parseInt(params.get('rpm'));
    const fps = parseInt(params.get('fps'));
    if (!isNaN(rpm) && rpm >= 60 && rpm <= 900) bladeSpeedSlider.value = rpm;
    if (!isNaN(fps) && fps >= 10 && fps <= 120) frameRateSlider.value = fps;
    updateDisplay();
    restartTimingIfRunning();
    drawBlades(currentAngle);
}
window.addEventListener('load', applyUrlParams);

// Initial draw
updateDisplay();
drawBlades(0);
