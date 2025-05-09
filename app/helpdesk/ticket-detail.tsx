import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../utils/apiService';
import fileService from '../utils/fileService';
import * as WebBrowser from 'expo-web-browser';

// Base URL for API endpoints
const BASE_URL = 'http://192.168.0.88:5276/api';

// Define the ticket interface
interface TicketDetail {
  talepId: number;
  talepNo: string;
  siraNo: number;
  talepTip: string;
  baslik: string;
  aciklama: string;
  durumId: number;
  durumAdi: string;
  oncelikTipi: string;
  createDate: string;
  kategoriId: number;
  kategoriAdi: string;
  cozum: string | null;
  cozumTarihi: string | null;
  kapatmaTarihi: string | null;
  dosyalar?: Array<{
    id: number;
    dosyaAdi: string;
    dosyaYolu: string;
    dosyaUzantisi?: string;
    icerikTipi?: string;
    boyut?: number;
    olusturanKullanici?: string;
    olusturmaTarihi?: string;
  }>;
}

// File interface
interface TicketFile {
  id: number;
  dosyaAdi: string;
  dosyaUzantisi: string;
  icerikTipi: string;
  boyut?: number;
  olusturanKullanici?: string;
  olusturmaTarihi?: string;
}

interface ApiResponse {
  content: null;
  data: TicketDetail;
  error: null;
  isSuccessful: boolean;
  message: string;
  statusCode: number;
}

