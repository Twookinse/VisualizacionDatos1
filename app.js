/* ========================================
   INTERPOLACIÓN DE LAGRANGE — APP.JS
   Lógica de cálculo, soluciones paso a paso,
   gráficas y animaciones
   ======================================== */

// ============================================
// DATOS
// ============================================

// Ejercicio 1: Altitud (ft) → Temperatura de ebullición (°F)
// Tabla del problema 21 del PDF de referencia
const dataEx1 = [
    { x: -1000, y: 213.9 },
    { x: 0,     y: 212.0 },
    { x: 3000,  y: 206.2 },
    { x: 8000,  y: 196.2 },
    { x: 15000, y: 184.4 },
    { x: 22000, y: 172.6 },
    { x: 28000, y: 163.1 }
];

// Factor de conversión metros → pies
const M_TO_FT = 3.28084;

// Conversión °F → °C
function fahrenheitToCelsius(f) {
    return (f - 32) * 5 / 9;
}

// Altitudes de las zonas de La Paz (en metros, se convierten a ft para interpolar)
const zonesLaPaz = {
    alto:   { name: 'El Alto',     altM: 4050, get alt() { return Math.round(this.altM * M_TO_FT); }, emoji: '🏔️', color: '#ef4444' },
    centro: { name: 'Centro',      altM: 3640, get alt() { return Math.round(this.altM * M_TO_FT); }, emoji: '🏛️', color: '#f59e0b' },
    sur:    { name: 'Zona Sur',    altM: 3020, get alt() { return Math.round(this.altM * M_TO_FT); }, emoji: '🌿', color: '#10b981' }
};

// Ejercicio 2: Nº Features → Throughput (req/s)
const dataEx2 = [
    { x: 10, y: 520 },
    { x: 20, y: 430 },
    { x: 40, y: 280 },
    { x: 60, y: 155 },
    { x: 80, y: 68 }
];

const casesEx2 = {
    feat35: { name: '35 Features', val: 35, color: '#06b6d4' },
    feat55: { name: '55 Features', val: 55, color: '#f97316' }
};

// ============================================
// LAGRANGE INTERPOLATION CORE
// ============================================

/**
 * Calcula el polinomio de interpolación de Lagrange en el punto x
 * @param {Array} data - Array de {x, y}
 * @param {number} xVal - Punto a interpolar
 * @returns {number} Valor interpolado P(x)
 */
function lagrangeInterpolation(data, xVal) {
    const n = data.length;
    let result = 0;
    for (let i = 0; i < n; i++) {
        let Li = 1;
        for (let j = 0; j < n; j++) {
            if (j !== i) {
                Li *= (xVal - data[j].x) / (data[i].x - data[j].x);
            }
        }
        result += data[i].y * Li;
    }
    return result;
}

/**
 * Calcula cada L_i(x) individual con detalle para pasos
 */
function lagrangeDetailed(data, xVal) {
    const n = data.length;
    const details = [];
    let result = 0;

    for (let i = 0; i < n; i++) {
        let Li = 1;
        const numParts = [];
        const denParts = [];
        
        for (let j = 0; j < n; j++) {
            if (j !== i) {
                const numVal = xVal - data[j].x;
                const denVal = data[i].x - data[j].x;
                Li *= numVal / denVal;
                numParts.push({ xj: data[j].x, numVal });
                denParts.push({ xi: data[i].x, xj: data[j].x, denVal });
            }
        }

        const contribution = data[i].y * Li;
        result += contribution;

        details.push({
            i,
            xi: data[i].x,
            yi: data[i].y,
            Li: Li,
            contribution: contribution,
            numParts,
            denParts
        });
    }

    return { result, details };
}

