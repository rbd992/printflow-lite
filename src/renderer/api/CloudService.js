// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — CloudService.js
// Cloud Platform Integrations
// Supports: Bambu Cloud, Prusa Connect Cloud, Creality Cloud,
//           OctoPrint Anywhere/Cloud, Google Drive, Dropbox, AWS S3
// Place in: src/renderer/api/CloudService.js
// ──────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

// ── Cloud Provider Registry ─────────────────────────────────────────────────

export const CLOUD_PROVIDERS = {
  bambu_cloud: {
    id: 'bambu_cloud',
    name: 'Bambu Cloud',
    description: 'Bambu Lab cloud for remote monitoring and print farm management',
    authType: 'token',
    baseURL: 'https://api.bambulab.com/v1',
    features: ['remote_status', 'remote_print', 'file_sync', 'print_history', 'device_management'],
  },
  prusa_connect: {
    id: 'prusa_connect',
    name: 'Prusa Connect',
    description: 'Prusa cloud platform for remote printer management',
    authType: 'bearer',
    baseURL: 'https://connect.prusa3d.com/api',
    features: ['remote_status', 'remote_print', 'file_sync', 'print_history', 'camera', 'multi_printer'],
  },
  creality_cloud: {
    id: 'creality_cloud',
    name: 'Creality Cloud',
    description: 'Creality cloud for remote printing and model library',
    authType: 'token',
    baseURL: 'https://model-admin-us.crealitycloud.com/api',
    features: ['remote_status', 'remote_print', 'model_library', 'community', 'slicing'],
  },
  octoprint_anywhere: {
    id: 'octoprint_anywhere',
    name: 'OctoPrint Anywhere',
    description: 'Remote access plugin for OctoPrint instances',
    authType: 'token',
    baseURL: 'https://app.obico.io/api/v1',
    features: ['remote_status', 'remote_print', 'ai_failure_detection', 'camera', 'notifications'],
  },
  google_drive: {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Sync G-code files and backups to Google Drive',
    authType: 'oauth2',
    baseURL: 'https://www.googleapis.com/drive/v3',
    features: ['file_backup', 'gcode_sync', 'auto_upload'],
  },
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Sync files and database backups to Dropbox',
    authType: 'oauth2',
    baseURL: 'https://api.dropboxapi.com/2',
    features: ['file_backup', 'gcode_sync', 'auto_upload'],
  },
  s3: {
    id: 's3',
    name: 'Amazon S3 / Compatible',
    description: 'Upload backups and files to S3-compatible storage',
    authType: 'access_key',
    features: ['file_backup', 'gcode_sync', 'auto_upload', 'static_hosting'],
  },
};


// ── Base Cloud Client ───────────────────────────────────────────────────────

class BaseCloudClient {
  constructor(provider, credentials) {
    this.provider = CLOUD_PROVIDERS[provider];
    this.credentials = credentials;
    this.connected = false;
    this.lastSync = null;

    if (this.provider.baseURL) {
      this.http = axios.create({
        baseURL: this.provider.baseURL,
        timeout: 30000,
        headers: this._buildAuthHeaders(),
      });
    }
  }

  _buildAuthHeaders() {
    switch (this.provider.authType) {
      case 'token':
        return { Authorization: `Bearer ${this.credentials.token}` };
      case 'bearer':
        return { Authorization: `Bearer ${this.credentials.token}` };
      case 'oauth2':
        return { Authorization: `Bearer ${this.credentials.accessToken}` };
      case 'access_key':
        return {}; // S3 uses signature-based auth
      default:
        return {};
    }
  }

  async testConnection() {
    throw new Error('Not implemented — override in subclass');
  }

  getStatus() {
    return {
      provider: this.provider.id,
      name: this.provider.name,
      connected: this.connected,
      lastSync: this.lastSync,
    };
  }
}


// ── Bambu Cloud Client ──────────────────────────────────────────────────────

export class BambuCloudClient extends BaseCloudClient {
  constructor(credentials) {
    super('bambu_cloud', credentials);
  }

