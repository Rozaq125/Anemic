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
        createProjectFolder: async (projectPath, sanitizedName) => {
            return await ipcRenderer.invoke('create-project-folder', projectPath, sanitizedName);
        },
        saveProjectFile: async (projectPath, data) => {
            await ipcRenderer.invoke('save-project-file', projectPath, data);
        },
        loadProjectFile: async (projectPath) => {
            return await ipcRenderer.invoke('load-project-file', projectPath);
        }
    };
    const newProjectOption = document.getElementById('newProjectOption');
    const recentProjectsOption = document.getElementById('recentProjectsOption');
    const newProjectForm = document.getElementById('newProjectForm');
    const recentProjects = document.getElementById('recentProjects');
    const recentProjectsList = document.getElementById('recentProjectsList');
    
    const projectNameInput = document.getElementById('projectName');
    const projectLocationInput = document.getElementById('projectLocation');
    const browseBtn = document.getElementById('browseBtn');
    const canvasSizeSelect = document.getElementById('canvasSize');
    const gridSizeSelect = document.getElementById('gridSize');
    const createProjectBtn = document.getElementById('createProject');
    
    function sanitizeProjectName(name) {
        return name.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    function saveRecentProject(projectPath, projectName) {
        const recent = getRecentProjects();
        const updated = recent.filter(p => p.path !== projectPath);
        updated.unshift({ path: projectPath, name: projectName, date: Date.now() });
        const limited = updated.slice(0, 5);
        localStorage.setItem('anemic2d_recent', JSON.stringify(limited));
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
                loadProject(project.path);
            });
            item.querySelector('.delete-project-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteProjectFromList(project.path);
            });
            recentProjectsList.appendChild(item);
        });
    }
    
    async function deleteProjectFromList(projectPath) {
        const confirmed = await window.electronAPI.confirmDeleteProject();
        if (confirmed) {
            const recent = getRecentProjects();
            const updated = recent.filter(p => p.path !== projectPath);
            localStorage.setItem('anemic2d_recent', JSON.stringify(updated));
            displayRecentProjects();
        }
    }
    
    async function loadProject(projectPath) {
        try {
            const projectData = await window.electronAPI.loadProjectFile(projectPath);
            if (projectData) {
                const spritesWithImages = [];
                let loadedCount = 0;
                
                if (projectData.sprites && projectData.sprites.length > 0) {
                    projectData.sprites.forEach((spriteData, index) => {
                        if (spriteData.imageData) {
                            const img = new Image();
                            img.onload = () => {
                                spriteData.image = img;
                                loadedCount++;
                                if (loadedCount === projectData.sprites.length) {
                                    projectData.sprites = spritesWithImages;
                                    localStorage.setItem('anemic2d_project', JSON.stringify(projectData));
                                    saveRecentProject(projectPath, projectData.name);
                                    window.location.href = 'index.html';
                                }
                            };
                            img.onerror = () => {
                                console.error('Failed to load sprite image:', spriteData.name);
                                loadedCount++;
                                if (loadedCount === projectData.sprites.length) {
                                    projectData.sprites = spritesWithImages;
                                    localStorage.setItem('anemic2d_project', JSON.stringify(projectData));
                                    saveRecentProject(projectPath, projectData.name);
                                    window.location.href = 'index.html';
                                }
                            };
                            img.src = spriteData.imageData;
                            spritesWithImages.push(spriteData);
                        } else {
                            spritesWithImages.push(spriteData);
                            loadedCount++;
                            if (loadedCount === projectData.sprites.length) {
                                projectData.sprites = spritesWithImages;
                                localStorage.setItem('anemic2d_project', JSON.stringify(projectData));
                                saveRecentProject(projectPath, projectData.name);
                                window.location.href = 'index.html';
                            }
                        }
                    });
                } else {
                    projectData.sprites = [];
                    localStorage.setItem('anemic2d_project', JSON.stringify(projectData));
                    saveRecentProject(projectPath, projectData.name);
                    window.location.href = 'index.html';
                }
            }
        } catch (e) {
            console.error('Failed to load project:', e);
        }
    }
    
    browseBtn.addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.openDirectoryDialog) {
            window.electronAPI.openDirectoryDialog((path) => {
                if (path) {
                    projectLocationInput.value = path;
                }
            });
        }
    });
    
    newProjectOption.addEventListener('click', () => {
        newProjectForm.classList.add('active');
        recentProjects.classList.remove('active');
    });
    
    recentProjectsOption.addEventListener('click', () => {
        recentProjects.classList.add('active');
        newProjectForm.classList.remove('active');
        displayRecentProjects();
    });
    
    createProjectBtn.addEventListener('click', async () => {
        const projectName = projectNameInput.value.trim();
        const canvasSize = parseInt(canvasSizeSelect.value);
        const gridSize = parseInt(gridSizeSelect.value);
        const projectPath = projectLocationInput.value;
        
        if (!projectName || !projectPath) {
            projectNameInput.style.borderColor = '#ff8c00';
            return;
        }
        
        const sanitizedName = sanitizeProjectName(projectName);
        const finalProjectPath = await window.electronAPI.createProjectFolder(projectPath, sanitizedName);
        
        const projectSettings = {
            name: projectName,
            canvasWidth: canvasSize,
            canvasHeight: canvasSize,
            gridSize: gridSize,
            sprites: [],
            created: Date.now(),
            modified: Date.now(),
            projectPath: finalProjectPath
        };
        
        await window.electronAPI.saveProjectFile(finalProjectPath, projectSettings);
        localStorage.setItem('anemic2d_project', JSON.stringify(projectSettings));
        saveRecentProject(finalProjectPath, projectName);
        window.location.href = 'index.html';
    });
    
    projectNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createProjectBtn.click();
        }
    });
    
    displayRecentProjects();
});
