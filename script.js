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
let currentAngle = 0; // real continuous angle in radians

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
    
    // Sky background already set in CSS, just draw rotor
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
    
    // Degrees the blades move between two frames
    const degPerFrame = (rpm * 360) / fps;
    const apparentDeg = ((degPerFrame % 360) + 360) % 360;
    const effective = apparentDeg > 180 ? apparentDeg - 360 : apparentDeg;
    
    sampledSpeedSpan.textContent = effective.toFixed(1);
    sampledSpeedSpan.style.color = Math.abs(effective) < 5 ? '#d00' : '#000';
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
        animationId = requestAnimationFrame(animate);
        playBtn.textContent = 'Stop Animation';
        isRunning = true;
    }
});

bladeSpeedSlider.addEventListener('input', () => {
    if (isRunning) startTime = performance.now() - (currentAngle * 60 / (Number(bladeSpeedSlider.value) * 2 * Math.PI) * 1000);
    updateDisplay();
});
frameRateSlider.addEventListener('input', updateDisplay);

// Initial draw
updateDisplay();
drawBlades(0);
