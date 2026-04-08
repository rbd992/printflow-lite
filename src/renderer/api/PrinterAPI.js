// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — PrinterAPI.js
// Multi-brand 3D Printer API Service
// Supports: OctoPrint, Klipper/Moonraker, Bambu Lab, Prusa Connect,
//           Creality Cloud, Duet3D/RRF, Repetier Server
// Place in: src/renderer/api/PrinterAPI.js
// ──────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import { io } from 'socket.io-client';

// ── Brand Configuration Registry ────────────────────────────────────────────

export const PRINTER_BRANDS = {
  octoprint: {
    id: 'octoprint',
    name: 'OctoPrint',
    description: 'Open-source 3D printer host (Raspberry Pi)',
    defaultPort: 80,
    authType: 'apikey',       // X-Api-Key header
    protocol: 'http',
    features: [
      'status', 'temperature', 'job', 'files', 'webcam', 'gcode',
      'connection', 'system', 'settings', 'timelapse', 'slicing',
      'logs', 'plugins', 'printer_profiles', 'user_mgmt',
    ],
    cameraTypes: ['mjpeg', 'snapshot'],
  },
  klipper: {
    id: 'klipper',
    name: 'Klipper / Moonraker',
    description: 'High-performance firmware with Moonraker API',
    defaultPort: 7125,
    authType: 'apikey_or_oneshot',  // API key or one-shot token
    protocol: 'http',
    features: [
      'status', 'temperature', 'job', 'files', 'webcam', 'gcode',
      'machine_info', 'history', 'announcements', 'job_queue',
      'database', 'update_manager', 'power_devices', 'sensors',
      'file_metadata', 'gcode_macros', 'bed_mesh', 'input_shaper',
    ],
    cameraTypes: ['mjpeg', 'webrtc', 'hlsstream', 'snapshot'],
  },
  bambulab: {
    id: 'bambulab',
    name: 'Bambu Lab',
    description: 'Bambu Lab printers via local MQTT + Cloud',
    defaultPort: 8883,
    authType: 'access_code',   // Device access code for local MQTT
    protocol: 'mqtts',
    features: [
      'status', 'temperature', 'job', 'files', 'webcam', 'gcode',
      'ams_status', 'print_speed', 'light_control', 'fan_control',
      'chamber_temp', 'nozzle_type', 'layer_info', 'hms_errors',
      'cloud_print', 'cloud_files', 'firmware_update',
    ],
    cameraTypes: ['rtsp', 'bambu_stream'],
  },
  prusa: {
    id: 'prusa',
    name: 'Prusa Connect / PrusaLink',
    description: 'Original Prusa printers via PrusaLink or Connect',
    defaultPort: 80,
    authType: 'apikey',        // X-Api-Key header (PrusaLink) or bearer (Connect)
    protocol: 'http',
    features: [
      'status', 'temperature', 'job', 'files', 'webcam',
      'printer_info', 'storage', 'transfer', 'network',
      'system_info', 'firmware_info', 'mmu_status',
    ],
    cameraTypes: ['snapshot', 'mjpeg'],
  },
  creality: {
    id: 'creality',
    name: 'Creality Cloud',
    description: 'Creality printers via Creality Cloud API or local WiFi',
    defaultPort: 9999,
    authType: 'token',          // Creality Cloud token or local device token
    protocol: 'http',
    features: [
      'status', 'temperature', 'job', 'files', 'webcam',
      'cloud_sync', 'remote_print', 'model_library',
      'firmware_update', 'leveling_data',
    ],
    cameraTypes: ['mjpeg', 'snapshot'],
  },
  duet: {
    id: 'duet',
    name: 'Duet3D / RepRapFirmware',
    description: 'Duet boards running RepRapFirmware',
    defaultPort: 80,
    authType: 'password',       // Session-based (rr_connect)
    protocol: 'http',
    features: [
      'status', 'temperature', 'job', 'files', 'webcam', 'gcode',
      'object_model', 'heightmap', 'macros', 'network_config',
      'plugins', 'system_info', 'filament_monitor',
    ],
    cameraTypes: ['mjpeg', 'snapshot'],
  },
  repetier: {
    id: 'repetier',
    name: 'Repetier Server',
    description: 'Multi-printer management via Repetier Server',
    defaultPort: 3344,
    authType: 'apikey',
    protocol: 'http',
    features: [
      'status', 'temperature', 'job', 'files', 'webcam', 'gcode',
      'multi_printer', 'models', 'slicer', 'timelapse',
      'messaging', 'logs', 'updates',
    ],
    cameraTypes: ['mjpeg', 'snapshot'],
  },
};


// ── Base HTTP Client Factory ────────────────────────────────────────────────

function createClient(baseURL, brand, credentials) {
  const headers = { 'Content-Type': 'application/json' };

  switch (brand.authType) {
    case 'apikey':
      headers['X-Api-Key'] = credentials.apiKey;
      break;
    case 'apikey_or_oneshot':
      if (credentials.apiKey) headers['X-Api-Key'] = credentials.apiKey;
      break;
    case 'token':
    case 'access_code':
      headers['Authorization'] = `Bearer ${credentials.token || credentials.accessCode}`;
      break;
    case 'password':
      // Duet uses session-based auth — handled per-request
      break;
    default:
      break;
  }

  return axios.create({
    baseURL,
    headers,
    timeout: 10000,
  });
}


