/**
 * DICOM CT Viewer
 * Uses dicomParser to parse DICOM files and renders raw pixel data to canvas.
 * Note: This basic implementation handles uncompressed (Little Endian) DICOM files.
 */

// State
const state = {
    series: new Map(), // seriesInstanceUID -> { info, slices: [] }
    activeSeriesUID: null,
    activeSliceIndex: 0,
    
    // Tools & View
    activeTool: 'windowing', // windowing, pan, zoom
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    
    // Transform
    scale: 1,
    panX: 0,
    panY: 0,
    
    // Window/Level
    windowWidth: 400,
    windowCenter: 40,
    invert: false,
    
    // UI
    showTags: false,
    currentTags: [],
};

// Presets for Window/Level (Width / Center)
const PRESETS = {
    brain: { w: 80, c: 40 },
    subdural: { w: 150, c: 50 },
    stroke: { w: 32, c: 32 },
    temporal: { w: 4000, c: 400 },
    soft: { w: 400, c: 40 },
    lung: { w: 1500, c: -600 },
    mediastinum: { w: 350, c: 50 },
    bone: { w: 2000, c: 400 },
    abdomen: { w: 400, c: 50 },
    liver: { w: 150, c: 30 }
};

// DOM Elements
const els = {
    dropOverlay: document.getElementById('dropOverlay'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingProgress: document.getElementById('loadingProgress'),
    loadingText: document.getElementById('loadingText'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    viewerApp: document.getElementById('viewerApp'),
    
    fileInput: document.getElementById('fileInput'),
    folderInput: document.getElementById('folderInput'),
    
    seriesList: document.getElementById('seriesList'),
    seriesCount: document.getElementById('seriesCount'),
    
    canvas: document.getElementById('dicomCanvas'),
    ctx: document.getElementById('dicomCanvas').getContext('2d'),
    
    sliceSlider: document.getElementById('sliceSlider'),
    sliceLabel: document.getElementById('sliceLabel'),
    
    overlayTL: document.getElementById('overlayTL'),
    overlayTR: document.getElementById('overlayTR'),
    overlayBL: document.getElementById('overlayBL'),
    overlayBR: document.getElementById('overlayBR'),
    
    tagsPanel: document.getElementById('tagsPanel'),
    tagsList: document.getElementById('tagsList'),
    tagSearch: document.getElementById('tagSearch'),
    
    presetSelect: document.getElementById('presetSelect')
};

// --- Initialization & Event Listeners ---

function init() {
    setupDragAndDrop();
    setupInputs();
    setupToolbar();
    setupCanvasInteractions();
    
    // Window resize
    window.addEventListener('resize', () => {
        if (state.activeSeriesUID) {
            resizeCanvas();
            renderCurrentSlice();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if(e.target.tagName === 'INPUT') return;
        
        switch(e.key.toLowerCase()) {
            case 'w': setTool('windowing'); break;
            case 'p': setTool('pan'); break;
            case 'z': setTool('zoom'); break;
            case 'i': toggleInvert(); break;
            case 'r': resetView(); break;
            case 'f': fitToScreen(); break;
            case 't': toggleTags(); break;
            case 'arrowup':
            case 'arrowright':
                changeSlice(1);
                break;
            case 'arrowdown':
            case 'arrowleft':
                changeSlice(-1);
                break;
        }
    });
}

// --- Drag and Drop ---

function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
        document.body.addEventListener(ev, preventDefaults, false);
    });

    document.body.addEventListener('dragenter', () => {
        els.dropOverlay.classList.remove('hidden');
    });

    els.dropOverlay.addEventListener('dragleave', (e) => {
        if (e.target === els.dropOverlay) {
            els.dropOverlay.classList.add('hidden');
        }
    });

    document.body.addEventListener('drop', async (e) => {
        els.dropOverlay.classList.add('hidden');
        const dt = e.dataTransfer;
        const files = [];

        // Handle folders via File System Access API if available, else fallback to files
        if (dt.items) {
            showLoading('Сканирование файлов...');
            for (let i = 0; i < dt.items.length; i++) {
                const item = dt.items[i].webkitGetAsEntry();
                if (item) await traverseFileTree(item, files);
            }
            processFiles(files);
        } else {
            processFiles(Array.from(dt.files));
        }
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

async function traverseFileTree(item, files) {
    if (item.isFile) {
        const file = await new Promise(resolve => item.file(resolve));
        files.push(file);
    } else if (item.isDirectory) {
        const dirReader = item.createReader();
        const entries = await new Promise(resolve => dirReader.readEntries(resolve));
        for (let i = 0; i < entries.length; i++) {
            await traverseFileTree(entries[i], files);
        }
    }
}

// --- Inputs ---

function setupInputs() {
    els.fileInput.addEventListener('change', (e) => processFiles(Array.from(e.target.files)));
    els.folderInput.addEventListener('change', (e) => processFiles(Array.from(e.target.files)));
    
    document.getElementById('btnAddFiles').addEventListener('click', () => {
        els.fileInput.click();
    });

    els.sliceSlider.addEventListener('input', (e) => {
        state.activeSliceIndex = parseInt(e.target.value);
        renderCurrentSlice();
    });

    els.presetSelect.addEventListener('change', (e) => {
        const preset = PRESETS[e.target.value];
        if (preset) {
            state.windowWidth = preset.w;
            state.windowCenter = preset.c;
            renderCurrentSlice();
        }
    });

    els.tagSearch.addEventListener('input', (e) => {
        renderTags(e.target.value.toLowerCase());
    });

    document.getElementById('btnCloseTags').addEventListener('click', () => {
        state.showTags = false;
        els.tagsPanel.classList.add('hidden');
    });

    document.getElementById('btnToggleTags').addEventListener('click', toggleTags);
}

function setupToolbar() {
    document.querySelectorAll('.toolbar-tools .tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => setTool(btn.dataset.tool));
    });

    document.getElementById('btnInvert').addEventListener('click', toggleInvert);
    document.getElementById('btnReset').addEventListener('click', resetView);
    document.getElementById('btnFit').addEventListener('click', fitToScreen);
}

function toggleTags() {
    state.showTags = !state.showTags;
    if (state.showTags) {
        els.tagsPanel.classList.remove('hidden');
        renderTags(els.tagSearch.value.toLowerCase());
    } else {
        els.tagsPanel.classList.add('hidden');
    }
}

// --- File Processing ---

async function processFiles(files) {
    if (!files || files.length === 0) return;
    
    showLoading(`Анализ ${files.length} файлов...`);
    
    // Filter DICOM files loosely (often have no extension or .dcm)
    const dicomFiles = files.filter(f => !f.name.startsWith('.') && (f.name.endsWith('.dcm') || !f.name.includes('.')));
    
    if (dicomFiles.length === 0) {
        hideLoading();
        alert('Не найдено DICOM файлов.');
        return;
    }

    state.series.clear();
    let processed = 0;

    // Process files in chunks so UI doesn't completely freeze
    const chunkSize = 20;
    for (let i = 0; i < dicomFiles.length; i += chunkSize) {
        const chunk = dicomFiles.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(async (file) => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const byteArray = new Uint8Array(arrayBuffer);
                
                // Parse DICOM
                const dataSet = dicomParser.parseDicom(byteArray);
                
                // Extract metadata
                const seriesUID = dataSet.string('x0020000e') || 'Unknown Series';
                const instanceNumber = parseInt(dataSet.string('x00200013') || '0', 10);
                const sliceLocation = parseFloat(dataSet.string('x00201041') || '0');
                
                const seriesDesc = dataSet.string('x0008103e') || 'No Description';
                const modality = dataSet.string('x00080060') || 'OT';
                const patientName = dataSet.string('x00100010') || 'Anonymous';
                
                // Extract image params
                const rows = dataSet.uint16('x00280010');
                const cols = dataSet.uint16('x00280011');
                const windowCenter = parseFloat(dataSet.string('x00281050')?.split('\\')[0]) || 40;
                const windowWidth = parseFloat(dataSet.string('x00281051')?.split('\\')[0]) || 400;
                const rescaleIntercept = parseFloat(dataSet.string('x00281052')) || 0;
                const rescaleSlope = parseFloat(dataSet.string('x00281053')) || 1;
                
                // Extract Pixel Data
                const pixelDataElement = dataSet.elements.x7fe00010;
                let pixels = null;
                if (pixelDataElement && pixelDataElement.length > 0) {
                    // Very naive extraction for uncompressed 16-bit
                    const pixelOffset = pixelDataElement.dataOffset;
                    const pixelLength = pixelDataElement.length;
                    
                    if (pixelOffset + pixelLength <= byteArray.length) {
                        pixels = new Int16Array(arrayBuffer, pixelOffset, pixelLength / 2);
                    }
                }

                if (!rows || !cols || !pixels) {
                    // Skip invalid images
                    return;
                }

                // Gather tags for UI
                const tags = [];
                for (const propertyName in dataSet.elements) {
                    const element = dataSet.elements[propertyName];
                    let value = '';
                    try {
                        if (element.length < 100) { // skip large data like pixels
                            if (element.vr === 'US') value = dataSet.uint16(propertyName);
                            else if (element.vr === 'SS') value = dataSet.int16(propertyName);
                            else value = dataSet.string(propertyName);
                        } else {
                            value = `[Data length: ${element.length}]`;
                        }
                    } catch(e) { value = 'Error reading'; }
                    
                    tags.push({ key: propertyName.replace('x', ''), name: getTagName(propertyName), value: value });
                }

                const slice = {
                    file, instanceNumber, sliceLocation, rows, cols, pixels,
                    windowCenter, windowWidth, rescaleIntercept, rescaleSlope,
                    tags, patientName, modality
                };

                if (!state.series.has(seriesUID)) {
                    state.series.set(seriesUID, {
                        info: { uid: seriesUID, desc: seriesDesc, modality, patientName },
                        slices: []
                    });
                }
                state.series.get(seriesUID).slices.push(slice);

            } catch (err) {
                console.warn('Skipping unparseable file:', file.name, err);
            }
        }));
        
        processed += chunk.length;
        updateLoadingProgress(processed / dicomFiles.length * 100);
    }

    // Sort slices in each series
    state.series.forEach(series => {
        series.slices.sort((a, b) => {
            // Sort by slice location if available, else instance number
            if (a.sliceLocation !== b.sliceLocation) {
                return a.sliceLocation - b.sliceLocation;
            }
            return a.instanceNumber - b.instanceNumber;
        });
    });

    hideLoading();

    if (state.series.size > 0) {
        els.welcomeScreen.classList.add('hidden');
        els.viewerApp.classList.remove('hidden');
        renderSeriesList();
        
        // Select first series
        const firstUID = state.series.keys().next().value;
        selectSeries(firstUID);
    } else {
        alert('Не удалось извлечь изображения из DICOM файлов. Возможно они сжаты (JPEG), что не поддерживается в данной базовой версии.');
    }
}

