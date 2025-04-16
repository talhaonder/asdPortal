import apiService from './apiService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The base URL for API calls
const BASE_URL = 'http://192.168.0.88:5276/api';

class FileService {
  async getDosyalar(tabloAdi: string, kayitNo: number, modulId: number) {
    try {
      return await apiService.get<any>(
        `/DosyaYonetimi/GetDosyalar?tabloAdi=${tabloAdi}&kayitNo=${kayitNo}&modulId=${modulId}`
      );
    } catch (error) {
      console.error('Dosya listesi alınırken hata:', error);
      throw error;
    }
  }

  // Get files for a specific helpdesk ticket
  async getTicketFiles(talepId: number) {
    try {
      return await apiService.get<any>(`/HelpDesk/GetDosyalarByTalepId/${talepId}`);
    } catch (error) {
      console.error('Talep dosyaları alınırken hata:', error);
      throw error;
    }
  }

  // Download file and return the local URI
  async dosyaIndir(dosyaId: number): Promise<string> {
    try {
      // Get token for authorization
      const token = await AsyncStorage.getItem('userToken');
      
      // Create download URL
      const downloadUrl = `${BASE_URL}/DosyaYonetimi/indir/${dosyaId}`;
      
      // Generate a temporary file path in device cache
      const fileUri = FileSystem.cacheDirectory + `temp_file_${dosyaId}`;
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (downloadResult.status === 200) {
        return downloadResult.uri;
      } else {
        throw new Error(`Dosya indirme hatası: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      throw error;
    }
  }

  // Open file for preview
  async openFile(dosya: any): Promise<void> {
    try {
      // Download the file first
      const localUri = await this.dosyaIndir(dosya.id);
      
      // Check if device supports sharing
      const isAvailable = await Sharing.isAvailableAsync();
      
      // For images and PDFs, open directly in browser
      if (dosya.icerikTipi?.startsWith('image/') || 
          dosya.icerikTipi === 'application/pdf' ||
          dosya.dosyaUzantisi?.toLowerCase() === '.pdf') {
        await WebBrowser.openBrowserAsync(localUri);
      } 
      // For other files, share them
      else if (isAvailable) {
        await Sharing.shareAsync(localUri, {
          UTI: this.getUTIForFile(dosya),
          mimeType: dosya.icerikTipi || 'application/octet-stream'
        });
      } else {
        throw new Error('Dosya paylaşımı bu cihazda desteklenmiyor');
      }
    } catch (error) {
      console.error('Dosya açılırken hata:', error);
      throw error;
    }
  }

  // Download and save file
  async downloadFile(dosya: any): Promise<void> {
    try {
      // Download the file first
      const localUri = await this.dosyaIndir(dosya.id);
      
      // Check if device supports sharing
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(localUri, {
          dialogTitle: `${dosya.dosyaAdi}${dosya.dosyaUzantisi} İndir`,
          mimeType: dosya.icerikTipi || 'application/octet-stream',
          UTI: this.getUTIForFile(dosya)
        });
      } else {
        throw new Error('Dosya paylaşımı bu cihazda desteklenmiyor');
      }
    } catch (error) {
      console.error('Dosya indirilirken hata:', error);
      throw error;
    }
  }

  // Get file icon based on file type
  getFileIcon(dosya: any): string {
    const extension = dosya.dosyaUzantisi?.toLowerCase();
    
    if (dosya.icerikTipi?.startsWith('image/')) {
      return 'image';
    } else if (extension === '.pdf' || dosya.icerikTipi === 'application/pdf') {
      return 'document-text';
    } else if (['.doc', '.docx'].includes(extension)) {
      return 'document';
    } else if (['.xls', '.xlsx'].includes(extension)) {
      return 'grid';
    } else if (['.ppt', '.pptx'].includes(extension)) {
      return 'easel';
    } else if (['.zip', '.rar', '.7z'].includes(extension)) {
      return 'archive';
    } else {
      return 'document-outline';
    }
  }

  // Helper to get UTI for iOS file sharing
  private getUTIForFile(dosya: any): string {
    const extension = dosya.dosyaUzantisi?.toLowerCase();
    
    if (dosya.icerikTipi?.startsWith('image/jpeg') || extension === '.jpg' || extension === '.jpeg') {
      return 'public.jpeg';
    } else if (dosya.icerikTipi?.startsWith('image/png') || extension === '.png') {
      return 'public.png';
    } else if (extension === '.pdf' || dosya.icerikTipi === 'application/pdf') {
      return 'com.adobe.pdf';
    } else if (['.doc', '.docx'].includes(extension)) {
      return 'com.microsoft.word.doc';
    } else if (['.xls', '.xlsx'].includes(extension)) {
      return 'com.microsoft.excel.xls';
    } else if (['.ppt', '.pptx'].includes(extension)) {
      return 'com.microsoft.powerpoint.ppt';
    } else {
      return 'public.data';
    }
  }
}

export default new FileService(); 