const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow(startPage = 'index.html') {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../icons/icon.ico'),
        show: false
    });

    mainWindow.setMenuBarVisibility(false);
    
    mainWindow.loadFile(path.join(__dirname, '..', startPage));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        app.quit();
    });

    return mainWindow;
}

app.whenReady().then(() => {
    const mainWindow = createWindow();

    mainWindow.webContents.on('did-fail-load', () => {
        mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
    });

    ipcMain.handle('open-directory-dialog', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Select Project Location'
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    });

    ipcMain.handle('confirm-delete-project', async () => {
        const result = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['Cancel', 'Delete'],
            defaultId: 1,
            title: 'Confirm Delete',
            message: 'Are you sure you want to remove this project from the list?'
        });
        return result.response === 1;
    });

    ipcMain.handle('create-project-folder', async (event, basePath, sanitizedName) => {
        const finalPath = path.join(basePath, sanitizedName);
        fs.mkdirSync(finalPath, { recursive: true });
        return finalPath;
    });

    ipcMain.handle('save-project-file', async (event, projectPath, data) => {
        const filePath = path.join(projectPath, 'project.acp');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    });

    ipcMain.handle('load-project-file', async (event, projectPath) => {
        const filePath = path.join(projectPath, 'project.acp');
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return null;
    });

    ipcMain.handle('auto-save-project', async (event, projectPath, data) => {
        const filePath = path.join(projectPath, 'project.acp');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});