// ============================================
// FORMAT NUMBER FOR DISPLAY
// ============================================
function formatNum(n) {
    if (Number.isInteger(n)) return n.toLocaleString('en-US');
    return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

// ============================================
// GENERATE STEP-BY-STEP SOLUTION HTML
// ============================================

function generateSolutionHTML(data, xVal, zoneKey, isCool = false, zoneInfo = null) {
    const { result, details } = lagrangeDetailed(data, xVal);
    const stepClass = isCool ? 'step-number-cool' : '';
    
    let html = '';

    // Step 1: Identify data
    html += `<h4><span class="step-number ${stepClass}">1</span> Identificar los datos</h4>`;
    
    if (zoneInfo) {
        html += `<p>Zona: <strong>${zoneInfo.name}</strong> — ${zoneInfo.altM.toLocaleString()} m.s.n.m. = ${zoneInfo.altM.toLocaleString()} × 3.28084 = <strong>${xVal.toLocaleString()} ft</strong></p>`;
    }
    
    html += `<p>Punto a interpolar: <strong>x = ${xVal.toLocaleString()}</strong> ft</p>`;
    html += `<p>Puntos conocidos (n = ${data.length}, grado del polinomio = ${data.length - 1}):</p>`;
    html += `<div class="formula-inline">`;
    data.forEach((d, i) => {
        html += `\\((x_{${i}}, y_{${i}}) = (${d.x.toLocaleString()},\\ ${d.y})\\)`;
        if (i < data.length - 1) html += `<br>`;
    });
    html += `</div>`;

    // Step 2: Formula
    html += `<h4><span class="step-number ${stepClass}">2</span> Fórmula de Lagrange</h4>`;
    html += `<div class="formula-inline">`;
    html += `\\[P(x) = \\sum_{i=0}^{${data.length - 1}} y_i \\cdot L_i(x) \\quad \\text{donde} \\quad L_i(x) = \\prod_{\\substack{j=0 \\\\ j \\neq i}}^{${data.length - 1}} \\frac{x - x_j}{x_i - x_j}\\]`;
    html += `</div>`;

    // Step 3: Calculate each L_i
    html += `<h4><span class="step-number ${stepClass}">3</span> Cálculo de cada \\(L_i(${xVal.toLocaleString()})\\)</h4>`;

    details.forEach((d) => {
        html += `<h4 style="font-size:0.92rem; margin-left: 10px;">▸ Cálculo de \\(L_{${d.i}}(${xVal.toLocaleString()})\\)</h4>`;
        
        // Build numerator and denominator strings
        let numStr = '';
        let denStr = '';
        let numCalc = '';
        let denCalc = '';
        
        d.numParts.forEach((np, idx) => {
            const xjStr = np.xj < 0 ? `(${np.xj.toLocaleString()})` : np.xj.toLocaleString();
            numStr += `(${xVal.toLocaleString()} - ${xjStr})`;
            numCalc += `(${np.numVal.toLocaleString()})`;
            if (idx < d.numParts.length - 1) {
                numStr += ' \\cdot ';
                numCalc += ' \\cdot ';
            }
        });
        
        d.denParts.forEach((dp, idx) => {
            const xiStr = dp.xi < 0 ? `(${dp.xi.toLocaleString()})` : dp.xi.toLocaleString();
            const xjStr = dp.xj < 0 ? `(${dp.xj.toLocaleString()})` : dp.xj.toLocaleString();
            denStr += `(${xiStr} - ${xjStr})`;
            denCalc += `(${dp.denVal.toLocaleString()})`;
            if (idx < d.denParts.length - 1) {
                denStr += ' \\cdot ';
                denCalc += ' \\cdot ';
            }
        });

        // Compute numerator and denominator products
        let numProduct = 1;
        d.numParts.forEach(np => numProduct *= np.numVal);
        let denProduct = 1;
        d.denParts.forEach(dp => denProduct *= dp.denVal);

        html += `<div class="formula-inline">`;
        html += `\\[L_{${d.i}}(${xVal.toLocaleString()}) = \\frac{${numStr}}{${denStr}}\\]`;
        html += `\\[= \\frac{${numCalc}}{${denCalc}}\\]`;
        html += `\\[= \\frac{${numProduct.toExponential(4)}}{${denProduct.toExponential(4)}} = ${d.Li.toFixed(8)}\\]`;
        html += `</div>`;
    });

    // Step 4: Calculate contributions
    html += `<h4><span class="step-number ${stepClass}">4</span> Calcular cada contribución \\(y_i \\cdot L_i\\)</h4>`;
    html += `<div class="formula-inline">`;
    details.forEach((d) => {
        html += `\\[y_{${d.i}} \\cdot L_{${d.i}}(${xVal.toLocaleString()}) = ${d.yi} \\times ${d.Li.toFixed(8)} = ${d.contribution.toFixed(6)}\\]`;
    });
    html += `</div>`;

    // Step 5: Sum
    html += `<h4><span class="step-number ${stepClass}">5</span> Sumar todas las contribuciones</h4>`;
    html += `<div class="formula-inline">`;
    html += `\\[P(${xVal.toLocaleString()}) = `;
    details.forEach((d, i) => {
        if (i > 0) {
            html += d.contribution >= 0 ? ' + ' : ' ';
        }
        html += `${d.contribution.toFixed(4)}`;
    });
    html += `\\]`;
    html += `</div>`;

    // Final result
    html += `<h4><span class="step-number ${stepClass}">✓</span> Resultado Final</h4>`;
    
    if (!isCool) {
        const tempC = fahrenheitToCelsius(result);
        html += `<p><span class="highlight-result">P(${xVal.toLocaleString()}) = ${result.toFixed(4)} °F</span></p>`;
        html += `<h4 style="font-size:0.92rem; margin-left: 10px;">▸ Conversión a °C</h4>`;
        html += `<div class="formula-inline">`;
        html += `\\[T_{°C} = \\frac{T_{°F} - 32}{1.8} = \\frac{${result.toFixed(4)} - 32}{1.8} = ${tempC.toFixed(4)}\\ °C\\]`;
        html += `</div>`;
        if (zoneInfo) {
            html += `<p>El agua hierve a aproximadamente <strong>${tempC.toFixed(2)} °C</strong> (${result.toFixed(2)} °F) en <strong>${zoneInfo.name}</strong> (${zoneInfo.altM.toLocaleString()} m.s.n.m.).</p>`;
        } else {
            html += `<p>El agua hierve a aproximadamente <strong>${tempC.toFixed(2)} °C</strong> (${result.toFixed(2)} °F) a una altitud de ${xVal.toLocaleString()} ft.</p>`;
        }
    } else {
        html += `<p><span class="highlight-result">P(${xVal}) = ${result.toFixed(4)} req/s</span></p>`;
        html += `<p>El pipeline procesará aproximadamente <strong>${result.toFixed(2)} solicitudes/segundo</strong> con ${xVal} features.</p>`;
    }

    return html;
}

// ============================================
// TOGGLE SOLUTIONS
// ============================================

function toggleSolution(key) {
    const body = document.getElementById('body-' + key);
    const icon = document.getElementById('toggle-' + key);
    
    if (!body || !icon) return;

    const isHidden = body.style.display === 'none' || body.style.display === '';

    if (isHidden) {
        body.style.display = 'block';
        icon.classList.add('open');
        
        // Generate content if empty
        const contentEl = document.getElementById('step-' + key + '-content');
        if (contentEl && !contentEl.innerHTML.trim()) {
            try {
                if (key === 'alto' || key === 'centro' || key === 'sur') {
                    const zone = zonesLaPaz[key];
                    contentEl.innerHTML = generateSolutionHTML(dataEx1, zone.alt, key, false, zone);
                } else if (key === 'feat35') {
                    contentEl.innerHTML = generateSolutionHTML(dataEx2, 35, key, true);
                } else if (key === 'feat55') {
                    contentEl.innerHTML = generateSolutionHTML(dataEx2, 55, key, true);
                }
            } catch (e) {
                contentEl.innerHTML = '<p style="color:#ef4444;">Error al generar la solución: ' + e.message + '</p>';
                console.error('Error generating solution:', e);
            }
            // Re-render MathJax
            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise([contentEl]).catch(function(err) {
                    console.warn('MathJax error:', err);
                });
            }
        }
    } else {
        body.style.display = 'none';
        icon.classList.remove('open');
    }
}

