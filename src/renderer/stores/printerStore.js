// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — printerStore.js
// Zustand store for multi-brand printer state, cloud, and camera management
// Place in: src/renderer/stores/printerStore.js
// ──────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import api from '../api/client';
import { createPrinterAPI, normalizeStatus, PRINTER_BRANDS } from '../api/PrinterAPI';
import { createCloudClient, CLOUD_PROVIDERS, CloudSyncManager } from '../api/CloudService';
import { getCameraConfig } from '../components/CameraFeed';

const usePrinterStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  printers: [],
  activePrinterId: null,
  printerAPIs: {},          // { [printerId]: API instance }
  printerStatuses: {},      // { [printerId]: normalized status }
  pollingIntervals: {},     // { [printerId]: interval ID }

  cloudConnections: [],
  cloudManager: new CloudSyncManager(),

  cameraConfigs: {},        // { [printerId]: camera config }

  loading: false,
  error: null,


  // ══════════════════════════════════════════════════════════════════════════
  // PRINTER ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  fetchPrinters: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/printers');
      const printers = res.data.printers || [];
      set({ printers, loading: false });

      // Initialize API instances and camera configs for each printer
      const apis = {};
      const cameras = {};
      printers.forEach(p => {
        try {
          apis[p.id] = createPrinterAPI({
            brand: p.brand,
            host: p.host,
            port: p.port,
            apiKey: p.api_key,
            password: p.password,
            accessCode: p.access_code,
            serialNumber: p.serial_number,
          });
        } catch {
          // Skip printers with invalid config
        }

        if (p.camera_enabled) {
          cameras[p.id] = {
            protocol: p.camera_protocol || 'mjpeg',
            streamUrl: p.camera_url || '',
            snapshotUrl: p.camera_snapshot || '',
            webrtcSignalUrl: p.camera_webrtc || '',
            rtspUrl: p.camera_rtsp || '',
            // Auto-generate defaults if custom URLs not set
            ...(!p.camera_url && p.host
              ? getCameraConfig(p.brand, p.host, p.port, {
                  accessCode: p.access_code,
                  printerSlug: p.name?.toLowerCase().replace(/\s+/g, '-'),
                })
              : {}
            ),
          };
        }
      });

      set({ printerAPIs: apis, cameraConfigs: cameras });
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, loading: false });
    }
  },

  addPrinter: async (printerData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/printers', printerData);
      const printer = res.data.printer;
      set(state => ({
        printers: [...state.printers, printer],
        loading: false,
      }));
      // Re-fetch to init APIs
      get().fetchPrinters();
      return printer;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },

  updatePrinter: async (id, updates) => {
    try {
      const res = await api.put(`/printers/${id}`, updates);
      const updated = res.data.printer;
      set(state => ({
        printers: state.printers.map(p => p.id === id ? updated : p),
      }));
      get().fetchPrinters(); // Refresh API instances
      return updated;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
      throw err;
    }
  },

  removePrinter: async (id) => {
    try {
      await api.delete(`/printers/${id}`);
      get().stopPolling(id);
      set(state => ({
        printers: state.printers.filter(p => p.id !== id),
        printerStatuses: { ...state.printerStatuses, [id]: undefined },
        printerAPIs: { ...state.printerAPIs, [id]: undefined },
        cameraConfigs: { ...state.cameraConfigs, [id]: undefined },
      }));
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
    }
  },

  setActivePrinter: (id) => set({ activePrinterId: id }),

  getActivePrinter: () => {
    const { printers, activePrinterId } = get();
    return printers.find(p => p.id === activePrinterId) || null;
  },

  getActivePrinterAPI: () => {
    const { printerAPIs, activePrinterId } = get();
    return printerAPIs[activePrinterId] || null;
  },


  // ══════════════════════════════════════════════════════════════════════════
  // STATUS POLLING
  // ══════════════════════════════════════════════════════════════════════════

  startPolling: (printerId, intervalMs = 3000) => {
    const { printerAPIs, pollingIntervals } = get();
    const printerApi = printerAPIs[printerId];
    if (!printerApi) return;

    // Clear existing polling
    if (pollingIntervals[printerId]) {
      clearInterval(pollingIntervals[printerId]);
    }

    const poll = async () => {
      try {
        let rawStatus;
        const printer = get().printers.find(p => p.id === printerId);
        if (!printer) return;

        switch (printer.brand) {
          case 'octoprint': {
            const [stateRes, jobRes] = await Promise.all([
              printerApi.getPrinterState().catch(() => null),
              printerApi.getJob().catch(() => null),
            ]);
            rawStatus = { ...stateRes, ...jobRes };
            break;
          }
          case 'klipper': {
            rawStatus = await printerApi.queryStatus({
              extruder: null, heater_bed: null, print_stats: null,
              display_status: null, virtual_sdcard: null, toolhead: null,
            }).catch(() => null);
            break;
          }
          case 'prusa': {
            const [status, job] = await Promise.all([
              printerApi.getStatus().catch(() => null),
              printerApi.getJob().catch(() => null),
            ]);
            rawStatus = { printer: status, job };
            break;
          }
          case 'creality': {
            const [status, job, temps] = await Promise.all([
              printerApi.getStatus().catch(() => null),
              printerApi.getJobInfo().catch(() => null),
              printerApi.getTemperatures().catch(() => null),
            ]);
            rawStatus = { ...status, ...job, ...temps };
            break;
          }
          case 'duet': {
            rawStatus = await printerApi.getStatusExtended().catch(() => null);
            break;
          }
          case 'repetier': {
            rawStatus = await printerApi.getState(printer.name).catch(() => null);
            break;
          }
          default:
            break;
        }

        if (rawStatus) {
          const normalized = normalizeStatus(printer.brand, rawStatus);
          set(state => ({
            printerStatuses: { ...state.printerStatuses, [printerId]: normalized },
          }));

          // Log to server
          api.post(`/printers/${printerId}/status`, {
            state: normalized.state,
            progress: normalized.progress,
            nozzle_temp: normalized.temperatures.nozzle.actual,
            nozzle_target: normalized.temperatures.nozzle.target,
            bed_temp: normalized.temperatures.bed.actual,
            bed_target: normalized.temperatures.bed.target,
            filename: normalized.fileName,
          }).catch(() => {});
        }
      } catch {
        set(state => ({
          printerStatuses: {
            ...state.printerStatuses,
            [printerId]: { ...state.printerStatuses[printerId], state: 'offline' },
          },
        }));
      }
    };

    // Initial poll
    poll();

    // Set interval
    const id = setInterval(poll, intervalMs);
    set(state => ({
      pollingIntervals: { ...state.pollingIntervals, [printerId]: id },
    }));
  },

  stopPolling: (printerId) => {
    const { pollingIntervals } = get();
    if (pollingIntervals[printerId]) {
      clearInterval(pollingIntervals[printerId]);
      set(state => ({
        pollingIntervals: { ...state.pollingIntervals, [printerId]: undefined },
      }));
    }
  },

  startAllPolling: (intervalMs = 3000) => {
    const { printers } = get();
    printers.forEach(p => get().startPolling(p.id, intervalMs));
  },

  stopAllPolling: () => {
    const { pollingIntervals } = get();
    Object.keys(pollingIntervals).forEach(id => get().stopPolling(parseInt(id)));
  },


  // ══════════════════════════════════════════════════════════════════════════
  // PRINTER COMMANDS (brand-agnostic)
  // ══════════════════════════════════════════════════════════════════════════

  sendCommand: async (printerId, command, params = {}) => {
    const printerApi = get().printerAPIs[printerId];
    const printer = get().printers.find(p => p.id === printerId);
    if (!printerApi || !printer) throw new Error('Printer not found');

    switch (command) {
      case 'pause':
        switch (printer.brand) {
          case 'octoprint': return printerApi.pauseJob();
          case 'klipper':   return printerApi.pausePrint();
          case 'prusa':     return printerApi.pauseJob();
          case 'creality':  return printerApi.pausePrint();
          default: break;
        }
        break;

      case 'resume':
        switch (printer.brand) {
          case 'octoprint': return printerApi.resumeJob();
          case 'klipper':   return printerApi.resumePrint();
          case 'prusa':     return printerApi.resumeJob();
          case 'creality':  return printerApi.resumePrint();
          default: break;
        }
        break;

      case 'cancel':
        switch (printer.brand) {
          case 'octoprint': return printerApi.cancelJob();
          case 'klipper':   return printerApi.cancelPrint();
          case 'prusa':     return printerApi.stopJob();
          case 'creality':  return printerApi.stopPrint();
          default: break;
        }
        break;

      case 'home':
        switch (printer.brand) {
          case 'octoprint': return printerApi.home(params.axes || ['x','y','z']);
          case 'klipper':   return printerApi.sendGcode('G28');
          case 'creality':  return printerApi.sendGcode('G28');
          case 'duet':      return printerApi.sendGcode('G28');
          default: break;
        }
        break;

      case 'set_nozzle_temp':
        switch (printer.brand) {
          case 'octoprint': return printerApi.setToolTemp('tool0', params.temp);
          case 'klipper':   return printerApi.sendGcode(`M104 S${params.temp}`);
          case 'prusa':     return; // PrusaLink doesn't support temp set via API
          case 'creality':  return printerApi.setNozzleTemp(params.temp);
          case 'duet':      return printerApi.sendGcode(`M104 S${params.temp}`);
          default: break;
        }
        break;

      case 'set_bed_temp':
        switch (printer.brand) {
          case 'octoprint': return printerApi.setBedTemp(params.temp);
          case 'klipper':   return printerApi.sendGcode(`M140 S${params.temp}`);
          case 'creality':  return printerApi.setBedTemp(params.temp);
          case 'duet':      return printerApi.sendGcode(`M140 S${params.temp}`);
          default: break;
        }
        break;

      case 'gcode':
        switch (printer.brand) {
          case 'octoprint': return printerApi.sendGcode(params.code);
          case 'klipper':   return printerApi.sendGcode(params.code);
          case 'creality':  return printerApi.sendGcode(params.code);
          case 'duet':      return printerApi.sendGcode(params.code);
          case 'repetier':  return printerApi.sendGcode(printer.name, params.code);
          default: break;
        }
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  },


  // ══════════════════════════════════════════════════════════════════════════
  // CLOUD CONNECTIONS
  // ══════════════════════════════════════════════════════════════════════════

  fetchCloudConnections: async () => {
    try {
      const res = await api.get('/printers/cloud/connections');
      set({ cloudConnections: res.data.connections || [] });
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
    }
  },

  addCloudConnection: async (data) => {
    try {
      const res = await api.post('/printers/cloud/connections', data);
      set(state => ({
        cloudConnections: [...state.cloudConnections, res.data.connection],
      }));
      return res.data.connection;
    } catch (err) {
      throw err;
    }
  },

  removeCloudConnection: async (id) => {
    try {
      await api.delete(`/printers/cloud/connections/${id}`);
      set(state => ({
        cloudConnections: state.cloudConnections.filter(c => c.id !== id),
      }));
    } catch (err) {
      set({ error: err.response?.data?.error || err.message });
    }
  },

  testCloudConnection: async (provider, credentials) => {
    try {
      const client = createCloudClient(provider, credentials);
      return await client.testConnection();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },


  // ══════════════════════════════════════════════════════════════════════════
  // CAMERA
  // ══════════════════════════════════════════════════════════════════════════

  getCameraConfig: (printerId) => {
    return get().cameraConfigs[printerId] || null;
  },

  updateCameraConfig: (printerId, config) => {
    set(state => ({
      cameraConfigs: { ...state.cameraConfigs, [printerId]: config },
    }));
  },


  // ══════════════════════════════════════════════════════════════════════════
  // CONSTANTS / HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  getBrandInfo: (brand) => PRINTER_BRANDS[brand] || null,
  getCloudProviderInfo: (provider) => CLOUD_PROVIDERS[provider] || null,
  getAllBrands: () => PRINTER_BRANDS,
  getAllCloudProviders: () => CLOUD_PROVIDERS,
}));

export default usePrinterStore;