// ── OctoPrint API ───────────────────────────────────────────────────────────

export class OctoPrintAPI {
  constructor(host, port, apiKey) {
    this.brand = PRINTER_BRANDS.octoprint;
    this.baseURL = `http://${host}:${port}`;
    this.http = createClient(this.baseURL, this.brand, { apiKey });
    this.socketUrl = `${this.baseURL}/sockjs`;
  }

  // ─ Server / Connection ─
  async getVersion()         { return (await this.http.get('/api/version')).data; }
  async getServer()          { return (await this.http.get('/api/server')).data; }

  async getConnection()      { return (await this.http.get('/api/connection')).data; }
  async connect(port, baudrate, printerProfile) {
    return (await this.http.post('/api/connection', {
      command: 'connect', port, baudrate, printerProfile,
    })).data;
  }
  async disconnect() {
    return (await this.http.post('/api/connection', { command: 'disconnect' })).data;
  }

  // ─ Printer State & Temperature ─
  async getPrinterState()    { return (await this.http.get('/api/printer')).data; }
  async getTemperature()     { return (await this.http.get('/api/printer?history=true&limit=30')).data; }
  async setToolTemp(tool, target) {
    return (await this.http.post('/api/printer/tool', {
      command: 'target', targets: { [tool]: target },
    })).data;
  }
  async setBedTemp(target) {
    return (await this.http.post('/api/printer/bed', {
      command: 'target', target,
    })).data;
  }
  async setChamberTemp(target) {
    return (await this.http.post('/api/printer/chamber', {
      command: 'target', target,
    })).data;
  }
  async setFeedRate(factor)  {
    return (await this.http.post('/api/printer/printhead', {
      command: 'feedrate', factor,
    })).data;
  }
  async setFlowRate(factor)  {
    return (await this.http.post('/api/printer/tool', {
      command: 'flowrate', factor,
    })).data;
  }

  // ─ Print Head Movement ─
  async jog(x = 0, y = 0, z = 0, speed) {
    return (await this.http.post('/api/printer/printhead', {
      command: 'jog', x, y, z, speed,
    })).data;
  }
  async home(axes = ['x', 'y', 'z']) {
    return (await this.http.post('/api/printer/printhead', {
      command: 'home', axes,
    })).data;
  }
  async extrude(amount, speed) {
    return (await this.http.post('/api/printer/tool', {
      command: 'extrude', amount, speed,
    })).data;
  }

  // ─ Job / Print Control ─
  async getJob()             { return (await this.http.get('/api/job')).data; }
  async startJob()           { return (await this.http.post('/api/job', { command: 'start' })).data; }
  async cancelJob()          { return (await this.http.post('/api/job', { command: 'cancel' })).data; }
  async restartJob()         { return (await this.http.post('/api/job', { command: 'restart' })).data; }
  async pauseJob(action = 'pause') {
    return (await this.http.post('/api/job', { command: 'pause', action })).data;
  }
  async resumeJob()          { return this.pauseJob('resume'); }