// ============================================
// INTERACTIVE CALCULATORS
// ============================================

function calculateBoiling() {
    const altMeters = parseFloat(document.getElementById('altInput').value);
    if (isNaN(altMeters)) return;
    
    const altFeet = Math.round(altMeters * M_TO_FT);
    const resultF = lagrangeInterpolation(dataEx1, altFeet);
    const resultC = fahrenheitToCelsius(resultF);
    const el = document.getElementById('calcResult1');
    el.style.display = 'block';
    el.innerHTML = `
        <p>Altitud ingresada: <strong>${altMeters.toLocaleString()} m.s.n.m.</strong> = <strong>${altFeet.toLocaleString()} ft</strong></p>
        <p>Temperatura de ebullición estimada:</p>
        <p class="result-value">${resultC.toFixed(4)} °C &nbsp;(${resultF.toFixed(4)} °F)</p>
        <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 8px;">
            Calculado mediante interpolación de Lagrange con ${dataEx1.length} puntos (grado ${dataEx1.length - 1}).
        </p>
    `;
}

function calculateThroughput() {
    const xVal = parseFloat(document.getElementById('featInput').value);
    if (isNaN(xVal)) return;
    
    const result = lagrangeInterpolation(dataEx2, xVal);
    const el = document.getElementById('calcResult2');
    el.style.display = 'block';
    el.innerHTML = `
        <p>Número de features: <strong>${xVal}</strong></p>
        <p>Throughput estimado:</p>
        <p class="result-value">${result.toFixed(4)} req/s</p>
        <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 8px;">
            Calculado mediante interpolación de Lagrange con ${dataEx2.length} puntos (grado ${dataEx2.length - 1}).
        </p>
    `;
}

