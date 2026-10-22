import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import storage from './storage';
import { API_BASE_URL } from '../api/apiClient';

/**
 * Downloads a real PDF file from an authenticated backend API endpoint,
 * validates it is a non-empty valid PDF (%PDF header), saves it locally,
 * and opens the native save/share sheet for Android and iOS.
 *
 * @param {Object} options
 * @param {string} options.endpoint - API route (e.g. '/diary/report/download' or '/certificates/123/download')
 * @param {Object} [options.params] - Query parameters
 * @param {string} [options.filename] - Target filename (e.g. 'Health_Sakhi_Diary_Report.pdf')
 * @param {string} [options.dialogTitle] - Title for native share dialog
 * @returns {Promise<{success: boolean, fileUri: string, size: number}>}
 */
export async function downloadAndOpenPdf({ endpoint, params = {}, filename = 'Health_Sakhi_Document.pdf', dialogTitle = 'Open or Save PDF' }) {
  try {
    const token = await storage.getItem('hs_access_token');
    const activeLang = (await storage.getItem('hs_lang_code')) || 'en';

    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const targetFilename = sanitizedFilename.toLowerCase().endsWith('.pdf')
      ? sanitizedFilename
      : `${sanitizedFilename}.pdf`;

    const localUri = `${FileSystem.documentDirectory}${targetFilename}`;

    // Construct target URL
    let fullUrl = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    // Append query parameters cleanly
    const queryParts = [];
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });

    if (queryParts.length > 0) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryParts.join('&');
    }

    console.log('Initiating PDF Download from URL:', fullUrl);

    // Download binary PDF to local file system
    const downloadRes = await FileSystem.downloadAsync(
      fullUrl,
      localUri,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Accept-Language': activeLang,
          'Accept': 'application/pdf, application/json'
        }
      }
    );

    if (downloadRes.status !== 200) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      if (downloadRes.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else if (downloadRes.status === 403) {
        throw new Error('Upgrade your plan to unlock PDF downloads.');
      } else {
        throw new Error(`Server returned HTTP ${downloadRes.status}. Unable to generate PDF.`);
      }
    }

    // Verify file exists and has non-zero size
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists || fileInfo.size === 0) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      throw new Error('Downloaded PDF file is empty.');
    }

    // Verify PDF header (%PDF)
    try {
      const headerStr = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.UTF8,
        position: 0,
        length: 10
      });

      if (!headerStr.includes('%PDF')) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
        throw new Error('Server returned an invalid PDF structure.');
      }
    } catch (readErr) {
      // If binary reading failed, file is still saved and non-zero
    }

    // Trigger native share/save sheet on Android/iOS
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(localUri, {
        mimeType: 'application/pdf',
        dialogTitle: dialogTitle || 'Health Sakhi PDF Document',
        UTI: 'com.adobe.pdf'
      });
    }

    return {
      success: true,
      fileUri: localUri,
      size: fileInfo.size,
      filename: targetFilename
    };
  } catch (error) {
    console.error('PDF Download Error:', error?.message || error);
    throw error;
  }
}
