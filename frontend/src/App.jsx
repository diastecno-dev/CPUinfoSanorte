import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { toPng } from 'html-to-image';

// Main Application Component
function App() {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [obra, setObra] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [tempObra, setTempObra] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  // Obtendo data atual formatada (ex: 03/10/2026)
  const dataAtual = new Date().toLocaleDateString('pt-BR');

  const startSaveFlow = () => {
    setTempObra('');
    setModalOpen(true);
  };

  const confirmSave = async () => {
    if (!tempObra.trim()) return;

    // Use flushSync to force React to update the DOM synchronously
    // This removes the Modal and adds the Title instantly, keeping us in the same user gesture flow
    flushSync(() => {
      setObra(tempObra.trim());
      setModalOpen(false);
      setIsExporting(true);
    });

    try {
      if (!reportRef.current) return;

      // Hide button temporarily
      const btn = document.querySelector('.print-button');
      if (btn) btn.style.display = 'none';

      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#f3f4f6',
        pixelRatio: 2 // High resolution
      });

      if (btn) btn.style.display = ''; // restore button

      const link = document.createElement('a');
      link.download = `Specs_${tempObra.trim().replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;

      // Append, click and remove to ensure browser registers the download
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao gerar a imagem:', err);
      alert('Falha ao exportar a imagem. Erro no console.');
      const btn = document.querySelector('.print-button');
      if (btn) btn.style.display = '';
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        setLoading(true);
        // Assuming backend runs on localhost:3001
        const response = await fetch('http://localhost:3001/api/system-info');
        if (!response.ok) {
          throw new Error('Falha na comunicação com o servidor local.');
        }
        const data = await response.json();
        setSystemData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, []);

  // Format bytes to GB and auto-round to nearest sensible RAM module size (8, 16, 32, 64)
  const formatRAMGB = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'N/A';
    const rawGB = bytes / (1024 * 1024 * 1024);
    // Find nearest power of 2 for total RAM (e.g. 31.6 -> 32)
    const nearestPow2 = Math.pow(2, Math.round(Math.log2(rawGB)));
    // If it's close enough to the power of 2 (within 10%), display the exact rounded size. Otherwise keep standard.
    if (Math.abs(rawGB - nearestPow2) / nearestPow2 < 0.1) {
      return nearestPow2 + ' GB';
    }
    return Math.ceil(rawGB) + ' GB'; // Fallback raw ceiling
  };

  const formatDiskGB = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'N/A';
    return (bytes / (1024 * 1024 * 1024)).toFixed(0) + ' GB'; // Simpler formatting for Disks
  };

  // SVG Icons based on the category
  const IconCPU = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
  );

  const IconRAM = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="16" height="12" rx="2" ry="2"></rect><path d="M4 10h16"></path><path d="M4 14h16"></path><path d="M8 18v2"></path><path d="M12 18v2"></path><path d="M16 18v2"></path></svg>
  );

  const IconDisk = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
  );

  const IconOS = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
  );

  const IconID = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  );

  return (
    <div ref={reportRef} className={isExporting ? "export-mode-active" : ""} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Nav with Logo and Print Feature */}
      <nav className="top-nav">
        <div className="brand-logo">
          <img src="/logo.svg" alt="Sanorte Logo" className="brand-icon" style={{ width: 'auto', height: '40px' }} />
        </div>
        <button className="print-button" onClick={startSaveFlow} disabled={isExporting} title="Salvar as Especificações em Imagem">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          {isExporting ? 'Salvando...' : 'Salvar Specs'}
        </button>
      </nav>

      {/* Custom Modal for Input */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Qual é o nome da Obra?</h3>
            <input
              type="text"
              placeholder="Ex: Edifício Pôr do Sol"
              value={tempObra}
              onChange={(e) => setTempObra(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={confirmSave}>Gerar Foto</button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <header className="hero">
        <h1>Especificações de Hardware</h1>
        <p>Análise detalhada do seu equipamento. Segurança, eficiência e alta performance para a sua infraestrutura.</p>
      </header>

      {/* Main Content Dashboard */}
      <main className="container">
        {/* Clean Title */}
        <div className="section-title-wrapper" style={{ flexDirection: 'column', alignItems: 'center' }}>
          <h2 className="section-title">
            DADOS DO SISTEMA
          </h2>
          {obra && (
            <h3 className="obra-title" style={{ marginTop: '0.8rem', color: 'var(--sn-blue)', fontSize: '1.4rem' }}>Obra: {obra}</h3>
          )}
          <p className="export-date">Gerado em: {dataAtual}</p>
        </div>

        {error && (
          <div className="error-msg">
            <p><strong>Erro:</strong> {error}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 400 }}>Certifique-se de que o backend Node.js (na porta 3001) está rodando simultaneamente.</p>
          </div>
        )}

        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Lendo sensores e barramentos do sistema...</p>
          </div>
        ) : systemData ? (
          <div className={`cards-grid ${isExporting ? 'export-mode' : ''}`}>

            {/* Identificadores Únicos Card (Prioritize this based on recent request) */}
            <div className="card id-card-override">
              <div className="card-header">
                <div className="card-icon"><IconID /></div>
                <h3 className="card-title">Identificação Única (Hardware Signature)</h3>
              </div>
              <div className="data-row">
                <span className="data-label">System Hardware UUID</span>
                <span className="data-value">{systemData.uniqueIdentifiers.hardwareUUID || 'Não Disponível'}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Serial da Placa-Mãe (Baseboard)</span>
                <span className="data-value">{systemData.uniqueIdentifiers.baseboardSerial || 'Não Disponível'}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Serial do Sistema (BIOS/Chassi)</span>
                <span className="data-value">{systemData.uniqueIdentifiers.systemSerial || 'Não Disponível'}</span>
              </div>
              <div className="data-row">
                <span className="data-label">MAC Address (Rede)</span>
                <span className="data-value" style={{ textTransform: 'uppercase' }}>{systemData.uniqueIdentifiers.macAddress || 'Não Disponível'}</span>
              </div>
            </div>

            {/* Processador Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon"><IconCPU /></div>
                <h3 className="card-title">Processador (CPU)</h3>
              </div>
              <div className="data-row">
                <span className="data-label">Fabricante</span>
                <span className="data-value">{systemData.cpu.manufacturer}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Modelo</span>
                <span className="data-value no-wrap" title={systemData.cpu.brand}>{systemData.cpu.brand}</span>
              </div>
              {/* Removed CPU Cores and Speed per user request */}
            </div>

            {/* Memória RAM Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon"><IconRAM /></div>
                <h3 className="card-title">Memória RAM</h3>
              </div>
              <div className="data-row">
                <span className="data-label">Capacidade Total</span>
                <span className="data-value">{formatRAMGB(systemData.memory.total)}</span>
              </div>
              {/* Removed RAM in-use and free per user request */}
            </div>

            {/* Armazenamento Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon"><IconDisk /></div>
                <h3 className="card-title">Armazenamento Físico</h3>
              </div>
              {systemData.disks && systemData.disks.length > 0 ? (
                systemData.disks.map((disk, index) => (
                  <div key={index} style={{ marginBottom: index !== systemData.disks.length - 1 ? '1.5rem' : 0 }}>
                    <div className="data-row">
                      <span className="data-label">Drive {index + 1}</span>
                      <span className="data-value">{disk.name}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Tecnologia</span>
                      <span className="data-value">
                        {/* Highlighting SSD/NVMe in green for aesthetic */}
                        <strong style={{
                          color: (disk.type.toLowerCase().includes('ssd') || disk.type.toLowerCase().includes('nvme')) ? 'var(--sn-green)' : 'inherit'
                        }}>
                          {disk.type.toUpperCase()}
                        </strong>
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Tamanho Total</span>
                      <span className="data-value">{formatDiskGB(disk.size)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="data-row">
                  <span className="data-label">Status</span>
                  <span className="data-value">Nenhum disco detectado</span>
                </div>
              )}
            </div>

            {/* Sistema Operacional Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon"><IconOS /></div>
                <h3 className="card-title">Sistema Operacional</h3>
              </div>
              <div className="data-row">
                <span className="data-label">Plataforma</span>
                <span className="data-value no-wrap" title={systemData.os.distro}>
                  {systemData.os.distro.includes('Windows') ? systemData.os.distro : `${systemData.os.platform} ${systemData.os.distro}`}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Versão (Release)</span>
                <span className="data-value">{systemData.os.release}</span>
              </div>
              {/* Removed OS Architecture and Build per user request */}
            </div>

          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