// ============================================
// RESULTS SUMMARY
// ============================================

function renderResults() {
    // Exercise 1
    const grid1 = document.getElementById('resultsGrid1');
    const resultsEx1 = {};
    let html1 = '';
    
    for (const [key, zone] of Object.entries(zonesLaPaz)) {
        const valF = lagrangeInterpolation(dataEx1, zone.alt);
        const valC = fahrenheitToCelsius(valF);
        resultsEx1[key] = { valF, valC };
        html1 += `
            <div class="result-card rc-${key}">
                <div class="rc-label">${zone.emoji} ${zone.name}</div>
                <div class="rc-value">${valC.toFixed(2)}°</div>
                <div class="rc-unit">°C a ${zone.altM.toLocaleString()} m (${valF.toFixed(1)} °F)</div>
            </div>
        `;
    }
    grid1.innerHTML = html1;

    // Exercise 2
    const grid2 = document.getElementById('resultsGrid2');
    const resultsEx2 = {};
    let html2 = '';
    
    for (const [key, c] of Object.entries(casesEx2)) {
        const val = lagrangeInterpolation(dataEx2, c.val);
        resultsEx2[key] = val;
        html2 += `
            <div class="result-card rc-${key}">
                <div class="rc-label">${c.name}</div>
                <div class="rc-value">${val.toFixed(2)}</div>
                <div class="rc-unit">req/s</div>
            </div>
        `;
    }
    grid2.innerHTML = html2;

    return { resultsEx1, resultsEx2 };
}

// ============================================
// CHARTS (Canvas)
// ============================================