function showLoading(text) {
    els.loadingText.textContent = text;
    els.loadingProgress.style.width = '0%';
    els.loadingOverlay.classList.remove('hidden');
}

function updateLoadingProgress(percent) {
    els.loadingProgress.style.width = `${percent}%`;
}

function hideLoading() {
    els.loadingOverlay.classList.add('hidden');
}

// --- UI Rendering ---

function renderSeriesList() {
    els.seriesList.innerHTML = '';
    els.seriesCount.textContent = state.series.size;
    
    state.series.forEach((series, uid) => {
        const div = document.createElement('div');
        div.className = `series-item ${uid === state.activeSeriesUID ? 'active' : ''}`;
        div.onclick = () => selectSeries(uid);
        
        div.innerHTML = `
            <div class="series-desc" title="${series.info.desc}">${series.info.desc}</div>
            <div class="series-info">${series.info.modality} • ${series.slices.length} изобр.</div>
        `;
        els.seriesList.appendChild(div);
    });
}

function selectSeries(uid) {
    state.activeSeriesUID = uid;
    state.activeSliceIndex = 0;
    
    renderSeriesList(); // Update active class
    
    const series = state.series.get(uid);
    els.sliceSlider.max = series.slices.length - 1;
    els.sliceSlider.value = 0;
    
    // Set initial Window/Level from first slice
    const firstSlice = series.slices[0];
    state.windowCenter = firstSlice.windowCenter;
    state.windowWidth = firstSlice.windowWidth;
    els.presetSelect.value = ''; // Reset preset
    
    resizeCanvas();
    fitToScreen();
    renderCurrentSlice();
}