  // ─ File Management ─
  async getFiles(location = 'local', recursive = true) {
    return (await this.http.get(`/api/files/${location}?recursive=${recursive}`)).data;
  }
  async uploadFile(location, file, path, print = false) {
    const form = new FormData();
    form.append('file', file);
    if (path) form.append('path', path);
    form.append('print', print.toString());
    return (await this.http.post(`/api/files/${location}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })).data;
  }
  async deleteFile(location, filename) {
    return (await this.http.delete(`/api/files/${location}/${filename}`)).data;
  }
  async selectFile(location, filename, print = false) {
    return (await this.http.post(`/api/files/${location}/${filename}`, {
      command: 'select', print,
    })).data;
  }

  // ─ GCode Commands ─
  async sendGcode(commands) {
    const cmds = Array.isArray(commands) ? commands : [commands];
    return (await this.http.post('/api/printer/command', { commands: cmds })).data;
  }

  // ─ System ─
  async getSystemCommands()  { return (await this.http.get('/api/system/commands')).data; }
  async executeSystemCommand(source, action) {
    return (await this.http.post(`/api/system/commands/${source}/${action}`)).data;
  }
  async getSettings()        { return (await this.http.get('/api/settings')).data; }
  async saveSettings(data)   { return (await this.http.post('/api/settings', data)).data; }

  // ─ Printer Profiles ─
  async getProfiles()        { return (await this.http.get('/api/printerprofiles')).data; }
  async getProfile(id)       { return (await this.http.get(`/api/printerprofiles/${id}`)).data; }

  // ─ Timelapse ─
  async getTimelapse()       { return (await this.http.get('/api/timelapse')).data; }
  async deleteTimelapse(fn)  { return (await this.http.delete(`/api/timelapse/${fn}`)).data; }
  async configTimelapse(cfg) { return (await this.http.post('/api/timelapse', cfg)).data; }

  // ─ Slicing ─
  async getSlicers()         { return (await this.http.get('/api/slicing')).data; }
  async getSlicerProfiles(slicer) {
    return (await this.http.get(`/api/slicing/${slicer}/profiles`)).data;
  }

  // ─ Logs ─
  async getLogs()            { return (await this.http.get('/api/logs')).data; }

  // ─ Plugin Manager ─
  async getPlugins()         { return (await this.http.get('/api/plugin/pluginmanager')).data; }

  // ─ Webcam ─
  getCameraStreamUrl()       { return `${this.baseURL}/webcam/?action=stream`; }
  getCameraSnapshotUrl()     { return `${this.baseURL}/webcam/?action=snapshot`; }

  // ─ SockJS / Realtime ─
  createSocket(onMessage) {
    // OctoPrint uses SockJS — simplified long-polling fallback here
    // In production, use sockjs-client library
    const eventSource = new EventSource(`${this.baseURL}/api/printer?history=true`);
    eventSource.onmessage = (e) => onMessage(JSON.parse(e.data));
    return { close: () => eventSource.close() };
  }
}


// ── Klipper / Moonraker API ─────────────────────────────────────────────────

export class KlipperMoonrakerAPI {
  constructor(host, port = 7125, apiKey) {
    this.brand = PRINTER_BRANDS.klipper;
    this.baseURL = `http://${host}:${port}`;
    this.http = createClient(this.baseURL, this.brand, { apiKey });
    this.ws = null;
  }

  // ─ Printer Info & Status ─
  async getInfo()            { return (await this.http.get('/printer/info')).data; }
  async getObjects()         { return (await this.http.get('/printer/objects/list')).data; }
  async queryStatus(objects) {
    // objects: { heater_bed: null, extruder: ['temperature','target'], ... }
    const params = new URLSearchParams();
    Object.entries(objects).forEach(([key, fields]) => {
      params.append(key, fields ? fields.join(',') : '');
    });
    return (await this.http.get(`/printer/objects/query?${params}`)).data;
  }
  async subscribeStatus(objects) {
    return (await this.http.post('/printer/objects/subscribe', { objects })).data;
  }
  async getEndstops()        { return (await this.http.get('/printer/query_endstops/status')).data; }

  // ─ GCode ─
  async sendGcode(script)    {
    return (await this.http.post('/printer/gcode/script', { script })).data;
  }
  async getGcodeHelp()       { return (await this.http.get('/printer/gcode/help')).data; }

  // ─ Emergency Stop / Restart ─
  async emergencyStop()      { return (await this.http.post('/printer/emergency_stop')).data; }
  async restart()            { return (await this.http.post('/printer/restart')).data; }
  async firmwareRestart()    { return (await this.http.post('/printer/firmware_restart')).data; }

  // ─ Print Control ─
  async startPrint(filename) {
    return (await this.http.post('/printer/print/start', { filename })).data;
  }
  async pausePrint()         { return (await this.http.post('/printer/print/pause')).data; }
  async resumePrint()        { return (await this.http.post('/printer/print/resume')).data; }
  async cancelPrint()        { return (await this.http.post('/printer/print/cancel')).data; }

  // ─ File Management ─
  async listFiles(root = 'gcodes') {
    return (await this.http.get(`/server/files/list?root=${root}`)).data;
  }
  async getFileMetadata(filename) {
    return (await this.http.get(`/server/files/metadata?filename=${encodeURIComponent(filename)}`)).data;
  }
  async uploadFile(root, file, path) {
    const form = new FormData();
    form.append('file', file);
    if (path) form.append('path', path);
    form.append('root', root);
    return (await this.http.post('/server/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })).data;
  }
  async deleteFile(root, filename) {
    return (await this.http.delete(`/server/files/${root}/${filename}`)).data;
  }
  async moveFile(source, dest) {
    return (await this.http.post('/server/files/move', { source, dest })).data;
  }
  async copyFile(source, dest) {
    return (await this.http.post('/server/files/copy', { source, dest })).data;
  }
  async createDirectory(root, path) {
    return (await this.http.post(`/server/files/directory`, { root, path })).data;
  }
  async getRoots()           { return (await this.http.get('/server/files/roots')).data; }

  // ─ Job History ─
  async getHistory(limit = 50, start = 0, order = 'desc') {
    return (await this.http.get(`/server/history/list?limit=${limit}&start=${start}&order=${order}`)).data;
  }
  async getHistoryTotals()   { return (await this.http.get('/server/history/totals')).data; }
  async deleteHistoryJob(uid){
    return (await this.http.delete(`/server/history/job?uid=${uid}`)).data;
  }

  // ─ Job Queue ─
  async getJobQueue()        { return (await this.http.get('/server/job_queue/status')).data; }
  async enqueueJob(filenames){
    return (await this.http.post('/server/job_queue/job', { filenames })).data;
  }
  async removeFromQueue(ids) {
    return (await this.http.delete('/server/job_queue/job', { data: { job_ids: ids } })).data;
  }
  async startQueue()         { return (await this.http.post('/server/job_queue/start')).data; }
  async pauseQueue()         { return (await this.http.post('/server/job_queue/pause')).data; }

  // ─ Webcams ─
  async listWebcams()        { return (await this.http.get('/server/webcams/list')).data; }
  async getWebcamInfo(name)  { return (await this.http.get(`/server/webcams/item?name=${name}`)).data; }

  // ─ Machine / System ─
  async getSystemInfo()      { return (await this.http.get('/machine/system_info')).data; }
  async getMachineProcs()    { return (await this.http.get('/machine/proc_stats')).data; }
  async rebootMachine()      { return (await this.http.post('/machine/reboot')).data; }
  async shutdownMachine()    { return (await this.http.post('/machine/shutdown')).data; }
  async getServiceStatus(service) {
    return (await this.http.get(`/machine/services/status?service=${service}`)).data;
  }

  // ─ Power Devices ─
  async getPowerDevices()    { return (await this.http.get('/machine/device_power/devices')).data; }
  async getPowerStatus(device) {
    return (await this.http.get(`/machine/device_power/status?${device}`)).data;
  }
  async setPowerDevice(device, action) {
    return (await this.http.post(`/machine/device_power/${action}`, { [device]: null })).data;
  }

  // ─ Update Manager ─
  async getUpdateStatus()    { return (await this.http.get('/machine/update/status')).data; }
  async updateClient(name)   {
    return (await this.http.post('/machine/update/client', { name })).data;
  }
  async updateSystem()       { return (await this.http.post('/machine/update/system')).data; }

  // ─ Announcements ─
  async getAnnouncements()   { return (await this.http.get('/server/announcements/list')).data; }

  // ─ Database (key-value store) ─
  async listDatabases()      { return (await this.http.get('/server/database/list')).data; }
  async getDbItem(ns, key)   {
    return (await this.http.get(`/server/database/item?namespace=${ns}&key=${key}`)).data;
  }
  async setDbItem(ns, key, value) {
    return (await this.http.post('/server/database/item', { namespace: ns, key, value })).data;
  }
  async deleteDbItem(ns, key){
    return (await this.http.delete(`/server/database/item?namespace=${ns}&key=${key}`)).data;
  }

  // ─ Sensors ─
  async listSensors()        { return (await this.http.get('/server/sensors/list')).data; }
  async getSensorInfo(name)  { return (await this.http.get(`/server/sensors/info?sensor=${name}`)).data; }
  async getSensorMeasurements(name) {
    return (await this.http.get(`/server/sensors/measurements?sensor=${name}`)).data;
  }

  // ─ Bed Mesh ─
  async getBedMesh() {
    return this.queryStatus({ bed_mesh: null });
  }

  // ─ Input Shaper ─
  async getInputShaper() {
    return this.queryStatus({ input_shaper: null });
  }

  // ─ Camera Helpers ─
  getCameraStreamUrl(webcamName) {
    return `${this.baseURL}/webcam/?action=stream${webcamName ? `&name=${webcamName}` : ''}`;
  }
  getCameraSnapshotUrl(webcamName) {
    return `${this.baseURL}/webcam/?action=snapshot${webcamName ? `&name=${webcamName}` : ''}`;
  }

  // ─ WebSocket Realtime ─
  connectWebSocket(onMessage, onError) {
    const wsUrl = this.baseURL.replace('http', 'ws') + '/websocket';
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      // Subscribe to all printer objects for live updates
      this.ws.send(JSON.stringify({
        jsonrpc: '2.0', method: 'printer.objects.subscribe', id: 1,
        params: { objects: { extruder: null, heater_bed: null, print_stats: null, display_status: null, virtual_sdcard: null, toolhead: null } },
      }));
    };
    this.ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch {}
    };
    this.ws.onerror = onError;
    return this.ws;
  }
  disconnectWebSocket() { this.ws?.close(); }
}


// ── Bambu Lab API (Local MQTT + Cloud REST) ─────────────────────────────────

export class BambuLabAPI {
  constructor(host, accessCode, serialNumber, cloudToken = null) {
    this.brand = PRINTER_BRANDS.bambulab;
    this.host = host;
    this.accessCode = accessCode;
    this.serial = serialNumber;
    this.mqttClient = null;
    this.lastReport = null;

    // Cloud API (optional)
    this.cloudBaseURL = 'https://api.bambulab.com/v1';
    this.cloudHttp = cloudToken ? axios.create({
      baseURL: this.cloudBaseURL,
      headers: { Authorization: `Bearer ${cloudToken}` },
      timeout: 15000,
    }) : null;
  }

  // ─ Local MQTT (requires mqtt.js — integrated at Electron level) ─
  // These methods define the MQTT topic structure and payloads.
  // In production, the main process handles MQTT and forwards via IPC.

  getMqttTopic(type) {
    return `device/${this.serial}/report`;
  }
  getCommandTopic() {
    return `device/${this.serial}/request`;
  }

  buildPushAllCommand() {
    return JSON.stringify({ pushing: { sequence_id: '0', command: 'pushall' } });
  }
  buildPrintCommand(url, filename) {
    return JSON.stringify({
      print: { sequence_id: '0', command: 'project_file', url, filename, subtask_name: filename },
    });
  }
  buildPauseCommand()    { return JSON.stringify({ print: { sequence_id: '0', command: 'pause' } }); }
  buildResumeCommand()   { return JSON.stringify({ print: { sequence_id: '0', command: 'resume' } }); }
  buildStopCommand()     { return JSON.stringify({ print: { sequence_id: '0', command: 'stop' } }); }
  buildGcodeCommand(gcode) {
    return JSON.stringify({
      print: { sequence_id: '0', command: 'gcode_line', param: gcode },
    });
  }
  buildSpeedCommand(profile) {
    // profile: 1=silent, 2=standard, 3=sport, 4=ludicrous
    return JSON.stringify({
      print: { sequence_id: '0', command: 'print_speed', param: String(profile) },
    });
  }
  buildLightCommand(on) {
    return JSON.stringify({
      system: { sequence_id: '0', command: 'ledctrl', led_node: 'chamber_light', led_mode: on ? 'on' : 'off' },
    });
  }
  buildAmsControlCommand(amsId, trayId) {
    return JSON.stringify({
      print: { sequence_id: '0', command: 'ams_change_filament', target: amsId, curr_temp: 0, tar_temp: 0 },
    });
  }

  // ─ Parse MQTT Report ─
  parseReport(payload) {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const print = data.print || {};
    return {
      state: print.gcode_state || 'UNKNOWN',         // IDLE, RUNNING, PAUSE, FINISH, FAILED
      progress: print.mc_percent || 0,
      layer: print.layer_num || 0,
      totalLayers: print.total_layer_num || 0,
      timeRemaining: print.mc_remaining_time || 0,    // minutes
      fileName: print.gcode_file || '',
      subtaskName: print.subtask_name || '',
      temperatures: {
        nozzle: { actual: print.nozzle_temper || 0, target: print.nozzle_target_temper || 0 },
        bed: { actual: print.bed_temper || 0, target: print.bed_target_temper || 0 },
        chamber: { actual: print.chamber_temper || 0 },
      },
      speeds: {
        profile: print.spd_lvl || 2,
        magnitude: print.spd_mag || 100,
      },
      fans: {
        part: print.cooling_fan_speed ? parseInt(print.cooling_fan_speed, 16) : 0,
        aux: print.big_fan1_speed ? parseInt(print.big_fan1_speed, 16) : 0,
        chamber: print.big_fan2_speed ? parseInt(print.big_fan2_speed, 16) : 0,
      },
      ams: print.ams || null,
      hmsErrors: print.hms || [],
      lightState: print.lights_report?.[0]?.mode || 'off',
      wifiSignal: print.wifi_signal || '',
      nozzleType: print.nozzle_type || 'stainless_steel',
      nozzleDiameter: print.nozzle_diameter || '0.4',
    };
  }

  // ─ Cloud API Methods ─
  async cloudGetDevices() {
    if (!this.cloudHttp) throw new Error('Cloud token not configured');
    return (await this.cloudHttp.get('/iot-service/api/user/bind')).data;
  }
  async cloudGetTaskHistory(deviceId, limit = 20) {
    if (!this.cloudHttp) throw new Error('Cloud token not configured');
    return (await this.cloudHttp.get(`/user-service/my/tasks?deviceId=${deviceId}&limit=${limit}`)).data;
  }
  async cloudGetProjects() {
    if (!this.cloudHttp) throw new Error('Cloud token not configured');
    return (await this.cloudHttp.get('/user-service/my/project')).data;
  }
  async cloudGetProfile() {
    if (!this.cloudHttp) throw new Error('Cloud token not configured');
    return (await this.cloudHttp.get('/user-service/my/profile')).data;
  }

  // ─ Camera ─
  // Bambu Lab uses RTSP for local camera and a proprietary stream for cloud
  getCameraStreamUrl() {
    return `rtsps://${this.host}:322/streaming/live/1`;
  }
  getCameraCredentials() {
    return { username: 'bblp', password: this.accessCode };
  }
}


// ── Prusa Connect / PrusaLink API ───────────────────────────────────────────

export class PrusaAPI {
  constructor(host, port = 80, apiKey, isConnect = false) {
    this.brand = PRINTER_BRANDS.prusa;
    this.isConnect = isConnect;
    this.baseURL = isConnect
      ? 'https://connect.prusa3d.com/api'
      : `http://${host}:${port}/api`;
    this.http = createClient(this.baseURL, this.brand, { apiKey });
  }

  // ─ Printer Info ─
  async getInfo()           { return (await this.http.get('/v1/info')).data; }
  async getStatus()         { return (await this.http.get('/v1/status')).data; }

  // ─ Job Control ─
  async getJob()            { return (await this.http.get('/v1/job')).data; }
  async pauseJob()          { return (await this.http.put('/v1/job', { command: 'PAUSE' })).data; }
  async resumeJob()         { return (await this.http.put('/v1/job', { command: 'RESUME' })).data; }
  async stopJob()           { return (await this.http.delete('/v1/job')).data; }

  // ─ Files & Storage ─
  async getStorageInfo()    { return (await this.http.get('/v1/storage')).data; }
  async getFiles(path = '/') {
    return (await this.http.get(`/v1/files${path}`)).data;
  }
  async uploadFile(file, path = '/usb/') {
    const form = new FormData();
    form.append('file', file);
    return (await this.http.put(`/v1/files${path}${file.name}`, form, {
      headers: { 'Content-Type': 'multipart/form-data', 'Print-After-Upload': '0', 'Overwrite': '0' },
      timeout: 120000,
    })).data;
  }
  async printFile(path) {
    return (await this.http.post(`/v1/files${path}`, null, {
      headers: { 'Print-After-Upload': '1' },
    })).data;
  }
  async deleteFile(path) {
    return (await this.http.delete(`/v1/files${path}`)).data;
  }

  // ─ Transfer ─
  async getTransfer()       { return (await this.http.get('/v1/transfer')).data; }

  // ─ Temperatures ─
  async getTemperature()    {
    const status = await this.getStatus();
    return {
      nozzle: { actual: status.printer?.temp_nozzle, target: status.printer?.target_nozzle },
      bed: { actual: status.printer?.temp_bed, target: status.printer?.target_bed },
    };
  }

  // ─ Cameras ─
  async getCameraSnapshot() { return (await this.http.get('/v1/cameras/snap', { responseType: 'blob' })).data; }
  getCameraSnapshotUrl()    { return `${this.baseURL}/v1/cameras/snap`; }

  // ─ Network / System ─
  async getNetworkInfo() {
    const info = await this.getInfo();
    return { hostname: info.hostname, ip: info.network_info?.ip };
  }
  async getSystemInfo() {
    return (await this.http.get('/v1/info')).data;
  }

  // ─ MMU ─
  async getMMUStatus() {
    const status = await this.getStatus();
    return status.mmu || null;
  }
}


// ── Creality Cloud / Local API ──────────────────────────────────────────────

export class CrealityAPI {
  constructor(host, port = 9999, token = null, cloudToken = null) {
    this.brand = PRINTER_BRANDS.creality;
    this.baseURL = `http://${host}:${port}`;
    this.http = createClient(this.baseURL, this.brand, { token });

    // Cloud
    this.cloudBaseURL = 'https://model-admin-us.crealitycloud.com/api';
    this.cloudHttp = cloudToken ? axios.create({
      baseURL: this.cloudBaseURL,
      headers: { Authorization: `Bearer ${cloudToken}` },
      timeout: 15000,
    }) : null;
  }

  // ─ Local Printer Status ─
  async getStatus()         { return (await this.http.get('/protocal/printer/status')).data; }
  async getTemperatures()   { return (await this.http.get('/protocal/printer/temperature')).data; }
  async getJobInfo()        { return (await this.http.get('/protocal/printer/job')).data; }

  // ─ Local Print Control ─
  async startPrint(filename){
    return (await this.http.post('/protocal/printer/start', { filename })).data;
  }
  async pausePrint()        { return (await this.http.post('/protocal/printer/pause')).data; }
  async resumePrint()       { return (await this.http.post('/protocal/printer/resume')).data; }
  async stopPrint()         { return (await this.http.post('/protocal/printer/stop')).data; }

  // ─ Local Temperature Control ─
  async setNozzleTemp(temp) {
    return (await this.http.post('/protocal/printer/nozzle_temp', { temp })).data;
  }
  async setBedTemp(temp)    {
    return (await this.http.post('/protocal/printer/bed_temp', { temp })).data;
  }

  // ─ Local Files ─
  async getFiles()          { return (await this.http.get('/protocal/printer/files')).data; }
  async uploadFile(file)    {
    const form = new FormData();
    form.append('file', file);
    return (await this.http.post('/protocal/printer/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })).data;
  }
  async deleteFile(filename){
    return (await this.http.post('/protocal/printer/delete', { filename })).data;
  }

  // ─ Local GCode ─
  async sendGcode(gcode)    {
    return (await this.http.post('/protocal/printer/gcode', { gcode })).data;
  }

  // ─ Local Camera ─
  getCameraStreamUrl()      { return `${this.baseURL}/protocal/printer/camera/stream`; }
  getCameraSnapshotUrl()    { return `${this.baseURL}/protocal/printer/camera/snapshot`; }

  // ─ Leveling ─
  async getLevelingData()   { return (await this.http.get('/protocal/printer/leveling')).data; }
  async autoLevel()         { return (await this.http.post('/protocal/printer/auto_level')).data; }

  // ─ Cloud Methods ─
  async cloudGetPrinters()  {
    if (!this.cloudHttp) throw new Error('Cloud token not configured');
    return (await this.cloudHttp.get('/cxy/printer/list')).data;
  }
  async cloudGetModelLibrary(page = 1, limit = 20) {
    if (!this.cloudHttp) throw new Error('Cloud token not configured');
    return (await this.cloudHttp.get(`/cxy/gcodecloud/list?page=${page}&limit=${limit}`)).data;
  }
  async cloudGetPrintHistory(printerId) {
    if (!this.cloudHttp) throw new Error('Cloud token not configured');
    return (await this.cloudHttp.get(`/cxy/printer/history?printerId=${printerId}`)).data;
  }
}


// ── Duet3D / RepRapFirmware API ─────────────────────────────────────────────

export class DuetAPI {
  constructor(host, port = 80, password = '') {
    this.brand = PRINTER_BRANDS.duet;
    this.baseURL = `http://${host}:${port}`;
    this.http = axios.create({ baseURL: this.baseURL, timeout: 10000 });
    this.password = password;
    this.sessionKey = null;
  }

  // ─ Session Auth ─
  async connect() {
    const res = await this.http.get(`/rr_connect?password=${encodeURIComponent(this.password)}`);
    if (res.data.err === 0) this.sessionKey = res.data.sessionKey;
    return res.data;
  }
  async disconnect() {
    return (await this.http.get('/rr_disconnect')).data;
  }

  // ─ Object Model (RRF 3+) ─
  async getObjectModel(key = '', flags = '') {
    const params = [];
    if (key) params.push(`key=${key}`);
    if (flags) params.push(`flags=${flags}`);
    return (await this.http.get(`/rr_model${params.length ? '?' + params.join('&') : ''}`)).data;
  }
  async getFullModel()      { return this.getObjectModel('', 'd99vn'); }
  async getState()          { return this.getObjectModel('state'); }
  async getHeat()           { return this.getObjectModel('heat'); }
  async getMove()           { return this.getObjectModel('move'); }
  async getJob()            { return this.getObjectModel('job'); }
  async getBoards()         { return this.getObjectModel('boards'); }
  async getFans()           { return this.getObjectModel('fans'); }
  async getSensors()        { return this.getObjectModel('sensors'); }
  async getTools()          { return this.getObjectModel('tools'); }
  async getNetwork()        { return this.getObjectModel('network'); }
  async getVolumes()        { return this.getObjectModel('volumes'); }

  // ─ Legacy Status (RRF 2 compat) ─
  async getStatus(type = 2) {
    return (await this.http.get(`/rr_status?type=${type}`)).data;
  }
  async getStatusExtended() { return this.getStatus(2); }
  async getStatusPrint()    { return this.getStatus(3); }

  // ─ GCode ─
  async sendGcode(gcode)    {
    return (await this.http.get(`/rr_gcode?gcode=${encodeURIComponent(gcode)}`)).data;
  }
  async getGcodeReply()     { return (await this.http.get('/rr_reply')).data; }

  // ─ File Management ─
  async getFiles(dir = '0:/gcodes', flagDirs = true) {
    return (await this.http.get(`/rr_filelist?dir=${encodeURIComponent(dir)}&flagDirs=${flagDirs ? 1 : 0}`)).data;
  }
  async getFileInfo(filename) {
    return (await this.http.get(`/rr_fileinfo?name=${encodeURIComponent(filename)}`)).data;
  }
  async uploadFile(filename, content) {
    return (await this.http.post(`/rr_upload?name=${encodeURIComponent(filename)}&time=${new Date().toISOString()}`, content, {
      headers: { 'Content-Type': 'application/octet-stream' },
      timeout: 120000,
    })).data;
  }
  async deleteFile(filename) {
    return (await this.http.get(`/rr_delete?name=${encodeURIComponent(filename)}`)).data;
  }
  async createDirectory(dir) {
    return (await this.http.get(`/rr_mkdir?dir=${encodeURIComponent(dir)}`)).data;
  }
  async moveFile(oldName, newName) {
    return (await this.http.get(`/rr_move?old=${encodeURIComponent(oldName)}&new=${encodeURIComponent(newName)}`)).data;
  }

  // ─ Macros ─
  async getMacros()         { return this.getFiles('0:/macros'); }
  async runMacro(path)      { return this.sendGcode(`M98 P"${path}"`); }

  // ─ Heightmap ─
  async getHeightmap()      { return (await this.http.get('/rr_download?name=0:/sys/heightmap.csv')).data; }

  // ─ Camera ─
  getCameraSnapshotUrl()    { return `${this.baseURL}/webcam/snap`; }
  getCameraStreamUrl()      { return `${this.baseURL}/webcam/stream`; }
}


// ── Repetier Server API ─────────────────────────────────────────────────────

export class RepetierAPI {
  constructor(host, port = 3344, apiKey) {
    this.brand = PRINTER_BRANDS.repetier;
    this.baseURL = `http://${host}:${port}`;
    this.apiKey = apiKey;
    this.http = axios.create({ baseURL: this.baseURL, timeout: 10000 });
  }

  async _call(action, data = {}, printer = '') {
    const payload = {
      action, data, printer, apikey: this.apiKey,
    };
    return (await this.http.post('/printer/api/', JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    })).data;
  }

  // ─ Printer Management ─
  async listPrinters()      { return this._call('listPrinter'); }
  async stateList()         { return this._call('stateList'); }
  async activate(printer)   { return this._call('activate', {}, printer); }
  async deactivate(printer) { return this._call('deactivate', {}, printer); }

  // ─ Status ─
  async getState(printer)   { return this._call('stateList', {}, printer); }

  // ─ Temperature ─
  async setExtruderTemp(printer, extruder, temp) {
    return this._call('setExtruderTemperature', { extruder, temperature: temp }, printer);
  }
  async setBedTemp(printer, temp) {
    return this._call('setBedTemperature', { temperature: temp }, printer);
  }

  // ─ Print Control ─
  async startJob(printer, id) { return this._call('continueJob', {}, printer); }
  async pauseJob(printer)     { return this._call('pauseJob', {}, printer); }
  async stopJob(printer)      { return this._call('stopJob', {}, printer); }

  // ─ GCode ─
  async sendGcode(printer, gcode) {
    return this._call('send', { cmd: gcode }, printer);
  }

  // ─ Files / Models ─
  async listModels(printer) { return this._call('listModels', {}, printer); }
  async removeModel(printer, id) {
    return this._call('removeModel', { id }, printer);
  }
  async copyModelToSD(printer, id) {
    return this._call('copyModel', { id }, printer);
  }

  // ─ Logs ─
  async getLog(printer)     { return this._call('listLog', {}, printer); }

  // ─ Messages ─
  async getMessages()       { return this._call('listMessages'); }
  async removeMessage(id)   { return this._call('removeMessage', { id }); }

  // ─ Updates ─
  async checkUpdate()       { return this._call('updateAvailable'); }

  // ─ Webcam ─
  getCameraStreamUrl(printer) {
    return `${this.baseURL}/printer/cammjpg/${printer}`;
  }
  getCameraSnapshotUrl(printer) {
    return `${this.baseURL}/printer/camshot/${printer}`;
  }

  // ─ WebSocket ─
  connectWebSocket(onMessage) {
    const ws = new WebSocket(`${this.baseURL.replace('http', 'ws')}/socket/?apikey=${this.apiKey}`);
    ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch {}
    };
    return ws;
  }
}


// ── Unified Printer API Factory ─────────────────────────────────────────────

export function createPrinterAPI(config) {
  const { brand, host, port, apiKey, password, accessCode, serialNumber, cloudToken } = config;

  switch (brand) {
    case 'octoprint':
      return new OctoPrintAPI(host, port || 80, apiKey);
    case 'klipper':
      return new KlipperMoonrakerAPI(host, port || 7125, apiKey);
    case 'bambulab':
      return new BambuLabAPI(host, accessCode, serialNumber, cloudToken);
    case 'prusa':
      return new PrusaAPI(host, port || 80, apiKey, !!cloudToken);
    case 'creality':
      return new CrealityAPI(host, port || 9999, apiKey, cloudToken);
    case 'duet':
      return new DuetAPI(host, port || 80, password);
    case 'repetier':
      return new RepetierAPI(host, port || 3344, apiKey);
    default:
      throw new Error(`Unsupported printer brand: ${brand}`);
  }
}


// ── Unified Status Normalizer ───────────────────────────────────────────────
// Converts any brand's status response into a common format

export function normalizeStatus(brand, rawData) {
  const base = {
    state: 'unknown',       // idle, printing, paused, error, offline, complete
    progress: 0,            // 0-100
    fileName: '',
    temperatures: {
      nozzle: { actual: 0, target: 0 },
      bed: { actual: 0, target: 0 },
      chamber: { actual: 0, target: 0 },
    },
    timeElapsed: 0,         // seconds
    timeRemaining: 0,       // seconds
    layer: { current: 0, total: 0 },
  };

  try {
    switch (brand) {
      case 'octoprint': {
        const state = rawData.state?.flags || {};
        base.state = state.printing ? 'printing' : state.paused ? 'paused' :
                     state.error ? 'error' : state.ready ? 'idle' : 'offline';
        base.progress = rawData.progress?.completion || 0;
        base.fileName = rawData.job?.file?.name || '';
        base.timeElapsed = rawData.progress?.printTime || 0;
        base.timeRemaining = rawData.progress?.printTimeLeft || 0;
        const temps = rawData.temperature || {};
        if (temps.tool0) {
          base.temperatures.nozzle = { actual: temps.tool0.actual, target: temps.tool0.target };
        }
        if (temps.bed) {
          base.temperatures.bed = { actual: temps.bed.actual, target: temps.bed.target };
        }
        if (temps.chamber) {
          base.temperatures.chamber = { actual: temps.chamber.actual, target: temps.chamber.target };
        }
        break;
      }
      case 'klipper': {
        const ps = rawData.result?.status?.print_stats || {};
        const stateMap = { standby: 'idle', printing: 'printing', paused: 'paused', error: 'error', complete: 'complete' };
        base.state = stateMap[ps.state] || 'unknown';
        const vsd = rawData.result?.status?.virtual_sdcard || {};
        base.progress = (vsd.progress || 0) * 100;
        base.fileName = ps.filename || '';
        base.timeElapsed = ps.print_duration || 0;
        const ext = rawData.result?.status?.extruder || {};
        base.temperatures.nozzle = { actual: ext.temperature || 0, target: ext.target || 0 };
        const bed = rawData.result?.status?.heater_bed || {};
        base.temperatures.bed = { actual: bed.temperature || 0, target: bed.target || 0 };
        break;
      }
      case 'bambulab': {
        const parsed = rawData; // Assume already parsed via parseReport
        const stateMap = { IDLE: 'idle', RUNNING: 'printing', PAUSE: 'paused', FINISH: 'complete', FAILED: 'error' };
        base.state = stateMap[parsed.state] || 'unknown';
        base.progress = parsed.progress || 0;
        base.fileName = parsed.fileName || '';
        base.timeRemaining = (parsed.timeRemaining || 0) * 60;
        base.temperatures = parsed.temperatures || base.temperatures;
        base.layer = { current: parsed.layer || 0, total: parsed.totalLayers || 0 };
        break;
      }
      case 'prusa': {
        const p = rawData.printer || {};
        const stateMap = { IDLE: 'idle', PRINTING: 'printing', PAUSED: 'paused', FINISHED: 'complete', ATTENTION: 'error' };
        base.state = stateMap[p.state] || 'unknown';
        base.progress = rawData.job?.progress || 0;
        base.fileName = rawData.job?.file?.display_name || '';
        base.timeRemaining = rawData.job?.time_remaining || 0;
        base.timeElapsed = rawData.job?.time_printing || 0;
        base.temperatures.nozzle = { actual: p.temp_nozzle || 0, target: p.target_nozzle || 0 };
        base.temperatures.bed = { actual: p.temp_bed || 0, target: p.target_bed || 0 };
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.warn('[PrinterAPI] Failed to normalize status:', e);
  }

  return base;
}

export default {
  PRINTER_BRANDS,
  createPrinterAPI,
  normalizeStatus,
  OctoPrintAPI,
  KlipperMoonrakerAPI,
  BambuLabAPI,
  PrusaAPI,
  CrealityAPI,
  DuetAPI,
  RepetierAPI,
};