function drawChart(canvasId, data, interpolatedPoints, xLabel, yLabel, isCool) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const w = rect.width;
    const h = rect.height;
    const padding = { top: 40, right: 40, bottom: 55, left: 70 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // All points including interpolated
    const allX = data.map(function(d) { return d.x; }).concat(interpolatedPoints.map(function(p) { return p.x; }));
    const allY = data.map(function(d) { return d.y; }).concat(interpolatedPoints.map(function(p) { return p.y; }));
    
    const xMinRaw = Math.min.apply(null, allX);
    const xMaxRaw = Math.max.apply(null, allX);
    const yMinRaw = Math.min.apply(null, allY);
    const yMaxRaw = Math.max.apply(null, allY);
    
    const xRange = xMaxRaw - xMinRaw;
    const yRange = yMaxRaw - yMinRaw;
    
    const xMin = xMinRaw - xRange * 0.08;
    const xMax = xMaxRaw + xRange * 0.08;
    const yMin = yMinRaw - yRange * 0.1;
    const yMax = yMaxRaw + yRange * 0.1;

    function toCanvasX(x) { return padding.left + ((x - xMin) / (xMax - xMin)) * plotW; }
    function toCanvasY(y) { return padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH; }

    // Background
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    var gridCount = 6;
    for (var gi = 0; gi <= gridCount; gi++) {
        var yVal = yMin + (yMax - yMin) * (gi / gridCount);
        var cy = toCanvasY(yVal);
        ctx.beginPath();
        ctx.moveTo(padding.left, cy);
        ctx.lineTo(w - padding.right, cy);
        ctx.stroke();
        
        // Y-axis labels
        ctx.fillStyle = '#64748b';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(yVal.toFixed(1), padding.left - 10, cy + 4);
    }

    for (var gi2 = 0; gi2 <= gridCount; gi2++) {
        var xVal2 = xMin + (xMax - xMin) * (gi2 / gridCount);
        var cx2 = toCanvasX(xVal2);
        ctx.beginPath();
        ctx.moveTo(cx2, padding.top);
        ctx.lineTo(cx2, h - padding.bottom);
        ctx.stroke();
        
        // X-axis labels
        ctx.fillStyle = '#64748b';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(xVal2).toString(), cx2, h - padding.bottom + 20);
    }

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, w / 2, h - 8);
    
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    // Interpolation curve
    var gradientColor1 = isCool ? '#06b6d4' : '#f59e0b';
    
    var curvePoints = 200;
    var curveStep = (data[data.length - 1].x - data[0].x) / curvePoints;
    
    ctx.beginPath();
    ctx.strokeStyle = gradientColor1;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    
    for (var ci = 0; ci <= curvePoints; ci++) {
        var xv = data[0].x + curveStep * ci;
        var yv = lagrangeInterpolation(data, xv);
        var cxp = toCanvasX(xv);
        var cyp = toCanvasY(yv);
        if (ci === 0) ctx.moveTo(cxp, cyp);
        else ctx.lineTo(cxp, cyp);
    }
    ctx.stroke();

    // Fill under curve
    var lastXd = data[data.length - 1].x;
    ctx.lineTo(toCanvasX(lastXd), toCanvasY(yMin));
    ctx.lineTo(toCanvasX(data[0].x), toCanvasY(yMin));
    ctx.closePath();
    
    var fillGrad = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    fillGrad.addColorStop(0, isCool ? 'rgba(6, 182, 212, 0.08)' : 'rgba(245, 158, 11, 0.08)');
    fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Known data points
    data.forEach(function(d) {
        var cx = toCanvasX(d.x);
        var cy = toCanvasY(d.y);
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = isCool ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)';
        ctx.fill();
        
        // Point
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = isCool ? '#06b6d4' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#0a0e1a';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Interpolated points
    interpolatedPoints.forEach(function(p) {
        var cx = toCanvasX(p.x);
        var cy = toCanvasY(p.y);
        
        // Dashed vertical line
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = p.color + '60';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, toCanvasY(yMin));
        ctx.stroke();
        
        // Dashed horizontal line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(toCanvasX(xMin), cy);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '25';
        ctx.fill();
        
        // Point
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#0a0e1a';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Label
        ctx.fillStyle = p.color;
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(p.label + ': ' + p.y.toFixed(1), cx + 14, cy - 6);
    });

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Curva de Interpolación de Lagrange', padding.left, 24);
}

// ============================================
// PARTICLE BACKGROUND ANIMATION
// ============================================