function renderTags(searchQuery = '') {
    const slice = getCurrentSlice();
    if (!slice) return;
    
    els.tagsList.innerHTML = '';
    
    let tags = slice.tags;
    if (searchQuery) {
        tags = tags.filter(t => 
            (t.name && t.name.toLowerCase().includes(searchQuery)) || 
            t.key.toLowerCase().includes(searchQuery) || 
            (t.value && String(t.value).toLowerCase().includes(searchQuery))
        );
    }
    
    // Create fragment for performance
    const frag = document.createDocumentFragment();
    tags.forEach(t => {
        const row = document.createElement('div');
        row.className = 'tag-row';
        row.innerHTML = `
            <div class="tag-key">${t.key}</div>
            <div class="tag-name" title="${t.name || ''}">${t.name || 'Unknown Tag'}</div>
            <div class="tag-value" title="${t.value}">${t.value || '-'}</div>
        `;
        frag.appendChild(row);
    });
    
    els.tagsList.appendChild(frag);
}

// --- Canvas & Rendering ---

function resizeCanvas() {
    const rect = els.canvas.parentElement.getBoundingClientRect();
    els.canvas.width = rect.width;
    els.canvas.height = rect.height;
}

function getCurrentSlice() {
    if (!state.activeSeriesUID) return null;
    return state.series.get(state.activeSeriesUID).slices[state.activeSliceIndex];
}

