document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    
    window.electronAPI = {
        openDirectoryDialog: (callback) => {
            ipcRenderer.invoke('open-directory-dialog').then(path => {
                callback(path);
            });
        },
        confirmDeleteProject: async () => {
            return await ipcRenderer.invoke('confirm-delete-project');
        },
        createProjectFolder: async (basePath, sanitizedName) => {
            return await ipcRenderer.invoke('create-project-folder', basePath, sanitizedName);
        },
        saveProjectFile: async (projectPath, data) => {
            await ipcRenderer.invoke('save-project-file', projectPath, data);
        },
        loadProjectFile: async (projectPath) => {
            return await ipcRenderer.invoke('load-project-file', projectPath);
        },
        autoSaveProject: async (projectPath, data) => {
            await ipcRenderer.invoke('auto-save-project', projectPath, data);
        }
    };
    
    const homeScreen = document.getElementById('homeScreen');
    const editorScreen = document.getElementById('editorScreen');
    const newProjectOption = document.getElementById('newProjectOption');
    const recentProjectsOption = document.getElementById('recentProjectsOption');
    const newProjectForm = document.getElementById('newProjectForm');
    const recentProjects = document.getElementById('recentProjects');
    const recentProjectsList = document.getElementById('recentProjectsList');
    const projectNameInput = document.getElementById('projectName');
    const projectLocationInput = document.getElementById('projectLocation');
    const browseBtn = document.getElementById('browseBtn');
    const canvasSizeSelectHome = document.getElementById('canvasSize');
    const gridSizeSelect = document.getElementById('gridSize');
    const createProjectBtn = document.getElementById('createProject');
    
    const fileMenuDropdown = document.getElementById('fileMenuDropdown');
    const fileMenuBtn = document.getElementById('fileMenuBtn');
    const editMenuDropdown = document.getElementById('editMenuDropdown');
    const editMenuBtn = document.getElementById('editMenuBtn');
    const menuUndo = document.getElementById('menuUndo');
    const menuRedo = document.getElementById('menuRedo');
    const menuCopy = document.getElementById('menuCopy');
    const menuPaste = document.getElementById('menuPaste');
    const menuDuplicate = document.getElementById('menuDuplicate');
    const menuFocus = document.getElementById('menuFocus');
    const exportMenuDropdown = document.getElementById('exportMenuDropdown');
    const exportMenuBtn = document.getElementById('exportMenuBtn');
    const menuNewProject = document.getElementById('menuNewProject');
    const menuBackToHome = document.getElementById('menuBackToHome');
    const recentProjectsMenu = document.getElementById('recentProjectsMenu');
    const menuExportPng = document.getElementById('menuExportPng');
    const menuExportJpg = document.getElementById('menuExportJpg');
    const menuExportSvg = document.getElementById('menuExportSvg');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const zoomLevelSpan = document.getElementById('zoomLevel');
    const projectNameSpan = document.getElementById('activeProjectName');
    const layerList = document.getElementById('layerList');
    const propertiesPanel = document.getElementById('propertiesPanel');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const viewport = document.getElementById('viewport');
    const dropZone = document.getElementById('dropZone');
    const spriteContextMenu = document.getElementById('spriteContextMenu');
    const contextResizeBtn = document.getElementById('contextResizeBtn');
    const contextDuplicateBtn = document.getElementById('contextDuplicateBtn');
    const contextDeleteBtn = document.getElementById('contextDeleteBtn');
    const contextAlignLeftBtn = document.getElementById('contextAlignLeftBtn');
    const contextAlignTopBtn = document.getElementById('contextAlignTopBtn');
    const contextAlignCenterBtn = document.getElementById('contextAlignCenterBtn');
    const spriteResizeModal = document.getElementById('spriteResizeModal');
    const resizePreviewCanvas = document.getElementById('resizePreviewCanvas');
    const resizePreviewCtx = resizePreviewCanvas.getContext('2d');
    resizePreviewCtx.imageSmoothingEnabled = false;
    const resizeWidthSelect = document.getElementById('resizeWidthSelect');
    const resizeHeightSelect = document.getElementById('resizeHeightSelect');
    const resizeSaveBtn = document.getElementById('resizeSaveBtn');
    const resizeCancelBtn = document.getElementById('resizeCancelBtn');
    
    window.currentSprites = [];
    let projectSettings = null;
    let currentProjectPath = null;
    let currentZoom = 1.0;
    let selectedProjectPath = '';
    window.currentZoom = 1.0;
    let autoSaveIntervalId = null;
    let contextMenuSprite = null;
    let resizingSprite = null;
    let resizeDraft = null;
    let resizeDragActive = false;
    window.clipboard = null;
    
    function updatePreloader(percent, status) {
        const bar = document.getElementById('preloaderBar');
        const percentEl = document.getElementById('preloaderPercent');
        const statusEl = document.querySelector('.preloader-status');
        if (bar) bar.style.width = percent + '%';
        if (percentEl) percentEl.textContent = Math.round(percent) + '%';
        if (statusEl && status) statusEl.textContent = status;
    }
    
    function hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 300);
        }
    }
    
    function sanitizeProjectName(name) {
        return name.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    function getRecentProjects() {
        const recent = localStorage.getItem('recentProjects') || localStorage.getItem('anemic2d_recent');
        return recent ? JSON.parse(recent) : [];
    }
    
    function saveRecentProject(projectPath, projectName) {
        const recent = getRecentProjects();
        const updated = recent.filter(p => p.path !== projectPath);
        updated.unshift({ path: projectPath, name: projectName, date: Date.now() });
        const limited = updated.slice(0, 5);
        localStorage.setItem('recentProjects', JSON.stringify(limited));
    }
    
    function displayRecentProjects() {
        const recent = getRecentProjects();
        recentProjectsList.innerHTML = '';
        
        if (recent.length === 0) {
            recentProjectsList.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">No recent projects</div>';
            return;
        }
        
        recent.forEach(project => {
            const item = document.createElement('div');
            item.className = 'recent-project-item';
            item.innerHTML = `
                <div class="recent-project-info">
                    <div>${project.name}</div>
                    <div style="font-size: 10px; color: #999;">${project.path}</div>
                </div>
                <div class="recent-project-meta">
                    <div style="font-size: 10px; color: #999;">${new Date(project.date).toLocaleDateString()}</div>
                    <button class="delete-project-btn" data-path="${project.path}" title="Delete from list">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                        </svg>
                    </button>
                </div>
            `;
            item.querySelector('.recent-project-info').addEventListener('click', () => {
                localStorage.setItem('anemic2d_project', JSON.stringify({ projectPath: project.path }));
                loadProject(project.path);
            });
            item.querySelector('.delete-project-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteProjectFromList(project.path);
            });
            recentProjectsList.appendChild(item);
        });
    }

    function populateRecentProjectsMenu() {
        const recent = getRecentProjects();
        recentProjectsMenu.innerHTML = '';
        if (!recent || recent.length === 0) {
            const empty = document.createElement('button');
            empty.className = 'menu-item';
            empty.innerHTML = `<span class="menu-item-label">No recent projects</span><span class="menu-item-shortcut"></span>`;
            empty.disabled = true;
            recentProjectsMenu.appendChild(empty);
            return;
        }
        recent.forEach(project => {
            const item = document.createElement('button');
            item.className = 'menu-item';
            item.innerHTML = `<span class="menu-item-label">${project.name}</span><span class="menu-item-shortcut"></span>`;
            item.addEventListener('click', () => {
                localStorage.setItem('anemic2d_project', JSON.stringify({ projectPath: project.path }));
                window.location.reload();
            });
            recentProjectsMenu.appendChild(item);
        });
    }

    function closeMenus() {
        fileMenuDropdown.classList.remove('open');
        editMenuDropdown.classList.remove('open');
        exportMenuDropdown.classList.remove('open');
    }

    function toggleMenu(target) {
        const isOpen = target.classList.contains('open');
        closeMenus();
        if (!isOpen) {
            target.classList.add('open');
            populateRecentProjectsMenu();
        }
    }

    function isAnyModalOpen() {
        return spriteResizeModal.classList.contains('show');
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function hideContextMenu() {
        spriteContextMenu.classList.remove('show');
        contextMenuSprite = null;
    }

    function showContextMenu(x, y, sprite) {
        contextMenuSprite = sprite;
        const multi = Gizmo.selectedSprites && Gizmo.selectedSprites.length > 1;
        contextResizeBtn.style.display = multi ? 'none' : 'block';
        contextDuplicateBtn.style.display = 'block';
        contextDeleteBtn.style.display = 'block';
        contextAlignLeftBtn.style.display = multi ? 'block' : 'none';
        contextAlignTopBtn.style.display = multi ? 'block' : 'none';
        contextAlignCenterBtn.style.display = multi ? 'block' : 'none';
        spriteContextMenu.style.left = `${x}px`;
        spriteContextMenu.style.top = `${y}px`;
        spriteContextMenu.classList.add('show');
    }

    function snapSize(value, gridSize) {
        const snapped = Math.round(value / gridSize) * gridSize;
        return Math.max(gridSize, snapped);
    }

    function getAllowedResizeValue(value) {
        const allowed = [16, 32, 64, 128, 256, 512];
        const v = parseInt(value);
        if (allowed.includes(v)) return v;
        let best = allowed[0];
        let bestDist = Math.abs(v - best);
        for (let i = 1; i < allowed.length; i++) {
            const d = Math.abs(v - allowed[i]);
            if (d < bestDist) {
                bestDist = d;
                best = allowed[i];
            }
        }
        return best;
    }

    function renderResizePreview() {
        resizePreviewCtx.clearRect(0, 0, resizePreviewCanvas.width, resizePreviewCanvas.height);
        if (!resizingSprite || !resizeDraft) return;
        const w = resizeDraft.width;
        const h = resizeDraft.height;
        const pad = 24;
        const maxW = resizePreviewCanvas.width - pad * 2;
        const maxH = resizePreviewCanvas.height - pad * 2;
        const scale = Math.max(1, Math.min(maxW / w, maxH / h));
        const drawW = w * scale;
        const drawH = h * scale;
        const dx = Math.round((resizePreviewCanvas.width - drawW) / 2);
        const dy = Math.round((resizePreviewCanvas.height - drawH) / 2);
        if (resizingSprite.image) {
            resizePreviewCtx.drawImage(resizingSprite.image, dx, dy, drawW, drawH);
        }
        resizePreviewCtx.strokeStyle = '#ff8c00';
        resizePreviewCtx.lineWidth = 2;
        resizePreviewCtx.strokeRect(dx, dy, drawW, drawH);
        const hs = 10;
        resizePreviewCtx.fillStyle = '#ff8c00';
        resizePreviewCtx.fillRect(dx + drawW - hs, dy + drawH - hs, hs, hs);
        resizeDraft.preview = { scale, dx, dy, drawW, drawH, hs };
    }

    function openResizeModal(sprite) {
        resizingSprite = sprite;
        const gridSize = (projectSettings && projectSettings.gridSize) ? projectSettings.gridSize : (Gizmo.gridSize || 32);
        resizeDraft = {
            width: snapSize(sprite.width, gridSize),
            height: snapSize(sprite.height, gridSize),
            gridSize,
            preview: null
        };
        resizeWidthSelect.value = String(getAllowedResizeValue(resizeDraft.width));
        resizeHeightSelect.value = String(getAllowedResizeValue(resizeDraft.height));
        spriteResizeModal.classList.add('show');
        renderResizePreview();
    }

    function closeResizeModal() {
        spriteResizeModal.classList.remove('show');
        resizingSprite = null;
        resizeDraft = null;
        resizeDragActive = false;
    }
    
    async function deleteProjectFromList(projectPath) {
        const confirmed = await window.electronAPI.confirmDeleteProject();
        if (confirmed) {
            const recent = getRecentProjects();
            const updated = recent.filter(p => p.path !== projectPath);
            localStorage.setItem('recentProjects', JSON.stringify(updated));
            displayRecentProjects();
        }
    }
    
    async function loadProject(projectPath) {
        try {
            const projectData = await window.electronAPI.loadProjectFile(projectPath);
            if (projectData) {
                projectSettings = projectData;
                currentProjectPath = projectPath;
                if (!window.imageAssets) window.imageAssets = new Map();
                
                updatePreloader(20, 'Loading assets...');
                
                const spritesToLoad = projectSettings.sprites || [];
                const totalSprites = spritesToLoad.length;
                
                if (totalSprites > 0) {
                    const loadPromises = spritesToLoad.map((spriteData, index) => {
                        return new Promise((resolve) => {
                            if (!spriteData.imageData) {
                                resolve(spriteData);
                                return;
                            }
                            
                            if (window.imageAssets.has(spriteData.imageData)) {
                                spriteData.image = window.imageAssets.get(spriteData.imageData);
                                const progress = 20 + ((index + 1) / totalSprites) * 70;
                                updatePreloader(progress, `Loading ${spriteData.name}...`);
                                resolve(spriteData);
                                return;
                            }
                            
                            const img = new Image();
                            img.onload = () => {
                                spriteData.image = img;
                                window.imageAssets.set(spriteData.imageData, img);
                                const progress = 20 + ((index + 1) / totalSprites) * 70;
                                updatePreloader(progress, `Loading ${spriteData.name}...`);
                                resolve(spriteData);
                            };
                            img.onerror = () => {
                                const progress = 20 + ((index + 1) / totalSprites) * 70;
                                updatePreloader(progress, `Failed: ${spriteData.name}`);
                                resolve(spriteData);
                            };
                            img.src = spriteData.imageData;
                        });
                    });
                    
                    const loadedSprites = await Promise.all(loadPromises);
                    window.currentSprites = loadedSprites;
                } else {
                    window.currentSprites = [];
                }
                
                updatePreloader(95, 'Preparing editor...');
                
                localStorage.setItem('anemic2d_project', JSON.stringify({ projectPath }));
                saveRecentProject(projectPath, projectSettings.name);
                
                updatePreloader(100, 'Ready!');
                setTimeout(() => {
                    showEditor();
                    hidePreloader();
                }, 200);
            }
        } catch (e) {
            console.error('Failed to load project:', e);
            hidePreloader();
        }
    }
    
    function showHome() {
        homeScreen.classList.add('active');
        editorScreen.classList.remove('active');
        hidePreloader();
    }
    
    function showEditor() {
        homeScreen.classList.remove('active');
        editorScreen.classList.add('active');
        applyProjectSettings();
        render();
        startAutoSave();
    }
    
    function boot() {
        const stored = localStorage.getItem('anemic2d_project');
        if (!stored) {
            updatePreloader(100, 'Ready!');
            setTimeout(() => {
                showHome();
            }, 200);
            return;
        }
        try {
            const parsed = JSON.parse(stored);
            const projectPath = parsed && parsed.projectPath ? parsed.projectPath : null;
            if (!projectPath) {
                localStorage.removeItem('anemic2d_project');
                updatePreloader(100, 'Ready!');
                setTimeout(() => {
                    showHome();
                }, 200);
                return;
            }
            homeScreen.classList.remove('active');
            editorScreen.classList.add('active');
            updatePreloader(10, 'Loading project...');
            loadProject(projectPath);
        } catch {
            localStorage.removeItem('anemic2d_project');
            updatePreloader(100, 'Ready!');
            setTimeout(() => {
                showHome();
            }, 200);
        }
    }
    
    
    function applyProjectSettings() {
        if (!projectSettings) return;
        const allowed = [256, 512];
        const requested = parseInt(projectSettings.canvasWidth) || 512;
        const finalSize = allowed.includes(requested) ? requested : 512;
        projectSettings.canvasWidth = finalSize;
        projectSettings.canvasHeight = finalSize;
        canvas.width = finalSize;
        canvas.height = finalSize;
        updateCanvasTransform();
        
        projectNameSpan.textContent = projectSettings.name;
        
        Gizmo.setGridSize(projectSettings.gridSize);
        
        render();
    }
    
    function updateCanvasTransform() {
        canvas.style.transform = `scale(${currentZoom})`;
        canvas.style.transformOrigin = 'top left';
        zoomLevelSpan.textContent = Math.round(currentZoom * 100) + '%';
        window.currentZoom = currentZoom;
    }
    
    function setZoom(zoom) {
        currentZoom = Math.max(0.1, Math.min(5.0, zoom));
        window.currentZoom = currentZoom;
        updateCanvasTransform();
        render();
    }
    
    function zoomIn() {
        setZoom(currentZoom * 1.2);
    }
    
    function zoomOut() {
        setZoom(currentZoom / 1.2);
    }
    
    function zoomReset() {
        setZoom(1.0);
    }
    
    function loadProjectData() {
        History.clear();
        History.pushState(window.currentSprites, { canvasWidth: canvas.width, canvasHeight: canvas.height });
    }
    
    function startAutoSave() {
        if (autoSaveIntervalId) return;
        autoSaveIntervalId = setInterval(async () => {
            if (!projectSettings || !currentProjectPath) return;
            const projectData = {
                name: projectSettings.name,
                canvasWidth: projectSettings.canvasWidth,
                canvasHeight: projectSettings.canvasHeight,
                gridSize: projectSettings.gridSize,
                sprites: window.currentSprites.map(sprite => ({
                    x: sprite.x,
                    y: sprite.y,
                    width: sprite.width,
                    height: sprite.height,
                    name: sprite.name,
                    id: sprite.id,
                    zIndex: sprite.zIndex,
                    srcX: sprite.srcX,
                    srcY: sprite.srcY,
                    srcW: sprite.srcW,
                    srcH: sprite.srcH,
                    imageData: sprite.imageData
                })),
                created: projectSettings.created,
                modified: Date.now(),
                projectPath: currentProjectPath
            };
            await window.electronAPI.autoSaveProject(currentProjectPath, projectData);
        }, 1000);
    }
    
    async function saveProject() {
        if (!projectSettings || !currentProjectPath) return;
        const projectData = {
            name: projectSettings.name,
            canvasWidth: projectSettings.canvasWidth,
            canvasHeight: projectSettings.canvasHeight,
            gridSize: projectSettings.gridSize,
            sprites: window.currentSprites.map(sprite => ({
                x: sprite.x,
                y: sprite.y,
                width: sprite.width,
                height: sprite.height,
                name: sprite.name,
                id: sprite.id || Date.now() + Math.random(),
                zIndex: sprite.zIndex,
                srcX: sprite.srcX,
                srcY: sprite.srcY,
                srcW: sprite.srcW,
                srcH: sprite.srcH,
                imageData: sprite.imageData || null
            })),
            created: projectSettings.created,
            modified: Date.now(),
            projectPath: currentProjectPath
        };
        await window.electronAPI.autoSaveProject(currentProjectPath, projectData);
        localStorage.setItem('anemic2d_project', JSON.stringify({ projectPath: currentProjectPath }));
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawGrid();
        
        window.currentSprites.slice().reverse().forEach(sprite => {
            if (sprite.image) {
                const sw = sprite.srcW != null ? sprite.srcW : (sprite.image.naturalWidth || sprite.image.width);
                const sh = sprite.srcH != null ? sprite.srcH : (sprite.image.naturalHeight || sprite.image.height);
                const sx = sprite.srcX != null ? sprite.srcX : 0;
                const sy = sprite.srcY != null ? sprite.srcY : 0;
                ctx.drawImage(
                    sprite.image,
                    Math.round(sx),
                    Math.round(sy),
                    Math.round(sw),
                    Math.round(sh),
                    Math.round(sprite.x),
                    Math.round(sprite.y),
                    Math.round(sprite.width),
                    Math.round(sprite.height)
                );
            }
        });
        
        Gizmo.drawGizmo();
        Gizmo.drawBoxSelect();
    }
    
    function drawGrid() {
        if (!projectSettings) return;
        
        const gridSize = projectSettings.gridSize;
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    function updateLayerList() {
        layerList.innerHTML = '';
        
        window.currentSprites.forEach((sprite, index) => {
            const item = document.createElement('div');
            item.className = 'layer-item';
            if (Gizmo.selectedSprites.includes(sprite)) {
                item.classList.add('selected');
            }
            item.innerHTML = `
                <span>Sprite ${index + 1}</span>
                <span>${sprite.width}x${sprite.height}</span>
            `;
            item.addEventListener('click', () => {
                Gizmo.selectSprite(sprite, false);
                updateLayerList();
                updatePropertiesPanel();
                render();
            });
            layerList.appendChild(item);
        });
    }

    function getSpritesBounds(sprites) {
        if (!sprites || sprites.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        sprites.forEach(s => {
            minX = Math.min(minX, s.x);
            minY = Math.min(minY, s.y);
            maxX = Math.max(maxX, s.x + s.width);
            maxY = Math.max(maxY, s.y + s.height);
        });
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    function focusCanvas() {
        const sprites = (Gizmo.selectedSprites && Gizmo.selectedSprites.length > 0) ? Gizmo.selectedSprites : (window.currentSprites || []);
        const bounds = getSpritesBounds(sprites);
        if (!bounds) return;
        const container = viewport.parentElement;
        const pad = 40;
        const targetZoom = Math.max(0.1, Math.min(5.0, Math.min((container.clientWidth - pad) / bounds.w, (container.clientHeight - pad) / bounds.h)));
        setZoom(targetZoom);
        requestAnimationFrame(() => {
            const cx = (bounds.x + bounds.w / 2) * targetZoom;
            const cy = (bounds.y + bounds.h / 2) * targetZoom;
            container.scrollLeft = Math.max(0, cx - container.clientWidth / 2);
            container.scrollTop = Math.max(0, cy - container.clientHeight / 2);
        });
    }

    function relinkSpriteImage(sprite) {
        if (!window.imageAssets) window.imageAssets = new Map();
        if (sprite.imageData && window.imageAssets.has(sprite.imageData)) {
            sprite.image = window.imageAssets.get(sprite.imageData);
            return;
        }
        if (!sprite.imageData) return;
        const img = new Image();
        img.onload = () => {
            window.imageAssets.set(sprite.imageData, img);
            sprite.image = img;
            render();
        };
        img.src = sprite.imageData;
        window.imageAssets.set(sprite.imageData, img);
        sprite.image = img;
    }

    function restoreFromHistoryState(state) {
        if (!state) return;
        window.currentSprites = state.map(spriteData => {
            const sprite = { ...spriteData, image: null };
            if (sprite.imageData && window.imageAssets && window.imageAssets.has(sprite.imageData)) {
                sprite.image = window.imageAssets.get(sprite.imageData);
            } else if (sprite.imageData) {
                const img = new Image();
                img.onload = () => {
                    sprite.image = img;
                    if (window.imageAssets) window.imageAssets.set(sprite.imageData, img);
                    render();
                };
                img.src = sprite.imageData;
                if (window.imageAssets) window.imageAssets.set(sprite.imageData, img);
                sprite.image = img;
            }
            return sprite;
        });
        Gizmo.selectedSprites = [];
        updateLayerList();
        updatePropertiesPanel();
        render();
        saveProject();
    }

    function doUndo() {
        const state = History.undo();
        restoreFromHistoryState(state);
    }

    function doRedo() {
        const state = History.redo();
        restoreFromHistoryState(state);
    }

    function deepCloneSpriteForClipboard(sprite) {
        return {
            x: sprite.x,
            y: sprite.y,
            width: sprite.width,
            height: sprite.height,
            name: sprite.name,
            srcX: sprite.srcX,
            srcY: sprite.srcY,
            srcW: sprite.srcW,
            srcH: sprite.srcH,
            imageData: sprite.imageData
        };
    }

    function doCopy() {
        if (!Gizmo.selectedSprites || Gizmo.selectedSprites.length === 0) return;
        window.clipboard = Gizmo.selectedSprites.map(s => deepCloneSpriteForClipboard(s));
    }

    function makeSpriteFromClipboard(data, offset) {
        const sprite = {
            x: data.x + offset,
            y: data.y + offset,
            width: data.width,
            height: data.height,
            name: data.name,
            id: Date.now() + Math.random(),
            imageData: data.imageData || null,
            srcX: data.srcX,
            srcY: data.srcY,
            srcW: data.srcW,
            srcH: data.srcH,
            image: null
        };
        if (sprite.imageData) {
            const img = new Image();
            img.onload = () => {
                sprite.image = img;
                render();
            };
            img.src = sprite.imageData;
            sprite.image = img;
        }
        return sprite;
    }

    function doPaste() {
        if (!window.clipboard || window.clipboard.length === 0) return;
        const gridSize = (projectSettings && projectSettings.gridSize) ? projectSettings.gridSize : (Gizmo.gridSize || 32);
        const bounds = getSpritesBounds(window.clipboard.map(d => ({ x: d.x, y: d.y, width: d.width, height: d.height })));
        const offset = Math.max(12, gridSize);
        const pasted = window.clipboard.map(d => makeSpriteFromClipboard(d, offset));
        if (bounds) {
            const minX = bounds.x;
            const minY = bounds.y;
            pasted.forEach((s, i) => {
                const src = window.clipboard[i];
                s.x = (src.x - minX) + (minX + offset);
                s.y = (src.y - minY) + (minY + offset);
            });
        }
        pasted.forEach(s => window.currentSprites.push(s));
        Gizmo.selectedSprites = pasted;
        History.pushState(window.currentSprites, { canvasWidth: canvas.width, canvasHeight: canvas.height });
        updateLayerList();
        updatePropertiesPanel();
        render();
        saveProject();
    }

    function doDuplicate() {
        if (!Gizmo.selectedSprites || Gizmo.selectedSprites.length === 0) return;
        window.clipboard = Gizmo.selectedSprites.map(s => deepCloneSpriteForClipboard(s));
        doPaste();
    }
    
    function updatePropertiesPanel() {
        propertiesPanel.innerHTML = '';
        
        if (Gizmo.selectedSprites.length === 0) {
            propertiesPanel.innerHTML = '<div style="color: #666;">No sprite selected</div>';
            return;
        }
        
        if (Gizmo.selectedSprites.length === 1) {
            const sprite = Gizmo.selectedSprites[0];
            const properties = [
                { label: 'X', value: sprite.x, editable: true },
                { label: 'Y', value: sprite.y, editable: true },
                { label: 'Width', value: sprite.width, editable: false },
                { label: 'Height', value: sprite.height, editable: false }
            ];
            
            properties.forEach(prop => {
                const row = document.createElement('div');
                row.className = 'property-row';
                if (prop.editable) {
                    row.innerHTML = `
                        <span class="property-label">${prop.label}</span>
                        <input type="number" class="property-input" value="${prop.value}" data-prop="${prop.label.toLowerCase()}">
                    `;
                    const input = row.querySelector('.property-input');
                    input.addEventListener('input', () => {
                        const newValue = parseInt(input.value);
                        if (!isNaN(newValue)) {
                            sprite[prop.label.toLowerCase()] = newValue;
                            render();
                        }
                    });
                    input.addEventListener('change', () => {
                        const newValue = parseInt(input.value);
                        if (!isNaN(newValue)) {
                            sprite[prop.label.toLowerCase()] = newValue;
                            History.pushState(window.currentSprites, { canvasWidth: canvas.width, canvasHeight: canvas.height });
                            updatePropertiesPanel();
                            render();
                            saveProject();
                        }
                    });
                } else {
                    row.innerHTML = `
                        <span class="property-label">${prop.label}</span>
                        <span class="property-value">${prop.value}</span>
                    `;
                }
                propertiesPanel.appendChild(row);
            });
        } else {
            propertiesPanel.innerHTML = `<div style="color: #666;">${Gizmo.selectedSprites.length} sprites selected</div>`;
        }
    }
    
    function setupDragAndDrop() {
        viewport.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        });
        
        viewport.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });
        
        viewport.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');
            
            const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'image/png');
            
            const images = await Promise.all(files.map(file => {
                return new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const image = new Image();
                        image.onload = () => {
                            resolve(image);
                        };
                        image.src = reader.result;
                    };
                    reader.readAsDataURL(file);
                });
            }));
            
            images.forEach((image, index) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                const imageData = canvas.toDataURL('image/png');
                if (!window.imageAssets) window.imageAssets = new Map();
                if (!window.imageAssets.has(imageData)) window.imageAssets.set(imageData, image);
                
                const sprite = {
                    image: image,
                    imageData: imageData,
                    x: 0,
                    y: 0,
                    width: Math.min(image.width, 512),
                    height: Math.min(image.height, 512),
                    name: files[index].name,
                    id: Date.now() + Math.random()
                };
                window.currentSprites.push(sprite);
            });
            
            History.pushState(window.currentSprites, { canvasWidth: canvas.width, canvasHeight: canvas.height });
            updateLayerList();
            render();
            saveProject();
        });
    }
    
    window.onSpriteSelected = (sprites) => {
        updateLayerList();
        updatePropertiesPanel();
        render();
    };
    
    window.onSpriteMoved = (sprites) => {
        updatePropertiesPanel();
        render();
    };
    
    window.onSpriteResized = (sprites) => {
        updatePropertiesPanel();
        render();
    };

    window.onSpritesCommitted = () => {
        History.pushState(window.currentSprites, { canvasWidth: canvas.width, canvasHeight: canvas.height });
        updateLayerList();
        updatePropertiesPanel();
        render();
        saveProject();
    };
    
    window.onSpritesDeleted = () => {
        History.pushState(window.currentSprites, { canvasWidth: canvas.width, canvasHeight: canvas.height });
        updateLayerList();
        updatePropertiesPanel();
        render();
        saveProject();
    };
    
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input fields
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
                return;
            }
            
            if (isAnyModalOpen()) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                Gizmo.deleteSelected();
                return;
            }
            if (e.key && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                focusCanvas();
                return;
            }
            if (e.ctrlKey || e.metaKey) {
                const k = e.key.toLowerCase();
                if (k === 'z') {
                    e.preventDefault();
                    doUndo();
                    return;
                }
                if (k === 'y') {
                    e.preventDefault();
                    doRedo();
                    return;
                }
                if (k === 'c') {
                    e.preventDefault();
                    doCopy();
                    return;
                }
                if (k === 'v') {
                    e.preventDefault();
                    doPaste();
                    return;
                }
                if (k === 'd') {
                    e.preventDefault();
                    doDuplicate();
                    return;
                }
            }
        });
    }
    
    function setupZoomControls() {
        zoomInBtn.addEventListener('click', zoomIn);
        zoomOutBtn.addEventListener('click', zoomOut);
        zoomResetBtn.addEventListener('click', zoomReset);
        
        viewport.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        });
    }
    
    fileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(fileMenuDropdown);
    });

    editMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(editMenuDropdown);
    });
    
    exportMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(exportMenuDropdown);
    });
    
    document.addEventListener('click', () => {
        closeMenus();
    });

    menuUndo.addEventListener('click', () => {
        closeMenus();
        doUndo();
    });

    menuRedo.addEventListener('click', () => {
        closeMenus();
        doRedo();
    });

    menuCopy.addEventListener('click', () => {
        closeMenus();
        doCopy();
    });

    menuPaste.addEventListener('click', () => {
        closeMenus();
        doPaste();
    });

    menuDuplicate.addEventListener('click', () => {
        closeMenus();
        doDuplicate();
    });

    menuFocus.addEventListener('click', () => {
        closeMenus();
        focusCanvas();
    });
    
    menuNewProject.addEventListener('click', () => {
        closeMenus();
        localStorage.removeItem('anemic2d_project');
        showHome();
        newProjectForm.style.display = 'block';
        recentProjects.style.display = 'none';
    });
    
    menuBackToHome.addEventListener('click', () => {
        closeMenus();
        localStorage.removeItem('anemic2d_project');
        window.location.reload();
    });
    
    menuExportPng.addEventListener('click', () => {
        closeMenus();
        const base = projectSettings ? projectSettings.name : 'export';
        ImageExport.exportWithType('png', canvas, base);
    });
    
    menuExportJpg.addEventListener('click', () => {
        closeMenus();
        const base = projectSettings ? projectSettings.name : 'export';
        ImageExport.exportWithType('jpg', canvas, base);
    });
    
    menuExportSvg.addEventListener('click', () => {
        closeMenus();
        const base = projectSettings ? projectSettings.name : 'export';
        ImageExport.exportWithType('svg', canvas, base);
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        hideContextMenu();
        if (!projectSettings) return;
        const rect = canvas.getBoundingClientRect();
        const zoom = window.currentZoom || 1.0;
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;
        const sprite = Gizmo.getSpriteAtPoint(mouseX, mouseY);
        if (!sprite) return;
        const isSelected = Gizmo.selectedSprites && Gizmo.selectedSprites.indexOf(sprite) !== -1;
        if (!isSelected) {
            Gizmo.selectSprite(sprite, false);
            if (window.onSpriteSelected) window.onSpriteSelected(Gizmo.selectedSprites);
        }
        showContextMenu(e.clientX, e.clientY, sprite);
    });

    document.addEventListener('scroll', () => {
        hideContextMenu();
    }, true);

    document.addEventListener('click', () => {
        hideContextMenu();
    });

    contextResizeBtn.addEventListener('click', () => {
        if (!contextMenuSprite) return;
        const sprite = contextMenuSprite;
        hideContextMenu();
        openResizeModal(sprite);
    });


    contextDuplicateBtn.addEventListener('click', () => {
        hideContextMenu();
        doDuplicate();
    });

    contextDeleteBtn.addEventListener('click', () => {
        hideContextMenu();
        Gizmo.deleteSelected();
    });

    function alignSelected(mode) {
        if (!Gizmo.selectedSprites || Gizmo.selectedSprites.length < 2) return;
        const b = getSpritesBounds(Gizmo.selectedSprites);
        if (!b) return;
        if (mode === 'left') {
            Gizmo.selectedSprites.forEach(s => { s.x = b.x; });
        } else if (mode === 'top') {
            Gizmo.selectedSprites.forEach(s => { s.y = b.y; });
        } else if (mode === 'center') {
            Gizmo.selectedSprites.forEach(s => { s.x = b.x + b.w / 2 - s.width / 2; s.y = b.y + b.h / 2 - s.height / 2; });
        }
        History.pushState(window.currentSprites, { canvasWidth: canvas.width, canvasHeight: canvas.height });
        updateLayerList();
        updatePropertiesPanel();
        render();
        saveProject();
    }

    contextAlignLeftBtn.addEventListener('click', () => {
        hideContextMenu();
        alignSelected('left');
    });

    contextAlignTopBtn.addEventListener('click', () => {
        hideContextMenu();
        alignSelected('top');
    });

    contextAlignCenterBtn.addEventListener('click', () => {
        hideContextMenu();
        alignSelected('center');
    });

    resizeCancelBtn.addEventListener('click', () => {
        closeResizeModal();
    });

    resizeSaveBtn.addEventListener('click', () => {
        if (!resizingSprite || !resizeDraft) return;
        const w = getAllowedResizeValue(resizeDraft.width);
        const h = getAllowedResizeValue(resizeDraft.height);
        const gridSize = resizeDraft.gridSize || 32;
        resizingSprite.width = snapSize(w, gridSize);
        resizingSprite.height = snapSize(h, gridSize);
        History.pushState(window.currentSprites, { canvasWidth: canvas.width, canvasHeight: canvas.height });
        updateLayerList();
        updatePropertiesPanel();
        render();
        saveProject();
        closeResizeModal();
    });

    resizeWidthSelect.addEventListener('change', () => {
        if (!resizeDraft) return;
        resizeDraft.width = getAllowedResizeValue(resizeWidthSelect.value);
        renderResizePreview();
    });

    resizeHeightSelect.addEventListener('change', () => {
        if (!resizeDraft) return;
        resizeDraft.height = getAllowedResizeValue(resizeHeightSelect.value);
        renderResizePreview();
    });

    resizePreviewCanvas.addEventListener('mousedown', (e) => {
        if (!resizeDraft || !resizeDraft.preview) return;
        const rect = resizePreviewCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const p = resizeDraft.preview;
        const hx = p.dx + p.drawW - p.hs;
        const hy = p.dy + p.drawH - p.hs;
        if (x >= hx && x <= hx + p.hs && y >= hy && y <= hy + p.hs) {
            resizeDragActive = true;
            e.preventDefault();
        }
    });

    window.addEventListener('mouseup', () => {
        resizeDragActive = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (!resizeDragActive || !resizeDraft || !resizeDraft.preview) return;
        const rect = resizePreviewCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const p = resizeDraft.preview;
        const rawW = Math.max(1, (x - p.dx) / p.scale);
        const rawH = Math.max(1, (y - p.dy) / p.scale);
        const snappedW = snapSize(rawW, resizeDraft.gridSize);
        const snappedH = snapSize(rawH, resizeDraft.gridSize);
        resizeDraft.width = Math.min(512, snappedW);
        resizeDraft.height = Math.min(512, snappedH);
        resizeWidthSelect.value = String(getAllowedResizeValue(resizeDraft.width));
        resizeHeightSelect.value = String(getAllowedResizeValue(resizeDraft.height));
        renderResizePreview();
    });

    
    newProjectOption.addEventListener('click', () => {
        newProjectForm.style.display = 'block';
        recentProjects.style.display = 'none';
    });
    
    recentProjectsOption.addEventListener('click', () => {
        newProjectForm.style.display = 'none';
        recentProjects.style.display = 'block';
        displayRecentProjects();
    });
    
    browseBtn.addEventListener('click', () => {
        window.electronAPI.openDirectoryDialog((path) => {
            if (path) {
                projectLocationInput.value = path;
            }
        });
    });
    
    createProjectBtn.addEventListener('click', async () => {
        const name = projectNameInput.value.trim();
        const location = projectLocationInput.value.trim();
        const canvasSize = parseInt(canvasSizeSelectHome.value);
        const gridSize = parseInt(gridSizeSelect.value);
        
        if (!name || !location) {
            alert('Please fill in all fields');
            return;
        }
        
        const sanitizedName = sanitizeProjectName(name);
        
        try {
            const finalProjectPath = await window.electronAPI.createProjectFolder(location, sanitizedName);
            if (finalProjectPath) {
                const allowed = [256, 512];
                const finalSize = allowed.includes(canvasSize) ? canvasSize : 512;
                projectSettings = {
                    name: name,
                    canvasWidth: finalSize,
                    canvasHeight: finalSize,
                    gridSize: gridSize,
                    sprites: [],
                    created: Date.now(),
                    modified: Date.now(),
                    projectPath: finalProjectPath
                };
                currentProjectPath = finalProjectPath;
                window.currentSprites = [];
                await window.electronAPI.saveProjectFile(finalProjectPath, projectSettings);
                localStorage.setItem('anemic2d_project', JSON.stringify({ projectPath: finalProjectPath }));
                saveRecentProject(finalProjectPath, name);
                showEditor();
            } else {
                alert('Failed to create project folder');
            }
        } catch (e) {
            alert('Error creating project: ' + e.message);
        }
    });
    
    setupDragAndDrop();
    setupKeyboardShortcuts();
    setupZoomControls();
    Gizmo.init(canvas, ctx);
    
    updateLayerList();
    updatePropertiesPanel();
    boot();
});