  async testConnection() {
    try {
      await this.getProfile();
      this.connected = true;
      return { success: true };
    } catch (e) {
      this.connected = false;
      return { success: false, error: e.message };
    }
  }

  async getProfile() {
    return (await this.http.get('/user-service/my/profile')).data;
  }

  async getDevices() {
    return (await this.http.get('/iot-service/api/user/bind')).data;
  }

  async getDeviceStatus(deviceId) {
    return (await this.http.get(`/iot-service/api/user/device/${deviceId}`)).data;
  }

  async getTaskHistory(deviceId, limit = 20, offset = 0) {
    return (await this.http.get(`/user-service/my/tasks`, {
      params: { deviceId, limit, offset },
    })).data;
  }

  async getProjects(limit = 20, offset = 0) {
    return (await this.http.get('/user-service/my/project', {
      params: { limit, offset },
    })).data;
  }

  async getProjectFiles(projectId) {
    return (await this.http.get(`/user-service/my/project/${projectId}/files`)).data;
  }

  async sendPrintTask(deviceId, fileUrl, filename) {
    return (await this.http.post('/cloud-service/robo/task', {
      deviceId, url: fileUrl, filename,
    })).data;
  }

  async getFirmwareUpdates(deviceId) {
    return (await this.http.get(`/iot-service/api/user/device/${deviceId}/firmware`)).data;
  }
}


// ── Prusa Connect Cloud Client ──────────────────────────────────────────────

export class PrusaConnectClient extends BaseCloudClient {
  constructor(credentials) {
    super('prusa_connect', credentials);
  }

  async testConnection() {
    try {
      await this.getPrinters();
      this.connected = true;
      return { success: true };
    } catch (e) {
      this.connected = false;
      return { success: false, error: e.message };
    }
  }

  async getPrinters() {
    return (await this.http.get('/v1/printers')).data;
  }

  async getPrinterStatus(printerId) {
    return (await this.http.get(`/v1/printers/${printerId}`)).data;
  }

  async getPrinterJob(printerId) {
    return (await this.http.get(`/v1/printers/${printerId}/job`)).data;
  }

  async controlJob(printerId, command) {
    // command: 'PAUSE', 'RESUME', 'STOP'
    return (await this.http.put(`/v1/printers/${printerId}/job`, { command })).data;
  }

  async getFiles(printerId) {
    return (await this.http.get(`/v1/printers/${printerId}/files`)).data;
  }