function renderCurrentSlice() {
    const slice = getCurrentSlice();
    if (!slice) return;

    // Update Slider UI
    els.sliceSlider.value = state.activeSliceIndex;
    els.sliceLabel.textContent = `${state.activeSliceIndex + 1} / ${state.series.get(state.activeSeriesUID).slices.length}`;

    // Apply Window/Level to pixel data and create ImageData
    const imgData = new ImageData(slice.cols, slice.rows);
    const data = imgData.data;
    const pixels = slice.pixels;
    
    const windowMin = state.windowCenter - state.windowWidth / 2;
    const windowMax = state.windowCenter + state.windowWidth / 2;
    
    const slope = slice.rescaleSlope;
    const intercept = slice.rescaleIntercept;

    // Fast loop for applying W/L
    for (let i = 0, j = 0; i < pixels.length; i++, j += 4) {
        // Hounsfield Unit
        let hu = (pixels[i] * slope) + intercept;
        
        let value;
        if (hu <= windowMin) value = 0;
        else if (hu >= windowMax) value = 255;
        else {
            value = ((hu - windowMin) / state.windowWidth) * 255;
        }

        if (state.invert) value = 255 - value;

        data[j] = value;     // R
        data[j+1] = value;   // G
        data[j+2] = value;   // B
        data[j+3] = 255;     // A
    }

    // Render to offscreen canvas to scale
    const offscreen = document.createElement('canvas');
    offscreen.width = slice.cols;
    offscreen.height = slice.rows;
    offscreen.getContext('2d').putImageData(imgData, 0, 0);

    // Draw to main canvas
    els.ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
    
    els.ctx.save();
    
    // Apply Transform (Pan/Zoom)
    els.ctx.translate(els.canvas.width/2 + state.panX, els.canvas.height/2 + state.panY);
    els.ctx.scale(state.scale, state.scale);
    
    // Center the image
    els.ctx.drawImage(offscreen, -slice.cols/2, -slice.rows/2);
    
    els.ctx.restore();

    updateOverlays(slice);
    
    if(state.showTags) renderTags(els.tagSearch.value.toLowerCase());
}

function updateOverlays(slice) {
    // Top Left
    els.overlayTL.innerHTML = `
        ${slice.patientName}<br>
        ${slice.modality}<br>
        Series: ${state.series.get(state.activeSeriesUID).info.desc || ''}
    `;
    
    // Top Right
    els.overlayTR.innerHTML = `
        Inst: ${slice.instanceNumber}<br>
        Loc: ${slice.sliceLocation ? slice.sliceLocation.toFixed(2) + ' mm' : '-'}
    `;
    
    // Bottom Left
    els.overlayBL.innerHTML = `
        W: ${Math.round(state.windowWidth)} L: ${Math.round(state.windowCenter)}<br>
        Zoom: ${(state.scale * 100).toFixed(0)}%
    `;
    
    // Bottom Right
    els.overlayBR.innerHTML = `
        Size: ${slice.cols} x ${slice.rows}<br>
        Thickness: -
    `;
}

// --- Interactions ---

