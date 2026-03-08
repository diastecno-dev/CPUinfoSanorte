const express = require('express');
const cors = require('cors');
const si = require('systeminformation');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Main route to fetch all system information
app.get('/api/system-info', async (req, res) => {
    try {
        // Fetch all required data concurrently for better performance
        const [cpu, mem, diskLayout, osInfo, baseboard, system, netIfaces] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.diskLayout(),
            si.osInfo(),
            si.baseboard(),
            si.system(),
            si.networkInterfaces()
        ]);

        // Process disk layout to find the main OS drive (or sum them up)
        const disks = diskLayout.map(disk => ({
            name: disk.name,
            vendor: disk.vendor,
            size: disk.size,
            type: disk.type // e.g., 'SSD', 'HD', or 'NVMe'
        }));

        // Get the active network interface (or the first one available with a MAC)
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

// Start the server
app.listen(PORT, () => {
    console.log(`Sanorte System Info Backend running on http://localhost:${PORT}`);
});
