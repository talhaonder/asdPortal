export interface ProductItem {
  id: number;
  sipariskodu: string;
  musteriAd: string;
  stokTanimi: string;
  hata: string;
  hataYeri: string;
  tarih: string;
  kayitTarihi?: string;
  karar?: number;
  aciklama?: string;
  description?: string;
  status?: string;
  photos?: Photo[];
  fotoYolu?: string;
  plaka?: string;
  barkod?: string;
  miktar?: number;
  en?: number;
  kaydeden?: string;
  sonuc?: string | null;
  sonucTarihi?: string | null;
  kararSonuc?: string;
  abFotolars?: Photo[];
}

export interface Photo {
  id: number;
  fotoYolu: string;
}

export interface ApiResponse {
  message: string;
  statusCode: number;
  data: ProductItem[];
}

export interface TabItem {
  icon: string;
  label: string;
}

export interface ProductCardProps {
  item: ProductItem;
  onPress: (item: ProductItem) => void;
  getHataYeriDisplay: (hataYeri: string) => string;
}

export interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSwipeDismiss?: () => void;
  item: ProductItem | null;
  onKararUpdate: () => void;
  loading?: boolean;
} 