  async uploadFile(printerId, file) {
    const form = new FormData();
    form.append('file', file);
    return (await this.http.post(`/v1/printers/${printerId}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })).data;
  }

  async getCameraSnapshot(printerId) {
    return (await this.http.get(`/v1/printers/${printerId}/camera/snap`, {
      responseType: 'blob',
    })).data;
  }

  async getEvents(printerId, limit = 50) {
    return (await this.http.get(`/v1/printers/${printerId}/events`, {
      params: { limit },
    })).data;
  }

  async getTransfers(printerId) {
    return (await this.http.get(`/v1/printers/${printerId}/transfers`)).data;
  }
}


// ── Creality Cloud Client ───────────────────────────────────────────────────

export class CrealityCloudClient extends BaseCloudClient {
  constructor(credentials) {
    super('creality_cloud', credentials);
  }

  async testConnection() {
    try {
      await this.getUserInfo();
      this.connected = true;
      return { success: true };
    } catch (e) {
      this.connected = false;
      return { success: false, error: e.message };
    }
  }

  async getUserInfo() {
    return (await this.http.get('/cxy/user/info')).data;
  }

  async getPrinters() {
    return (await this.http.get('/cxy/printer/list')).data;
  }

  async getPrinterStatus(printerId) {
    return (await this.http.get(`/cxy/printer/detail?id=${printerId}`)).data;
  }

  async getModelLibrary(page = 1, limit = 20, category = '') {
    return (await this.http.get('/cxy/gcodecloud/list', {
      params: { page, limit, category },
    })).data;
  }

  async downloadModel(modelId) {
    return (await this.http.get(`/cxy/gcodecloud/detail?id=${modelId}`)).data;
  }

  async sendRemotePrint(printerId, modelId) {
    return (await this.http.post('/cxy/printer/remoteprint', {
      printerId, modelId,
    })).data;
  }

  async getPrintHistory(printerId, page = 1, limit = 20) {
    return (await this.http.get('/cxy/printer/history', {
      params: { printerId, page, limit },
    })).data;
  }

  async getSlicingProfiles() {
    return (await this.http.get('/cxy/slicer/profiles')).data;
  }
}


// ── OctoPrint Anywhere / Obico Client ───────────────────────────────────────

export class ObicoCloudClient extends BaseCloudClient {
  constructor(credentials) {
    super('octoprint_anywhere', credentials);
  }

  async testConnection() {
    try {
      await this.getPrinters();
      this.connected = true;
      return { success: true };
    } catch (e) {
      this.connected = false;
      return { success: false, error: e.message };
    }
  }

  async getPrinters() {
    return (await this.http.get('/printers/')).data;
  }

  async getPrinterStatus(printerId) {
    return (await this.http.get(`/printers/${printerId}/`)).data;
  }

  async sendCommand(printerId, command) {
    return (await this.http.post(`/printers/${printerId}/command/`, { command })).data;
  }

  async pausePrint(printerId) {
    return this.sendCommand(printerId, 'pause');
  }

  async resumePrint(printerId) {
    return this.sendCommand(printerId, 'resume');
  }

  async cancelPrint(printerId) {
    return this.sendCommand(printerId, 'cancel');
  }

  async getPrintShots(printerId, limit = 20) {
    return (await this.http.get(`/printers/${printerId}/printshots/`, {
      params: { limit },
    })).data;
  }

  async getDetectionResults(printerId, limit = 20) {
    return (await this.http.get(`/printers/${printerId}/detection/`, {
      params: { limit },
    })).data;
  }

  async getGcodeFiles(printerId) {
    return (await this.http.get(`/printers/${printerId}/gcodes/`)).data;
  }
}


// ── Google Drive Client (for G-code sync + DB backups) ──────────────────────

export class GoogleDriveClient extends BaseCloudClient {
  constructor(credentials) {
    super('google_drive', credentials);
    this.folderId = credentials.folderId || null; // PrintFlow folder ID
  }

  async testConnection() {
    try {
      await this.http.get('/about', { params: { fields: 'user' } });
      this.connected = true;
      return { success: true };
    } catch (e) {
      this.connected = false;
      return { success: false, error: e.message };
    }
  }

  async ensurePrintFlowFolder() {
    if (this.folderId) return this.folderId;

    // Search for existing folder
    const res = await this.http.get('/files', {
      params: {
        q: "name='PrintFlow Lite' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)',
      },
    });

    if (res.data.files?.length > 0) {
      this.folderId = res.data.files[0].id;
      return this.folderId;
    }

    // Create folder
    const create = await this.http.post('/files', {
      name: 'PrintFlow Lite',
      mimeType: 'application/vnd.google-apps.folder',
    });
    this.folderId = create.data.id;
    return this.folderId;
  }

  async listFiles(folderId = null) {
    const folder = folderId || await this.ensurePrintFlowFolder();
    return (await this.http.get('/files', {
      params: {
        q: `'${folder}' in parents and trashed=false`,
        fields: 'files(id, name, size, modifiedTime, mimeType)',
        orderBy: 'modifiedTime desc',
      },
    })).data;
  }

  async uploadFile(filename, content, mimeType = 'application/octet-stream') {
    const folderId = await this.ensurePrintFlowFolder();

    // Multipart upload
    const metadata = { name: filename, parents: [folderId] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    return (await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      form,
      {
        headers: { Authorization: `Bearer ${this.credentials.accessToken}` },
        timeout: 120000,
      }
    )).data;
  }

  async downloadFile(fileId) {
    return (await this.http.get(`/files/${fileId}`, {
      params: { alt: 'media' },
      responseType: 'arraybuffer',
    })).data;
  }

  async deleteFile(fileId) {
    return (await this.http.delete(`/files/${fileId}`)).data;
  }

  async backupDatabase(dbBuffer) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return this.uploadFile(
      `printflow-backup-${timestamp}.sqlite`,
      dbBuffer,
      'application/x-sqlite3'
    );
  }
}


// ── Dropbox Client ──────────────────────────────────────────────────────────

export class DropboxClient extends BaseCloudClient {
  constructor(credentials) {
    super('dropbox', credentials);
    this.contentHttp = axios.create({
      baseURL: 'https://content.dropboxapi.com/2',
      timeout: 120000,
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });
  }

  async testConnection() {
    try {
      await this.http.post('/users/get_current_account');
      this.connected = true;
      return { success: true };
    } catch (e) {
      this.connected = false;
      return { success: false, error: e.message };
    }
  }

  async listFiles(path = '/PrintFlow Lite') {
    return (await this.http.post('/files/list_folder', {
      path, recursive: false, include_mounted_folders: true,
    })).data;
  }

  async uploadFile(path, content) {
    return (await this.contentHttp.post('/files/upload', content, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path, mode: 'overwrite', autorename: true, mute: false,
        }),
      },
    })).data;
  }

  async downloadFile(path) {
    return (await this.contentHttp.post('/files/download', null, {
      headers: { 'Dropbox-API-Arg': JSON.stringify({ path }) },
      responseType: 'arraybuffer',
    })).data;
  }

  async deleteFile(path) {
    return (await this.http.post('/files/delete_v2', { path })).data;
  }

  async createFolder(path = '/PrintFlow Lite') {
    return (await this.http.post('/files/create_folder_v2', { path, autorename: false })).data;
  }
}


// ── Cloud Service Factory ───────────────────────────────────────────────────

export function createCloudClient(provider, credentials) {
  switch (provider) {
    case 'bambu_cloud':        return new BambuCloudClient(credentials);
    case 'prusa_connect':      return new PrusaConnectClient(credentials);
    case 'creality_cloud':     return new CrealityCloudClient(credentials);
    case 'octoprint_anywhere': return new ObicoCloudClient(credentials);
    case 'google_drive':       return new GoogleDriveClient(credentials);
    case 'dropbox':            return new DropboxClient(credentials);
    default:
      throw new Error(`Unsupported cloud provider: ${provider}`);
  }
}


// ── Cloud Sync Manager ──────────────────────────────────────────────────────
// Manages sync state and scheduling across all connected cloud providers

export class CloudSyncManager {
  constructor() {
    this.clients = new Map();
    this.syncIntervals = new Map();
    this.listeners = new Set();
  }

  addClient(provider, credentials) {
    const client = createCloudClient(provider, credentials);
    this.clients.set(provider, client);
    return client;
  }

  removeClient(provider) {
    this.stopAutoSync(provider);
    this.clients.delete(provider);
  }

  getClient(provider) {
    return this.clients.get(provider);
  }

  getAllStatuses() {
    const statuses = {};
    this.clients.forEach((client, provider) => {
      statuses[provider] = client.getStatus();
    });
    return statuses;
  }

  async testAll() {
    const results = {};
    for (const [provider, client] of this.clients) {
      results[provider] = await client.testConnection();
    }
    return results;
  }

  // Auto-sync scheduler
  startAutoSync(provider, intervalMs = 300000, syncFn) {
    this.stopAutoSync(provider);
    const id = setInterval(async () => {
      try {
        await syncFn(this.clients.get(provider));
        this._notify({ type: 'sync_complete', provider, timestamp: new Date() });
      } catch (e) {
        this._notify({ type: 'sync_error', provider, error: e.message });
      }
    }, intervalMs);
    this.syncIntervals.set(provider, id);
  }

  stopAutoSync(provider) {
    const id = this.syncIntervals.get(provider);
    if (id) {
      clearInterval(id);
      this.syncIntervals.delete(provider);
    }
  }

  // Event listeners
  onSyncEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify(event) {
    this.listeners.forEach(fn => fn(event));
  }

  destroy() {
    this.syncIntervals.forEach(id => clearInterval(id));
    this.syncIntervals.clear();
    this.clients.clear();
    this.listeners.clear();
  }
}

export default {
  CLOUD_PROVIDERS,
  createCloudClient,
  CloudSyncManager,
};