function initParticles() {
    var canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = 50;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resize();
    window.addEventListener('resize', resize);

    function Particle() {
        this.reset();
    }
    
    Particle.prototype.reset = function() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.3 + 0.05;
        this.hue = Math.random() > 0.5 ? 38 : 190;
    };
    
    Particle.prototype.update = function() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    };
    
    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + this.hue + ', 80%, 60%, ' + this.opacity + ')';
        ctx.fill();
    };

    for (var i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(function(p) {
            p.update();
            p.draw();
        });
        
        // Draw connections
        for (var i = 0; i < particles.length; i++) {
            for (var j = i + 1; j < particles.length; j++) {
                var dx = particles[i].x - particles[j].x;
                var dy = particles[i].y - particles[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(148, 163, 184, ' + (0.04 * (1 - dist / 150)) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================

function initScrollReveal() {
    var elements = document.querySelectorAll('.glass-card, .section-header, .solutions-container');
    
    elements.forEach(function(el) {
        el.classList.add('reveal');
    });

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function(el) { observer.observe(el); });
}

// ============================================
// AUTHENTICATION (LOGIN)
// ============================================

function checkAuth() {
    var overlay = document.getElementById('loginOverlay');
    var isAuth = sessionStorage.getItem('lagrange_auth') === 'true';
    if (isAuth && overlay) {
        overlay.classList.add('hidden');
    }
}

function handleLogin(event) {
    if (event) event.preventDefault();
    var userEl = document.getElementById('loginUser');
    var passEl = document.getElementById('loginPass');
    var errorEl = document.getElementById('loginError');
    var overlay = document.getElementById('loginOverlay');

    var username = userEl ? userEl.value.trim() : '';
    var password = passEl ? passEl.value : '';

    if (username === 'logan' && password === 'bodriosilva') {
        sessionStorage.setItem('lagrange_auth', 'true');
        if (errorEl) errorEl.style.display = 'none';
        if (overlay) overlay.classList.add('hidden');
    } else {
        if (errorEl) {
            errorEl.style.display = 'block';
        }
        if (passEl) {
            passEl.value = '';
            passEl.focus();
        }
    }
}

function handleLogout() {
    sessionStorage.removeItem('lagrange_auth');
    var overlay = document.getElementById('loginOverlay');
    var userEl = document.getElementById('loginUser');
    var passEl = document.getElementById('loginPass');
    var errorEl = document.getElementById('loginError');

    if (userEl) userEl.value = '';
    if (passEl) passEl.value = '';
    if (errorEl) errorEl.style.display = 'none';
    if (overlay) overlay.classList.remove('hidden');
    if (userEl) userEl.focus();
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Check auth status
    checkAuth();

    // Render results
    renderResults();

    // Draw charts
    setTimeout(function() {
        // Chart 1: Exercise 1 (in ft / °F)
        var interpPoints1 = Object.entries(zonesLaPaz).map(function(entry) {
            var key = entry[0];
            var zone = entry[1];
            return {
                x: zone.alt,
                y: lagrangeInterpolation(dataEx1, zone.alt),
                color: zone.color,
                label: zone.name
            };
        });
        drawChart('chartCanvas1', dataEx1, interpPoints1, 'Altitud (ft)', 'Temp. Ebullición (°F)', false);

        // Chart 2: Exercise 2
        var interpPoints2 = Object.entries(casesEx2).map(function(entry) {
            var key = entry[0];
            var c = entry[1];
            return {
                x: c.val,
                y: lagrangeInterpolation(dataEx2, c.val),
                color: c.color,
                label: c.name
            };
        });
        drawChart('chartCanvas2', dataEx2, interpPoints2, 'Nº de Features', 'Throughput (req/s)', true);
    }, 300);

    // Redraw charts on resize
    var resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            var interpPoints1 = Object.entries(zonesLaPaz).map(function(entry) {
                var zone = entry[1];
                return {
                    x: zone.alt,
                    y: lagrangeInterpolation(dataEx1, zone.alt),
                    color: zone.color,
                    label: zone.name
                };
            });
            drawChart('chartCanvas1', dataEx1, interpPoints1, 'Altitud (ft)', 'Temp. Ebullición (°F)', false);

            var interpPoints2 = Object.entries(casesEx2).map(function(entry) {
                var c = entry[1];
                return {
                    x: c.val,
                    y: lagrangeInterpolation(dataEx2, c.val),
                    color: c.color,
                    label: c.name
                };
            });
            drawChart('chartCanvas2', dataEx2, interpPoints2, 'Nº de Features', 'Throughput (req/s)', true);
        }, 200);
    });

    // Init animations
    initParticles();
    initScrollReveal();
});