function setupCanvasInteractions() {
    const vp = document.getElementById('viewport');

    vp.addEventListener('mousedown', (e) => {
        if(e.button !== 0 && e.button !== 1 && e.button !== 2) return; // ignore others
        
        state.isDragging = true;
        state.lastMouseX = e.clientX;
        state.lastMouseY = e.clientY;
        
        // Middle click = pan
        if(e.button === 1) state.tempTool = 'pan';
        // Right click = windowing
        else if(e.button === 2) state.tempTool = 'windowing';
        else state.tempTool = null;
    });

    window.addEventListener('mouseup', () => {
        state.isDragging = false;
        state.tempTool = null;
    });

    window.addEventListener('mousemove', (e) => {
        if (!state.isDragging || !state.activeSeriesUID) return;

        const deltaX = e.clientX - state.lastMouseX;
        const deltaY = e.clientY - state.lastMouseY;
        
        const tool = state.tempTool || state.activeTool;

        if (tool === 'windowing') {
            // Adjust Window/Level
            state.windowWidth += deltaX;
            state.windowCenter += deltaY;
            
            if (state.windowWidth < 1) state.windowWidth = 1;
            
            els.presetSelect.value = ''; // Custom
            renderCurrentSlice();
        } 
        else if (tool === 'pan') {
            state.panX += deltaX;
            state.panY += deltaY;
            renderCurrentSlice();
        }
        else if (tool === 'zoom') {
            state.scale += deltaY * -0.01;
            if (state.scale < 0.1) state.scale = 0.1;
            renderCurrentSlice();
        }

        state.lastMouseX = e.clientX;
        state.lastMouseY = e.clientY;
    });

    // Zoom on wheel
    vp.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (!state.activeSeriesUID) return;

        // Determine zoom factor
        const zoomFactor = 1.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        
        const oldScale = state.scale;
        state.scale = direction > 0 ? state.scale * zoomFactor : state.scale / zoomFactor;
        
        if (state.scale < 0.1) state.scale = 0.1;

        // Zoom towards mouse pointer
        const rect = vp.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - els.canvas.width/2 - state.panX;
        const mouseY = e.clientY - rect.top - els.canvas.height/2 - state.panY;
        
        const scaleChange = state.scale / oldScale - 1;
        
        state.panX -= mouseX * scaleChange;
        state.panY -= mouseY * scaleChange;

        renderCurrentSlice();
    });

    // Prevent context menu
    vp.addEventListener('contextmenu', e => e.preventDefault());
}

// --- Tools ---

function setTool(toolName) {
    state.activeTool = toolName;
    document.querySelectorAll('.toolbar-tools .tool-btn[data-tool]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
}

function toggleInvert() {
    state.invert = !state.invert;
    renderCurrentSlice();
}

function fitToScreen() {
    const slice = getCurrentSlice();
    if (!slice) return;

    state.panX = 0;
    state.panY = 0;

    const scaleX = els.canvas.width / slice.cols;
    const scaleY = els.canvas.height / slice.rows;
    state.scale = Math.min(scaleX, scaleY) * 0.95; // 5% padding
    
    renderCurrentSlice();
}

function resetView() {
    const slice = getCurrentSlice();
    if (!slice) return;
    
    state.windowWidth = slice.windowWidth;
    state.windowCenter = slice.windowCenter;
    state.invert = false;
    els.presetSelect.value = '';
    
    fitToScreen();
}

function changeSlice(delta) {
    if (!state.activeSeriesUID) return;
    const slicesCount = state.series.get(state.activeSeriesUID).slices.length;
    
    let newIdx = state.activeSliceIndex + delta;
    if (newIdx < 0) newIdx = 0;
    if (newIdx >= slicesCount) newIdx = slicesCount - 1;
    
    if (newIdx !== state.activeSliceIndex) {
        state.activeSliceIndex = newIdx;
        renderCurrentSlice();
    }
}

// --- Dictionary ---
// Very minimal dictionary just for demo
function getTagName(tag) {
    const dic = {
        '00080020': 'Study Date',
        '00080030': 'Study Time',
        '00080060': 'Modality',
        '00080090': 'Referring Physician Name',
        '0008103e': 'Series Description',
        '00100010': 'Patient Name',
        '00100020': 'Patient ID',
        '00100030': 'Patient Birth Date',
        '00100040': 'Patient Sex',
        '0020000d': 'Study Instance UID',
        '0020000e': 'Series Instance UID',
        '00200013': 'Instance Number',
        '00201041': 'Slice Location',
        '00280010': 'Rows',
        '00280011': 'Columns',
        '00281050': 'Window Center',
        '00281051': 'Window Width',
        '00281052': 'Rescale Intercept',
        '00281053': 'Rescale Slope'
    };
    return dic[tag] || '';
}

// Boot
window.addEventListener('DOMContentLoaded', init);
