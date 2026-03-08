const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const si = require('systeminformation');

// Setup Express Server
const serverApp = express();
const PORT = 3001;

serverApp.use(cors());
serverApp.use(express.json());

// API Endpoint
serverApp.get('/api/system-info', async (req, res) => {
    try {
        const [cpu, mem, diskLayout, osInfo, baseboard, system, netIfaces] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.diskLayout(),
            si.osInfo(),
            si.baseboard(),
            si.system(),
            si.networkInterfaces()
        ]);

        const disks = diskLayout.map(disk => ({
            name: disk.name,
            vendor: disk.vendor,
            size: disk.size,
            type: disk.type
        }));

        let primaryNet = null;
        if (Array.isArray(netIfaces) && netIfaces.length > 0) {
            primaryNet = netIfaces.find(net => net.operstat === 'up') || netIfaces[0];
        }

        const responseData = {
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                cores: cpu.physicalCores,
                threads: cpu.cores,
                speed: cpu.speed,
                speedMax: cpu.speedMax
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.used,
                active: mem.active
            },
            disks: disks,
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                kernel: osInfo.kernel,
                arch: osInfo.arch,
                build: osInfo.build
            },
            uniqueIdentifiers: {
                hardwareUUID: system.uuid,
                baseboardSerial: baseboard.serial,
                systemSerial: system.serial,
                macAddress: primaryNet ? primaryNet.mac : 'Não Encontrado',
                networkInterfaceName: primaryNet ? primaryNet.ifaceName : 'Desconhecida'
            }
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching system information:', error);
        res.status(500).json({ error: 'Failed to retrieve system information' });
    }
});

// Serve frontend build files
serverApp.use(express.static(path.join(__dirname, 'frontend/dist')));

// Fallback for React Router (Single Page Application)
serverApp.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Start Express Server
let server;
let splashWindow;

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 400,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.on('closed', () => (splashWindow = null));
}

// Setup Electron Window
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Don't show until ready
        icon: path.join(__dirname, 'frontend/dist/logo.svg'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true
    });

    // Start Express before loading the URL
    server = serverApp.listen(PORT, '127.0.0.1', () => {
        console.log(`Internal server running on http://127.0.0.1:${PORT}`);
        // Load the frontend through the internal express server
        mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
    });

    // When the main window is ready to be shown
    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.close();
        }
        mainWindow.show();
        mainWindow.focus();
    });

    // Fallback if URL fails
    mainWindow.webContents.on('did-fail-load', () => {
        setTimeout(() => mainWindow.loadURL(`http://127.0.0.1:${PORT}`), 1000);
    });
}

app.whenReady().then(() => {
    createSplashWindow();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (server) {
            server.close();
        }
        app.quit();
    }
});