// Helper to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Tarih bilgisi yok";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Geçersiz tarih";
  }
  
  return date.toLocaleDateString('tr-TR', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper to get Ionicons name based on file type
const getFileIconName = (file: TicketFile): keyof typeof Ionicons.glyphMap => {
  const extension = file.dosyaUzantisi?.toLowerCase() || '';
  const mimeType = file.icerikTipi?.toLowerCase() || '';

  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (extension === '.pdf' || mimeType === 'application/pdf') {
    return 'document-text'; // Using document-text for PDF
  } else if (['.doc', '.docx'].includes(extension) || mimeType.includes('word')) {
    return 'document-attach'; // Generic document icon
  } else if (['.xls', '.xlsx'].includes(extension) || mimeType.includes('excel') || mimeType.includes('spreadsheetml')) {
    return 'stats-chart'; // Using stats-chart for Excel
  } else if (['.ppt', '.pptx'].includes(extension) || mimeType.includes('powerpoint')) {
    return 'easel'; // Using easel for PowerPoint
  } else if (['.zip', '.rar', '.7z'].includes(extension) || mimeType.includes('archive') || mimeType.includes('zip')) {
    return 'archive';
  } else {
    return 'document'; // Default document icon
  }
};

// Improved hook with TypeScript types
function useDosyalar(tabloAdi: string, kayitNo: number, modulId: number) {
  const [dosyalar, setDosyalar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const getDosyalar = async () => {
    if (!tabloAdi || !kayitNo || !modulId) {
      console.warn('Dosya listesi için gerekli parametreler eksik:', { tabloAdi, kayitNo, modulId });
      return;
    }
    
    setYukleniyor(true);
    try {
      const response = await fileService.getDosyalar(tabloAdi, kayitNo, modulId);
      console.log('Dosyalar alındı:', JSON.stringify(response)); // Log the entire response
      
      if (response.isSuccessful) {
        const files = response.content || [];
        console.log('Dosyalar:', files); // Log the files array
        setDosyalar(files);
      } else {
        console.error("Dosyalar getirilirken bir hata oluştu:", response.message);
        setHata(response.message);
      }
    } catch (error: any) {
      console.error("Dosyalar yüklenirken hata oluştu:", error);
      setHata(error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return { dosyalar, yukleniyor, hata, getDosyalar };
}

export default function TicketDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const ticketId = params.id ? Number(params.id) : 0;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<{message: string, isError: boolean} | null>(null);
  
  // Add state for the rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Use the custom hook for files
  const { 
    dosyalar: ticketFiles, 
    yukleniyor: filesLoading, 
    hata: fileError, 
    getDosyalar: fetchTicketFiles 
  } = useDosyalar("HD_Talep", ticketId, 40);
  
  // Track if a download is in progress to prevent overlapping requests
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Fetch ticket details
  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
      fetchTicketFiles(); // Call the getDosyalar function from the hook
    }
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    if (!ticketId) {
      setError('Geçersiz talep ID');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Fetching ticket details for ID: ${ticketId}`);
      
      // First get the ticket details
      const ticketData = await apiService.get<TicketDetail>(`/HelpDesk/GetTalepById/${ticketId}`);
      console.log('Ticket detail received:', JSON.stringify(ticketData).substring(0, 200));
      
      if (ticketData) {
        setTicket(ticketData);
        setError(null); // Clear previous main errors if details fetch succeeds
      } else {
        setError('Talep detayları bulunamadı');
        setTicket(null); // Ensure ticket is null on error
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setError('Bağlantı hatası'); // Keep this as the main error
      setTicket(null); // Ensure ticket is null on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (!status) return {};
    if (status.includes('Açık')) return styles.statusOpen;
    if (status.includes('İşlem')) return styles.statusInProgress;
    return styles.statusClosed;
  };

  // Handle file opening based on file type
  const openFile = async (file: any) => {
    console.log(`File selected: ${file.dosyaAdi} (ID: ${file.id})`, file);
    // File preview functionality removed as requested
    alert("Dosya önizleme özelliği kaldırılmıştır.");
  };

  // Function to download a file (different from view/open)
  const downloadFile = async (file: any) => {
    // Prevent multiple simultaneous downloads
    if (isDownloading) {
      console.log("Download already in progress, please wait...");
      alert("İndirme işlemi devam ediyor, lütfen bekleyin...");
      return;
    }
    
    try {
      setIsDownloading(true);
      console.log('Downloading file:', file.dosyaAdi);
      await fileService.downloadFile(file);
    } catch (error: any) {
      console.error("Dosya indirilirken hata oluştu:", error);
      alert("Dosya indirilirken bir hata oluştu: " + error.message);
    } finally {
      // Add a slight delay before allowing another download
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    }
  };

  const retryFetchAll = () => {
    setError(null);
    if (ticketId) {
      fetchTicketDetails();
      fetchTicketFiles();
    }
  };

  const updateTicketStatus = async (statusId: number, reason?: string) => {
    try {
      setStatusUpdateLoading(true);
      setStatusUpdateMessage(null);
      
      console.log(`Updating ticket status to ${statusId} for ticket ${ticketId}`);
      
      interface StatusResponse {
        isSuccessful: boolean;
        message?: string;
      }
      
      // POST isteği yaparak veri gövdesi (body) ile durumID ve talepID gönderiyoruz
      const requestData = {
        id: ticketId,     // Seçilen talebin ID'si
        durumId: statusId, // Yeni durum ID'si (5: Onayla, 3: Reddet)
        cozum: reason     // Reddetme nedeni veya çözüm açıklaması
      };
      
      console.log('Sending request data:', requestData);
      
      const response = await apiService.post<StatusResponse>('/HelpDesk/TalepDurumGuncelle', requestData);
      console.log('Status update response:', response);
      
      if (response.isSuccessful) {
        // Refresh ticket details
        await fetchTicketDetails();
        setStatusUpdateMessage({
          message: statusId === 5 ? 'Çözüm onaylandı!' : 'Çözüm reddedildi!',
          isError: false
        });
      } else {
        setStatusUpdateMessage({
          message: `Durum güncellenirken hata oluştu: ${response.message || 'Bilinmeyen hata'}`,
          isError: true
        });
      }
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      setStatusUpdateMessage({
        message: `Bağlantı hatası: ${error.message}`,
        isError: true
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleApprove = () => {
    updateTicketStatus(5); // Status ID 5 for Approval
  };

  const handleReject = () => {
    // Show the rejection reason modal instead of immediately rejecting
    setRejectModalVisible(true);
  };
  
  const submitRejection = () => {
    // Close the modal
    setRejectModalVisible(false);
    
    // Submit with rejection reason
    updateTicketStatus(3, rejectionReason); // Status ID 3 for Rejection
    
    // Clear the rejection reason for next time
    setRejectionReason('');
  };
  
  const cancelRejection = () => {
    // Just close the modal without submitting
    setRejectModalVisible(false);
    setRejectionReason('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Talep Detayı</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Talep detayları yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryFetchAll}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : ticket ? (
          <View style={styles.ticketContainer}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>{ticket.baslik || `Talep #${ticketId}`}</Text>
              <View style={[styles.statusBadge, getStatusStyle(ticket.durumAdi)]}>
                <Text style={styles.statusText}>{ticket.durumAdi || 'Durum Bilgisi Yok'}</Text>
              </View>
            </View>
            
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Detaylar</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Durum:</Text>
                <Text style={styles.detailValue}>{ticket.durumAdi || 'Belirtilmemiş'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Öncelik:</Text>
                <Text style={styles.detailValue}>{ticket.oncelikTipi || 'Belirtilmemiş'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Talep Türü:</Text>
                <Text style={styles.detailValue}>{ticket.talepTip || 'Belirtilmemiş'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kategori:</Text>
                <Text style={styles.detailValue}>{ticket.kategoriAdi || 'Belirtilmemiş'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tarih:</Text>
                <Text style={styles.detailValue}>{formatDate(ticket.createDate)}</Text>
              </View>
            </View>
            
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <Text style={styles.descriptionText}>
                {ticket.aciklama || 'Açıklama bulunmamaktadır.'}
              </Text>
            </View>
            
            <View style={styles.filesSection}>
              <Text style={styles.sectionTitle}>Dosyalar</Text>
              {filesLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : fileError ? (
                <View style={styles.fileErrorContainer}>
                   <Ionicons name="warning-outline" size={24} color="#FFA000" style={{ marginRight: 8 }}/>
                   <Text style={styles.fileErrorText}>{fileError}</Text>
                   <TouchableOpacity onPress={fetchTicketFiles} style={styles.fileRetryButton}>
                     <Ionicons name="refresh-outline" size={18} color="#007AFF" />
                   </TouchableOpacity>
                </View>
              ) : ticketFiles.length > 0 ? (
                ticketFiles.map((file) => {
                  return (
                    <View key={file.id} style={styles.fileItem}>
                      <View style={styles.fileInfoContainer}>
                        <Ionicons
                          name={getFileIconName(file)}
                          size={24}
                          color="#007AFF"
                          style={styles.fileIcon}
                        />
                        <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                          {file.dosyaAdi || `Dosya ${file.id}`}
                        </Text>
                      </View>
                      
                      <View style={styles.fileActions}>
                        <TouchableOpacity 
                          onPress={() => downloadFile(file)} 
                          style={styles.fileActionButton}
                          disabled={isDownloading}
                        >
                          <Ionicons 
                            name="download-outline" 
                            size={22} 
                            color={isDownloading ? "#cccccc" : "#007AFF"} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noFilesText}>Bu talebe ait dosya bulunmamaktadır.</Text>
              )}
            </View>

            {ticket.cozum && (
              <View style={styles.cozumSection}>
                <Text style={styles.sectionTitle}>Çözüm</Text>
                <Text style={styles.cozumText}>{ticket.cozum}</Text>
                
                {/* Çözüm "İşlem yapılıyor" ya da "Çözüldü" durumunda olduğunda onayla/reddet düğmelerini göster */}
                {(ticket.durumAdi === 'İşlem Yapılıyor' || ticket.durumAdi === 'Çözüldü') && (
                  <View style={styles.cozumActions}>
                    {statusUpdateMessage && (
                      <View style={[
                        styles.statusUpdateMessage,
                        statusUpdateMessage.isError ? styles.statusUpdateError : styles.statusUpdateSuccess
                      ]}>
                        <Ionicons 
                          name={statusUpdateMessage.isError ? "alert-circle" : "checkmark-circle"} 
                          size={18} 
                          color={statusUpdateMessage.isError ? "#E53935" : "#43A047"} 
                          style={{marginRight: 8}} 
                        />
                        <Text style={styles.statusUpdateText}>{statusUpdateMessage.message}</Text>
                      </View>
                    )}
                    
                    <View style={styles.cozumButtons}>
                      <TouchableOpacity 
                        style={[styles.cozumButton, styles.approveButton]} 
                        onPress={handleApprove}
                        disabled={statusUpdateLoading}
                      >
                        {statusUpdateLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={18} color="#fff" style={{marginRight: 8}} />
                            <Text style={styles.cozumButtonText}>Çözümü Onayla</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.cozumButton, styles.rejectButton]} 
                        onPress={handleReject}
                        disabled={statusUpdateLoading}
                      >
                        {statusUpdateLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="close" size={18} color="#fff" style={{marginRight: 8}} />
                            <Text style={styles.cozumButtonText}>Reddet</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Talep bilgisi bulunamadı.</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Rejection Reason Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={rejectModalVisible}
        onRequestClose={cancelRejection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reddetme Nedeni</Text>
            <Text style={styles.modalSubtitle}>Lütfen çözümü reddetme nedeninizi belirtin:</Text>
            
            <TextInput
              style={styles.reasonInput}
              multiline={true}
              numberOfLines={4}
              placeholder="Reddetme nedeni..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelRejection}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={submitRejection}
                disabled={!rejectionReason.trim()}
              >
                <Text style={styles.submitButtonText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loaderText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  ticketContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#E3F2FD',
  },
  statusInProgress: {
    backgroundColor: '#FFF9C4',
  },
  statusClosed: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0277BD',
  },
  detailsSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  descriptionSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  filesSection: {
    marginTop: 20,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 15,
  },
  noFilesText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginBottom: 16,
    color: '#E53935',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF', // White background for items
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    elevation: 1, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileName: {
    flex: 1, 
    fontSize: 15,
    color: '#495057',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  cozumSection: {
    marginTop: 20,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 15,
  },
  cozumText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Added styles for file-specific errors
  fileErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0', // Light orange background
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  fileErrorText: {
    flex: 1, // Take available space
    fontSize: 13,
    color: '#E65100', // Darker orange text
    marginRight: 8,
  },
  fileRetryButton: {
    padding: 4,
  },
  cozumActions: {
    marginTop: 16,
  },
  statusUpdateMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  statusUpdateError: {
    backgroundColor: '#FFEBEE',
  },
  statusUpdateSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusUpdateText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  cozumButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cozumButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#43A047',
  },
  rejectButton: {
    backgroundColor: '#E53935',
  },
  cozumButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
    textAlignVertical: 'top', // For Android
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#E53935',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 