import React, { useState } from 'react';
import { Animal, Species, Language, AuditLog, OwnershipRecord } from '../types';
import { initialMarketplaceListings } from '../lib/mockData';
import { t } from '../lib/translations';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Award, 
  TrendingUp, 
  Heart, 
  Milk, 
  Activity, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  Sparkles, 
  X, 
  Camera, 
  Download, 
  Check, 
  History,
  QrCode,
  ShoppingBag,
  Tag,
  DollarSign,
  Phone,
  MapPin,
  Calculator,
  Upload,
  ArrowRightLeft,
  CheckCircle2,
  Sparkle,
  Store
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { notifyAdminSync } from '../services/adminFarmerSync';

interface AnimalManagementProps {
  animals: Animal[];
  onSaveAnimal: (animal: Animal) => void;
  onDeleteAnimal: (id: string) => void;
  language: Language;
  onNavigateToDairyStore?: () => void;
}

export const AnimalManagement: React.FC<AnimalManagementProps> = ({
  animals,
  onSaveAnimal,
  onDeleteAnimal,
  language,
  onNavigateToDairyStore,
}) => {
  const handleSaveWrapper = (animal: Animal) => {
    onSaveAnimal(animal);
    notifyAdminSync('CATTLE_SAVED', animal);
  };

  const handleDeleteWrapper = (id: string) => {
    onDeleteAnimal(id);
    notifyAdminSync('CATTLE_DELETED', { id });
  };

  // Main View Mode: 'herd' or 'marketplace'
  const [viewMode, setViewMode] = useState<'herd' | 'marketplace'>('herd');

  // Filtering
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isListForSaleModalOpen, setIsListForSaleModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedMarketItem, setSelectedMarketItem] = useState<Animal | null>(null);

  // Edit Sale Point Listing Modal
  const [isEditListingModalOpen, setIsEditListingModalOpen] = useState(false);
  const [editingListingItem, setEditingListingItem] = useState<Animal | null>(null);
  const [editListingPrice, setEditListingPrice] = useState<number>(250000);
  const [editListingPhone, setEditListingPhone] = useState<string>('0300-1234567');
  const [editListingCity, setEditListingCity] = useState<string>('Sahiwal');
  const [editListingDesc, setEditListingDesc] = useState<string>('');

  // Marketplace Listings State
  const [marketplaceListings, setMarketplaceListings] = useState<Animal[]>(initialMarketplaceListings);

  // Photo Presets
  const photoPresets = [
    { label: 'گائے (Sahiwal Cow)', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800' },
    { label: 'بھینس (Nili Buffalo)', url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=800' },
    { label: 'بکری (Kamori Goat)', url: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=800' },
    { label: 'سانڈ (Stud Bull)', url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=800' },
    { label: 'صحرائی اونٹ (Camel)', url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=800' },
  ];

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<Animal>>({
    name: '',
    species: 'cow',
    breed: 'Sahiwal Pure Breed',
    gender: 'female',
    ageMonths: 24,
    weightKg: 350,
    dob: '2024-01-01',
    purchasePrice: 200000,
    currentMarketValue: 240000,
    importStatus: false,
    pregnancyStatus: 'none',
    milkYieldLitersPerDay: 12,
    healthScore: 90,
    healthStatus: 'excellent',
    photos: ['https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'],
  });

  // Listing Form State
  const [listingAskingPrice, setListingAskingPrice] = useState<number>(250000);
  const [listingSellerPhone, setListingSellerPhone] = useState<string>('0300-1234567');
  const [listingSellerCity, setListingSellerCity] = useState<string>('Sahiwal');
  const [listingDescription, setListingDescription] = useState<string>('صحت مند مویشی، مکمل ویکسینیشن ریکارڈ۔');

  // Transfer State
  const [transferBuyerName, setTransferBuyerName] = useState('');
  const [transferBuyerPhone, setTransferBuyerPhone] = useState('');
  const [transferPrice, setTransferPrice] = useState(250000);

  // Auto Market Value Valuation Calculation
  const calculateAutoMarketValue = (sp: Species | string, weight: number, milk: number, health: number) => {
    let pricePerKg = 680;
    let milkValuePerLiter = 14000;
    if (sp === 'buffalo') {
      pricePerKg = 750;
      milkValuePerLiter = 16000;
    } else if (sp === 'goat') {
      pricePerKg = 1250;
      milkValuePerLiter = 10000;
    } else if (sp === 'sheep') {
      pricePerKg = 1150;
      milkValuePerLiter = 0;
    } else if (sp === 'camel') {
      pricePerKg = 850;
      milkValuePerLiter = 8000;
    }

    const weightValue = (weight || 300) * pricePerKg;
    const milkValue = (milk || 0) * milkValuePerLiter;
    const healthBonus = Math.round(((health || 90) / 100) * 25000);
    return Math.round(weightValue + milkValue + healthBonus);
  };

  // Handle Photo Upload for Selected Animal Detail View
  const handlePhotoUploadForSelectedAnimal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAnimal) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhotoUrl = event.target?.result as string;
      if (newPhotoUrl) {
        const updated: Animal = {
          ...selectedAnimal,
          photos: [newPhotoUrl, ...(selectedAnimal.photos.slice(1))],
          auditLogs: [
            {
              id: 'aud_' + Date.now(),
              timestamp: new Date().toLocaleString(),
              fieldChanged: 'پروفائل تصویر (Profile Photo)',
              oldValue: 'سابقہ تصویر',
              newValue: 'نئی تصویر اپلوڈ کی گئی',
              updatedBy: 'Chaudhry Ahmed Ali',
            },
            ...(selectedAnimal.auditLogs || []),
          ],
        };
        onSaveAnimal(updated);
        setSelectedAnimal(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Photo Upload inside Add/Edit Form
  const handleFormPhotoUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const readFilesPromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readFilesPromises).then((newPhotos) => {
      setFormData((prev) => ({
        ...prev,
        photos: [...newPhotos.filter(Boolean), ...(prev.photos || [])],
      }));
    });
  };

  // Filtered Animals for My Herd
  const filteredHerdAnimals = animals.filter((a) => {
    const matchesSpecies = selectedSpecies === 'all' || a.species === selectedSpecies;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.breed.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecies && matchesSearch;
  });

  // Filtered Marketplace Listings
  const filteredMarketListings = marketplaceListings.filter((m) => {
    const matchesSpecies = selectedSpecies === 'all' || m.species === selectedSpecies;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sellerCity && m.sellerCity.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSpecies && matchesSearch;
  });

  const handleOpenAdd = () => {
    const autoVal = calculateAutoMarketValue('cow', 380, 14, 92);
    setFormData({
      id: 'anm_' + Math.random().toString(36).substring(2, 9),
      tagId: 'KD-' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      species: 'cow',
      breed: 'Sahiwal Pure Breed',
      gender: 'female',
      ageMonths: 24,
      weightKg: 380,
      dob: new Date().toISOString().split('T')[0],
      purchasePrice: 220000,
      currentMarketValue: autoVal,
      importStatus: false,
      pregnancyStatus: 'none',
      milkYieldLitersPerDay: 14,
      healthScore: 92,
      healthStatus: 'excellent',
      photos: ['https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'],
      vaccinationHistory: [],
      medicalHistory: [],
      scanJournal: [],
      auditLogs: [],
      ownershipHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (animal: Animal) => {
    setFormData({ ...animal });
    setIsEditModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const existing = animals.find((a) => a.id === formData.id);
    const auditLogs: AuditLog[] = existing?.auditLogs ? [...existing.auditLogs] : [];

    if (existing && existing.weightKg !== formData.weightKg) {
      auditLogs.push({
        id: 'aud_' + Date.now(),
        timestamp: new Date().toLocaleString(),
        fieldChanged: 'وزن (Weight)',
        oldValue: `${existing.weightKg} kg`,
        newValue: `${formData.weightKg} kg`,
        updatedBy: 'Chaudhry Ahmed Ali',
      });
    }

    const animalToSave: Animal = {
      id: formData.id || 'anm_' + Date.now(),
      ownerId: 'usr_001',
      tagId: formData.tagId || 'KD-' + Math.floor(1000 + Math.random() * 9000),
      name: formData.name || 'مواشی',
      species: (formData.species as Species) || 'cow',
      breed: formData.breed || 'سواہل نسل',
      gender: formData.gender || 'female',
      ageMonths: Number(formData.ageMonths) || 24,
      weightKg: Number(formData.weightKg) || 350,
      dob: formData.dob || '2024-01-01',
      purchasePrice: Number(formData.purchasePrice) || 200000,
      currentMarketValue: Number(formData.currentMarketValue) || 240000,
      marketValueChangePercent:
        Number(formData.purchasePrice) > 0
          ? Number((((Number(formData.currentMarketValue) - Number(formData.purchasePrice)) / Number(formData.purchasePrice)) * 100).toFixed(1))
          : 0,
      importStatus: !!formData.importStatus,
      countryOfOrigin: formData.countryOfOrigin,
      importLicenseNumber: formData.importLicenseNumber,
      bloodline: formData.bloodline || 'اصیل نسل',
      sireInfo: formData.sireInfo,
      damInfo: formData.damInfo,
      pregnancyStatus: formData.pregnancyStatus || 'none',
      milkYieldLitersPerDay: Number(formData.milkYieldLitersPerDay) || 0,
      healthScore: Number(formData.healthScore) || 90,
      healthStatus: formData.healthStatus || 'excellent',
      photos: formData.photos && formData.photos.length > 0 ? formData.photos : ['https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'],
      videos: formData.videos || [],
      vaccinationHistory: formData.vaccinationHistory || [],
      medicalHistory: formData.medicalHistory || [],
      scanJournal: formData.scanJournal || [],
      auditLogs,
      ownershipHistory: formData.ownershipHistory || [],
      digitalLicenseNumber: formData.digitalLicenseNumber || `PK-PEDIGREE-${formData.tagId}`,
      isListedForSale: formData.isListedForSale || false,
      askingPrice: formData.askingPrice || formData.currentMarketValue,
      sellerName: formData.sellerName || 'Chaudhry Ahmed Ali',
      sellerPhone: formData.sellerPhone || '0300-1234567',
      sellerCity: formData.sellerCity || 'Sahiwal',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveAnimal(animalToSave);
    setIsEditModalOpen(false);
    if (selectedAnimal && selectedAnimal.id === animalToSave.id) {
      setSelectedAnimal(animalToSave);
    }
  };

  // List Animal for Sale Action
  const handleOpenListForSale = (animal: Animal) => {
    setSelectedAnimal(animal);
    setListingAskingPrice(animal.currentMarketValue || animal.purchasePrice);
    setIsListForSaleModalOpen(true);
  };

  const handleConfirmListForSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;

    const updated: Animal = {
      ...selectedAnimal,
      isListedForSale: true,
      askingPrice: Number(listingAskingPrice),
      sellerName: 'Chaudhry Ahmed Ali',
      sellerPhone: listingSellerPhone,
      sellerCity: listingSellerCity,
      saleDescription: listingDescription,
      auditLogs: [
        {
          id: 'aud_' + Date.now(),
          timestamp: new Date().toLocaleString(),
          fieldChanged: 'منڈی میں لسٹنگ (Listed for Sale)',
          oldValue: 'غیر لسٹڈ',
          newValue: `برائے فروخت قیمت PKR ${Number(listingAskingPrice).toLocaleString()}`,
          updatedBy: 'Chaudhry Ahmed Ali',
        },
        ...selectedAnimal.auditLogs,
      ],
    };

    onSaveAnimal(updated);
    setSelectedAnimal(updated);

    // Also add to marketplace listing pool
    setMarketplaceListings((prev) => [updated, ...prev.filter((m) => m.id !== updated.id)]);
    setIsListForSaleModalOpen(false);
    alert(`کامیابی! جانور ${updated.name} (PKR ${Number(listingAskingPrice).toLocaleString()}) مویشی منڈی میں برائے فروخت لسٹ کر دیا گیا ہے۔`);
  };

  // Open Edit Marketplace Item Modal
  const handleOpenEditListing = (item: Animal) => {
    setEditingListingItem(item);
    setEditListingPrice(item.askingPrice || item.currentMarketValue);
    setEditListingPhone(item.sellerPhone || '0300-1234567');
    setEditListingCity(item.sellerCity || 'Sahiwal');
    setEditListingDesc(item.saleDescription || '');
    setIsEditListingModalOpen(true);
  };

  // Save Edit Marketplace Item
  const handleSaveListingEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListingItem) return;

    const updated: Animal = {
      ...editingListingItem,
      askingPrice: Number(editListingPrice),
      sellerPhone: editListingPhone,
      sellerCity: editListingCity,
      saleDescription: editListingDesc,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setMarketplaceListings((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );

    // Also update in herd if it belongs to farmer
    const existingInHerd = animals.find((a) => a.id === updated.id);
    if (existingInHerd) {
      onSaveAnimal(updated);
    }

    setIsEditListingModalOpen(false);
    setEditingListingItem(null);
  };

  // Remove Listing / Mark as Sold
  const handleRemoveListing = (itemId: string) => {
    setMarketplaceListings((prev) => prev.filter((m) => m.id !== itemId));
    const animalInHerd = animals.find((a) => a.id === itemId);
    if (animalInHerd) {
      onSaveAnimal({ ...animalInHerd, isListedForSale: false });
    }
  };

  // Buy Animal Action from Marketplace
  const handleExecutePurchaseFromMarket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarketItem) return;

    const certNo = `PK-MARKET-BUY-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOwnershipRecord: OwnershipRecord = {
      id: 'own_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      sellerName: selectedMarketItem.sellerName || 'مویشی فروش',
      buyerName: 'Chaudhry Ahmed Ali',
      buyerPhone: '0300-1234567',
      salePrice: selectedMarketItem.askingPrice || selectedMarketItem.currentMarketValue,
      certificateNumber: certNo,
    };

    const purchasedAnimal: Animal = {
      ...selectedMarketItem,
      id: 'anm_bought_' + Date.now(),
      ownerId: 'usr_001',
      isListedForSale: false,
      purchasePrice: selectedMarketItem.askingPrice || selectedMarketItem.currentMarketValue,
      currentMarketValue: selectedMarketItem.askingPrice || selectedMarketItem.currentMarketValue,
      ownershipHistory: [newOwnershipRecord, ...selectedMarketItem.ownershipHistory],
      auditLogs: [
        {
          id: 'aud_' + Date.now(),
          timestamp: new Date().toLocaleString(),
          fieldChanged: 'منڈی سے خریداری (Marketplace Purchase)',
          oldValue: `فروش: ${selectedMarketItem.sellerName || 'منڈی'}`,
          newValue: 'منتقل بپاس پاس چوہدری احمد علی',
          updatedBy: 'Chaudhry Ahmed Ali',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to user herd
    onSaveAnimal(purchasedAnimal);

    // Remove from marketplace
    setMarketplaceListings((prev) => prev.filter((m) => m.id !== selectedMarketItem.id));

    setIsBuyModalOpen(false);
    setSelectedMarketItem(null);
    alert(`مبارک ہو! جانور "${purchasedAnimal.name}" آپ کی خریدی ہوئی فارم فہرست میں منتقل کر دیا گیا ہے۔ ملکیت سرٹیفکیٹ: ${certNo}`);
  };

  // Transfer Ownership Action
  const handleExecuteOwnershipTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || !transferBuyerName) return;

    const newCertNo = `TRANSFER-CERT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newRecord: OwnershipRecord = {
      id: 'own_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      sellerName: 'Chaudhry Ahmed Ali',
      buyerName: transferBuyerName,
      buyerPhone: transferBuyerPhone || '0300-9988776',
      salePrice: Number(transferPrice),
      certificateNumber: newCertNo,
    };

    const updatedAnimal: Animal = {
      ...selectedAnimal,
      isListedForSale: false,
      ownershipHistory: [newRecord, ...selectedAnimal.ownershipHistory],
      auditLogs: [
        {
          id: 'aud_' + Date.now(),
          timestamp: new Date().toLocaleString(),
          fieldChanged: 'ملکیت کی منتقلی (Ownership Transfer)',
          oldValue: 'Chaudhry Ahmed Ali',
          newValue: transferBuyerName,
          updatedBy: 'Chaudhry Ahmed Ali',
        },
        ...selectedAnimal.auditLogs,
      ],
    };

    onSaveAnimal(updatedAnimal);
    setSelectedAnimal(updatedAnimal);
    setIsTransferModalOpen(false);
    alert(`کامیابی! ملکیت سرٹیفکیٹ نمبر ${newCertNo} خریدار ${transferBuyerName} کے نام جاری کر دیا گیا ہے۔`);
  };

  // Mock Trend Data for Recharts
  const trendData = selectedAnimal
    ? [
        { month: 'جنوری', weight: selectedAnimal.weightKg - 40, value: selectedAnimal.purchasePrice },
        { month: 'مارچ', weight: selectedAnimal.weightKg - 25, value: selectedAnimal.purchasePrice * 1.05 },
        { month: 'مئی', weight: selectedAnimal.weightKg - 10, value: selectedAnimal.purchasePrice * 1.12 },
        { month: 'جولائی', weight: selectedAnimal.weightKg, value: selectedAnimal.currentMarketValue },
      ]
    : [];

  // Export Printable PDF Summary for Buyers
  const handleExportPDFSummary = (animal: Animal) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(language === 'en' ? 'Popup blocked. Please allow popups for PDF printing.' : 'پاپ اپ بلاکر کی وجہ سے PDF ونڈو نہیں کھلی۔ براہ کرم پاپ اپس کی اجازت دیں۔');
      return;
    }

    const certId = animal.digitalLicenseNumber || `PK-HEALTH-CERT-${animal.tagId}`;
    const today = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'ur-PK', { year: 'numeric', month: 'long', day: 'numeric' });
    const isEn = language === 'en';

    const vaccinationsHTML = animal.vaccinationHistory && animal.vaccinationHistory.length > 0
      ? animal.vaccinationHistory.map((vac) => `
        <tr>
          <td><strong>${vac.vaccineName}</strong><br><small style="color:#64748b">${vac.diseaseTarget || ''}</small></td>
          <td>${vac.dateGiven || (isEn ? 'Not recorded' : 'مندرج نہیں')}</td>
          <td>${vac.nextDueDate || (isEn ? 'Completed' : 'مکمل')}</td>
          <td><span style="color:${vac.status === 'completed' ? '#16a34a' : '#d97706'}; font-weight:bold;">${vac.status === 'completed' ? (isEn ? 'Completed' : 'مکمل (Completed)') : (isEn ? 'Scheduled' : 'شیڈول (Scheduled)')}</span></td>
          <td>${vac.administeredBy || (isEn ? 'Veterinary Officer' : 'ویٹرنری افسر')}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding: 12px;">${isEn ? 'No Vaccination Records' : 'کوئی ویکسینیشن ریکارڈ موجود نہیں (No Vaccination Records)'}</td></tr>`;

    const scanJournalHTML = animal.scanJournal && animal.scanJournal.length > 0
      ? animal.scanJournal.map((scan) => `
        <tr>
          <td><strong>${scan.date}</strong></td>
          <td><span style="color:${scan.severity === 'critical' || scan.severity === 'severe' ? '#dc2626' : '#16a34a'}; font-weight:bold;">${scan.detectedDisease}</span></td>
          <td>${scan.confidence}%</td>
          <td>${scan.recommendedMedicines ? scan.recommendedMedicines.join(', ') : (isEn ? 'Healthy / No medication required' : 'صحت مند / کوئی دواء درکار نہیں')}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding: 12px;">${isEn ? 'No Scan Journal Records' : 'کوئی ہیلتھ سکین جرنل مندرج نہیں (No Scan Journal Records)'}</td></tr>`;

    const medicalHTML = animal.medicalHistory && animal.medicalHistory.length > 0
      ? animal.medicalHistory.map((med) => `
        <tr>
          <td>${med.date}</td>
          <td>${med.diagnosis}</td>
          <td>${med.treatment}</td>
          <td>${med.medicineGiven} (${med.dosage})</td>
          <td>${med.vetName}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding: 12px;">${isEn ? 'Clean Medical History' : 'طبی ریکارڈ صاف ہے (Clean Medical History)'}</td></tr>`;

    const ownershipHTML = animal.ownershipHistory && animal.ownershipHistory.length > 0
      ? animal.ownershipHistory.map((own) => `
        <tr>
          <td>${own.date}</td>
          <td>${own.sellerName}</td>
          <td>${own.buyerName}</td>
          <td>PKR ${own.salePrice.toLocaleString()}</td>
          <td><strong style="color:#0284c7; font-family:monospace;">${own.certificateNumber}</strong></td>
        </tr>
      `).join('')
      : `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding: 12px;">${isEn ? 'Initial Owner - Ch. Ahmed Ali' : 'ابتدائی مالک - چوہدری احمد علی'}</td></tr>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${isEn ? 'en' : 'ur'}" dir="${isEn ? 'ltr' : 'rtl'}">
      <head>
        <meta charset="UTF-8">
        <title>${isEn ? `Digital Health Passport & Summary - ${animal.name} (${animal.tagId})` : `ڈیجیٹل ہیلتھ پاسپورٹ و PDF سمری - ${animal.name} (${animal.tagId})`}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body {
            font-family: 'Plus Jakarta Sans', 'Noto Nastaliq Urdu', system-ui, sans-serif;
            margin: 0;
            padding: 30px;
            color: #0f172a;
            background: #ffffff;
            direction: ${isEn ? 'ltr' : 'rtl'};
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #059669;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .header-title {
            font-size: 22px;
            font-weight: 800;
            color: #065f46;
          }
          .header-subtitle {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
          }
          .passport-badge {
            background: #ecfdf5;
            border: 1.5px solid #10b981;
            padding: 10px 18px;
            border-radius: 12px;
            text-align: ${isEn ? 'left' : 'right'};
            font-size: 12px;
            color: #047857;
          }
          .profile-grid {
            display: flex;
            gap: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .profile-photo {
            width: 150px;
            height: 150px;
            object-fit: cover;
            border-radius: 14px;
            border: 2px solid #10b981;
          }
          .profile-info {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            font-size: 13px;
          }
          .info-item {
            background: #ffffff;
            padding: 8px 12px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .info-label {
            font-size: 11px;
            color: #64748b;
            display: block;
            margin-bottom: 2px;
          }
          .info-val {
            font-weight: 700;
            color: #0f172a;
          }
          .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #047857;
            border-${isEn ? 'left' : 'right'}: 4px solid #10b981;
            padding-${isEn ? 'left' : 'right'}: 10px;
            margin: 22px 0 12px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 9px 12px;
            text-align: ${isEn ? 'left' : 'right'};
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
          }
          .footer-stamp {
            margin-top: 35px;
            padding-top: 20px;
            border-top: 2px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #64748b;
          }
          .stamp-box {
            border: 2px dashed #10b981;
            padding: 12px 24px;
            border-radius: 14px;
            color: #047857;
            font-weight: bold;
            text-align: center;
            background: #f0fdf4;
          }
          @media print {
            body { padding: 15px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:20px; text-align:${isEn ? 'right' : 'left'};">
          <button onclick="window.print()" style="background:#059669; color:#ffffff; border:none; padding:12px 24px; font-weight:bold; font-size:14px; border-radius:10px; cursor:pointer;">
            ${isEn ? '🖨️ Download PDF / Print Document' : '🖨️ PDF یا پرنٹ محفوظ کریں (Download PDF / Print)'}
          </button>
        </div>

        <div class="header">
          <div>
            <div class="header-title">${isEn ? 'Kisan Dost - Digital Animal Passport & Health Summary' : 'کسان دوست - ڈیجیٹل مویشی پاسپورٹ و ہیلتھ سمری'}</div>
            <div class="header-subtitle">${isEn ? 'Al-Madina Dairy & Cattle Farm • Verified Buyer Livestock Health Certificate' : 'Al-Madina Dairy & Cattle Farm • تصدیق شدہ مویشی ہسٹری رپورٹ برائے خریداران'}</div>
          </div>
          <div class="passport-badge">
            <strong>${isEn ? 'Certificate No:' : 'سرٹیفکیٹ نمبر:'}</strong> ${certId}<br>
            <strong>${isEn ? 'Issue Date:' : 'تاریخ اجراء:'}</strong> ${today}
          </div>
        </div>

        <div class="profile-grid">
          <img src="${animal.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'}" class="profile-photo" alt="${animal.name}">
          <div class="profile-info">
            <div class="info-item"><span class="info-label">${isEn ? 'Name:' : 'جانور کا نام:'}</span><span class="info-val">${animal.name}</span></div>
            <div class="info-item"><span class="info-label">${isEn ? 'Tag ID:' : 'ٹیگ آئی ڈی (Tag ID):'}</span><span class="info-val">${animal.tagId}</span></div>
            <div class="info-item"><span class="info-label">${isEn ? 'Species & Breed:' : 'نوع و نسل:'}</span><span class="info-val">${animal.species} (${animal.breed})</span></div>
            <div class="info-item"><span class="info-label">${isEn ? 'Age:' : 'عمر:'}</span><span class="info-val">${animal.ageMonths} ${isEn ? 'months' : 'ماہ'}</span></div>
            <div class="info-item"><span class="info-label">${isEn ? 'Weight:' : 'وزن:'}</span><span class="info-val">${animal.weightKg} ${isEn ? 'kg' : 'کلو'}</span></div>
            <div class="info-item"><span class="info-label">${isEn ? 'Milk Yield:' : 'دودھ کی پیداوار:'}</span><span class="info-val">${animal.milkYieldLitersPerDay} ${isEn ? 'L/day' : 'لیٹر/دن'}</span></div>
            <div class="info-item"><span class="info-label">${isEn ? 'Health Score:' : 'صحت سکور:'}</span><span class="info-val" style="color:#059669">${animal.healthScore} / 100</span></div>
            <div class="info-item"><span class="info-label">${isEn ? 'Est. Market Value:' : 'تخمینہ مارکیٹ قیمت:'}</span><span class="info-val">PKR ${animal.currentMarketValue.toLocaleString()}</span></div>
            <div class="info-item"><span class="info-label">${isEn ? 'Bloodline:' : 'خون کی نسل (Bloodline):'}</span><span class="info-val">${animal.bloodline || (isEn ? 'Purebred' : 'اصیل')}</span></div>
          </div>
        </div>

        <div class="section-title">${isEn ? '1. Complete Vaccination History' : '1. مکمل ویکسینیشن ہسٹری (Vaccination History)'}</div>
        <table>
          <thead>
            <tr>
              <th>${isEn ? 'Vaccine Name' : 'ویکسین کا نام'}</th>
              <th>${isEn ? 'Given Date' : 'تاریخ انجیکشن'}</th>
              <th>${isEn ? 'Next Due' : 'اگلی تاریخ'}</th>
              <th>${isEn ? 'Status' : 'حالت (Status)'}</th>
              <th>${isEn ? 'Veterinarian' : 'معالج / ڈاکٹر'}</th>
            </tr>
          </thead>
          <tbody>
            ${vaccinationsHTML}
          </tbody>
        </table>

        <div class="section-title">${isEn ? '2. AI Health Scan Journal & Diagnostics' : '2. اے آئی ہیلتھ سکین جرنل (AI Health Scan Journal & Diagnostics)'}</div>
        <table>
          <thead>
            <tr>
              <th>${isEn ? 'Date' : 'تاریخ و وقت'}</th>
              <th>${isEn ? 'Detected Disease' : 'تشخیص شدہ بیماری'}</th>
              <th>${isEn ? 'AI Confidence' : 'اے آئی اعتماد (Confidence)'}</th>
              <th>${isEn ? 'Recommended Treatment' : 'تجویز کردہ علاج و ادویات'}</th>
            </tr>
          </thead>
          <tbody>
            ${scanJournalHTML}
          </tbody>
        </table>

        <div class="section-title">${isEn ? '3. Medical History' : '3. طبی و علاج کا ریکارڈ (Medical History)'}</div>
        <table>
          <thead>
            <tr>
              <th>${isEn ? 'Date' : 'تاریخ'}</th>
              <th>${isEn ? 'Diagnosis' : 'تشخیص'}</th>
              <th>${isEn ? 'Treatment' : 'علاج و طریقہ'}</th>
              <th>${isEn ? 'Medication' : 'ادویات و خوراک'}</th>
              <th>${isEn ? 'Veterinarian' : 'ویٹرنری ڈاکٹر'}</th>
            </tr>
          </thead>
          <tbody>
            ${medicalHTML}
          </tbody>
        </table>

        <div class="section-title">${isEn ? '4. Ownership History' : '4. ملکیت کا ریکارڈ (Ownership History)'}</div>
        <table>
          <thead>
            <tr>
              <th>${isEn ? 'Date' : 'تاریخ'}</th>
              <th>${isEn ? 'Seller' : 'سابقہ مالک / فروش'}</th>
              <th>${isEn ? 'Buyer' : 'نیا خریدار'}</th>
              <th>${isEn ? 'Sale Price' : 'فروخت کی قیمت'}</th>
              <th>${isEn ? 'Certificate No' : 'سرٹیفکیٹ نمبر'}</th>
            </tr>
          </thead>
          <tbody>
            ${ownershipHTML}
          </tbody>
        </table>

        <div class="footer-stamp">
          <div>
            <strong>${isEn ? 'Farm Owner / Seller:' : 'فارم اونر / فروش:'}</strong> ${isEn ? 'Ch. Ahmed Ali (Al-Madina Dairy Farm)' : 'چوہدری احمد علی (Al-Madina Dairy Farm)'}<br>
            <strong>${isEn ? 'Verification Network:' : 'تصدیقی پلیٹ فارم:'}</strong> Kisan Dost AI Pakistan Network
          </div>
          <div class="stamp-box">
            ✓ VERIFIED LIVESTOCK HEALTH<br>
            <small style="font-weight:normal;">${isEn ? 'Kisan Dost Verified Digital Certificate' : 'کسان دوست ڈیجیٹل تصدیق شدہ سرٹیفکیٹ'}</small>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header & Workspace Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {viewMode === 'herd' ? t('animalManagement', language) : (language === 'en' ? 'Livestock Marketplace' : 'مویشی منڈی (Live Livestock Marketplace)')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
              {language === 'en' ? 'Live Market Index' : 'زندہ مارکیٹ انڈیکس'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === 'en' 
              ? 'Digital profiles, photo management, live market valuation estimation, and animal trading platform.' 
              : 'ڈیجیٹل پروفائل، پروفائل تصویر کی تبدیلی، لائیو مارکیٹ ریٹ کی حساب کتاب اور خرید و فروخت کا نظام۔'}
          </p>
        </div>

        {/* Workspace Mode Toggle (My Herd vs Live Marketplace vs Dairy Store) */}
        <div className="flex flex-wrap items-center bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl shrink-0 gap-1">
          <button
            onClick={() => setViewMode('herd')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
              viewMode === 'herd'
                ? 'bg-white dark:bg-slate-900 text-green-700 dark:text-green-300 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'en' ? `Our Herd (${animals.length})` : `ہمارا فارم (${animals.length})`}</span>
          </button>
          
          <button
            onClick={() => setViewMode('marketplace')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
              viewMode === 'marketplace'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'en' ? `Live Marketplace (${marketplaceListings.length})` : `مویشی منڈی - خرید و فروخت (${marketplaceListings.length})`}</span>
          </button>

          {onNavigateToDairyStore && (
            <button
              onClick={onNavigateToDairyStore}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 rtl:space-x-reverse bg-amber-500 hover:bg-amber-600 text-white shadow-md"
            >
              <Store className="w-4 h-4" />
              <span>{language === 'en' ? 'Dairy Store' : 'فارم ڈائری سٹور'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Market Price Rates Benchmark Bar */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-green-950 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <DollarSign className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-300">
              {language === 'en' ? 'Live Pakistan Mandi Benchmark Rates:' : 'پاکستان منڈی لائیو انڈیکس (Real-time Mandi Benchmark Rates):'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {language === 'en' ? 'Live daily rates • Sahiwal, Multan, Faisalabad, Karachi' : 'اپڈیٹ: آج لائیو • ساہیوال، ملتان، فیصل آباد، کراچی'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">{language === 'en' ? 'Cow (Sahiwal):' : 'گائے (Sahiwal Cow):'}</span>
            <span className="font-bold text-emerald-400">{language === 'en' ? 'Rs 680-750 / kg' : 'Rs 680-750 / کلو'}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">{language === 'en' ? 'Buffalo (Nili):' : 'بھینس (Nili Buffalo):'}</span>
            <span className="font-bold text-emerald-400">{language === 'en' ? 'Rs 720-820 / kg' : 'Rs 720-820 / کلو'}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">{language === 'en' ? 'Goat (Kamori):' : 'بکری (Kamori Goat):'}</span>
            <span className="font-bold text-emerald-400">{language === 'en' ? 'Rs 1,200-1,400 / kg' : 'Rs 1,200-1,400 / کلو'}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">{language === 'en' ? 'Sheep:' : 'بھیڑ (Sheep):'}</span>
            <span className="font-bold text-emerald-400">{language === 'en' ? 'Rs 1,100-1,300 / kg' : 'Rs 1,100-1,300 / کلو'}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-slate-400 block text-[10px]">{language === 'en' ? 'Camel:' : 'اونٹ (Camel):'}</span>
            <span className="font-bold text-emerald-400">{language === 'en' ? 'Rs 850-1,000 / kg' : 'Rs 850-1,000 / کلو'}</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute top-3.5 start-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === 'herd' ? t('searchPlaceholder', language) : (language === 'en' ? 'Search marketplace by city, breed or name...' : 'منڈی میں شہر، نسل یا نام تلاش کریں...')}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        {/* Species Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: language === 'en' ? 'All' : 'تمام مویشی' },
            { id: 'cow', label: language === 'en' ? 'Cow' : 'گائے' },
            { id: 'buffalo', label: language === 'en' ? 'Buffalo' : 'بھینس' },
            { id: 'goat', label: language === 'en' ? 'Goat' : 'بکری' },
            { id: 'sheep', label: language === 'en' ? 'Sheep' : 'بھیڑ' },
            { id: 'camel', label: language === 'en' ? 'Camel' : 'اونٹ' },
          ].map((sp) => (
            <button
              key={sp.id}
              onClick={() => setSelectedSpecies(sp.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                selectedSpecies === sp.id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Primary Action Button */}
        {viewMode === 'herd' ? (
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addAnimal', language)}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (animals.length > 0) {
                handleOpenListForSale(animals[0]);
              } else {
                alert(language === 'en' ? 'Please add an animal to your farm first!' : 'پہلے اپنے فارم کا جانور شامل کریں!');
              }
            }}
            className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse shrink-0"
          >
            <Tag className="w-4 h-4" />
            <span>{language === 'en' ? 'List Animal for Sale' : 'اپنا جانور منڈی میں لگائیں'}</span>
          </button>
        )}
      </div>

      {/* VIEW 1: MY HERD VIEW */}
      {viewMode === 'herd' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHerdAnimals.map((animal) => (
            <div
              key={animal.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Image & Header Overlay */}
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={animal.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'}
                    alt={animal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Tag & Status Badges */}
                  <div className="absolute top-3 start-3 flex items-center space-x-1.5 rtl:space-x-reverse">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-mono font-bold text-xs">
                      {animal.tagId}
                    </span>
                    {animal.isListedForSale && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[10px] flex items-center animate-pulse">
                        <Tag className="w-3 h-3 me-0.5" /> {language === 'en' ? 'For Sale' : 'برائے فروخت'}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 end-3 flex items-center space-x-1 rtl:space-x-reverse">
                    <label
                      className="p-2 rounded-full bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-md transition-all cursor-pointer"
                      title={language === 'en' ? 'Upload Photo' : 'تصویر برائے راست تبدیل کریں (Upload Photo)'}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const newPhotoUrl = event.target?.result as string;
                            if (newPhotoUrl) {
                              const updated: Animal = {
                                ...animal,
                                photos: [newPhotoUrl, ...(animal.photos.slice(1))],
                                updatedAt: new Date().toISOString(),
                              };
                              onSaveAnimal(updated);
                              if (selectedAnimal?.id === animal.id) {
                                setSelectedAnimal(updated);
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-md ${
                        animal.healthScore >= 90 ? 'bg-green-600' : 'bg-amber-600'
                      }`}
                    >
                      {language === 'en' ? 'Health ' : 'صحت '}{animal.healthScore}/100
                    </span>
                  </div>

                  {/* Name on Image */}
                  <div className="absolute bottom-3 start-3 end-3 text-white">
                    <h3 className="text-lg font-bold drop-shadow-md truncate">{animal.name}</h3>
                    <p className="text-xs text-slate-200 drop-shadow-sm truncate">
                      {animal.breed} • {animal.ageMonths} {language === 'en' ? 'months' : 'ماہ'}
                    </p>
                  </div>
                </div>

                {/* Specs Body */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">{language === 'en' ? 'Weight:' : 'وزن (Weight):'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{animal.weightKg} {language === 'en' ? 'kg' : 'کلوگرام'}</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">{language === 'en' ? 'Milk Yield:' : 'دودھ (Milk Yield):'}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{animal.milkYieldLitersPerDay} {language === 'en' ? 'L/day' : 'لیٹر/دن'}</span>
                    </div>
                  </div>

                  {/* Dynamic Valuation */}
                  <div className="p-3 rounded-2xl bg-green-50/60 dark:bg-green-950/30 border border-green-100 dark:border-green-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">{language === 'en' ? 'Est. Market Value:' : 'تخمینہ مارکیٹ ویلیو:'}</span>
                      <span className="font-bold text-green-700 dark:text-green-300">
                        PKR {animal.currentMarketValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="text-[11px] font-bold text-green-700 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-green-200 dark:border-green-800 block">
                        +{animal.marketValueChangePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedAnimal(animal)}
                    className="flex-1 py-2.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-sm transition-all text-center"
                  >
                    {language === 'en' ? 'View Passport' : 'پروفائل ہسٹری رکھیں'}
                  </button>
                  <button
                    onClick={() => handleExportPDFSummary(animal)}
                    className="px-2.5 py-2.5 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold text-xs transition-all flex items-center space-x-1 rtl:space-x-reverse"
                    title={language === 'en' ? 'Export Buyer Health Passport (PDF)' : 'خریداروں کے لیے PDF ہیلتھ سمری ایکسپورٹ کریں'}
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(animal)}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center space-x-1 rtl:space-x-reverse"
                    title={language === 'en' ? 'Edit Profile & Photo' : 'پروفائل و تصویر اپڈیٹ کریں'}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'en' ? 'Edit' : 'ایڈٹ'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenListForSale(animal)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 rtl:space-x-reverse ${
                      animal.isListedForSale
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-white'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {animal.isListedForSale 
                        ? (language === 'en' ? `Listed (PKR ${animal.askingPrice?.toLocaleString()})` : `منڈی میں لسٹڈ (PKR ${animal.askingPrice?.toLocaleString()})`) 
                        : (language === 'en' ? 'List in Market' : 'منڈی میں لسٹ کریں')}
                    </span>
                  </button>
                  <button
                    onClick={() => onDeleteAnimal(animal.id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                    title={language === 'en' ? 'Delete' : 'حذف کریں'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: LIVE MARKETPLACE VIEW */}
      {viewMode === 'marketplace' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMarketListings.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    <div className="absolute top-3 start-3">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center shadow-md">
                        <Tag className="w-3 h-3 me-1" /> {language === 'en' ? 'For Sale' : 'برائے فروخت'}
                      </span>
                    </div>

                    <div className="absolute top-3 end-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-md flex items-center">
                        <MapPin className="w-3 h-3 me-1" /> {item.sellerCity || (language === 'en' ? 'Pakistan' : 'پاکستان')}
                      </span>
                    </div>

                    <div className="absolute bottom-3 start-3 end-3 text-white">
                      <h3 className="text-lg font-bold drop-shadow-md truncate">{item.name}</h3>
                      <p className="text-xs text-slate-200 drop-shadow-sm">
                        {item.breed} • {item.weightKg} {language === 'en' ? 'kg' : 'کلو'} • {item.milkYieldLitersPerDay} {language === 'en' ? 'L/day' : 'لیٹر/دن'}
                      </p>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div>
                        <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">
                          {language === 'en' ? 'Asking Price:' : 'طلب کردہ قیمت (Asking Price):'}
                        </span>
                        <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                          PKR {(item.askingPrice || item.currentMarketValue).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                        {language === 'en' ? 'Est:' : 'تخمینہ:'} {item.marketRateBenchmarkPKR?.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{language === 'en' ? 'Seller Farmer:' : 'فروش فارمر:'}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.sellerName || (language === 'en' ? 'Mandi Farm' : 'منڈی فارم')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{language === 'en' ? 'Contact:' : 'رابطہ نمبر:'}</span>
                        <span className="font-bold text-emerald-600 font-mono">{item.sellerPhone || '0300-XXXXXXX'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-2">
                        "{item.saleDescription || (language === 'en' ? 'High quality genetic breed animal.' : 'اعلی جینیاتی نسل کا جانور۔')}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenEditListing(item)}
                      className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 font-bold text-xs transition-all flex items-center justify-center space-x-1 rtl:space-x-reverse"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Edit Price' : 'قیمت ایڈٹ کریں'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const confirmMsg = language === 'en' 
                          ? `Remove listing "${item.name}" from marketplace as sold?` 
                          : `کیا آپ اس لسٹنگ "${item.name}" کو فروخت شدہ تصور کر کے منڈی سے ہٹانا چاہتے ہیں؟`;
                        if (confirm(confirmMsg)) {
                          handleRemoveListing(item.id);
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-200 font-bold text-xs transition-all flex items-center justify-center space-x-1 rtl:space-x-reverse"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Sold (Remove)' : 'فروخت ہو گیا (Remove)'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMarketItem(item);
                      setIsBuyModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 rtl:space-x-reverse"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{language === 'en' ? 'Buy Animal' : 'خریداری کریں (Buy Animal)'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT ANIMAL PROFILE & IMAGE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 relative max-h-[92vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formData.id 
                    ? (language === 'en' ? 'Edit Animal Profile & Photo' : 'جانور کا ڈیٹا اور تصویر تبدیل کریں (Edit Profile)') 
                    : (language === 'en' ? 'Add New Animal' : 'نیا جانور درج کریں')}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'en' ? 'Update animal data, photo, and live market valuation' : 'پروفائل، تصویر اور لائیو مارکیٹ ریٹ اپڈیٹ کریں'}
                </p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              
              {/* Profile Image Uploader & Presets */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'en' ? 'Animal Profile Photo:' : 'جانور کی پروفائل تصویر (Update Animal Image):'}
                </label>

                <div 
                  className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-emerald-500 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFormPhotoUpload(e.dataTransfer.files);
                  }}
                >
                  <img
                    src={formData.photos?.[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'}
                    alt="Animal Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <label className="inline-flex items-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all space-x-1.5 rtl:space-x-reverse">
                        <Camera className="w-4 h-4" />
                        <span>{language === 'en' ? 'Browse Photo' : 'تصویر منتخب کریں (Browse Photo)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFormPhotoUpload(e.target.files)}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {language === 'en' ? 'or drag & drop here' : 'یا تصویر یہاں ڈریگ اینڈ ڈراپ کریں'}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={formData.photos?.[0] || ''}
                      onChange={(e) => setFormData({ ...formData, photos: [e.target.value] })}
                      placeholder={language === 'en' ? 'or enter image URL link...' : 'یا تصویر کا آن لائن URL لنک درج کریں...'}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] outline-none"
                    />
                  </div>
                </div>

                {/* Photo Presets Grid */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                    {language === 'en' ? 'Or choose from library presets:' : 'یا تصویر گیلری سے منتخب کریں:'}
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {photoPresets.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setFormData({ ...formData, photos: [preset.url] })}
                        className={`p-1 rounded-xl border transition-all text-center ${
                          formData.photos?.[0] === preset.url
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-10 rounded-lg object-cover" />
                        <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300 truncate block mt-0.5">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Name / Tag:' : 'نام / پہچان:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={language === 'en' ? 'e.g. Sahiwal Bull / Rani' : 'مثال: سوہنا بچھڑا / رانی'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Tag ID:' : 'ٹیگ آئی ڈی (Tag ID):'}
                  </label>
                  <input
                    type="text"
                    value={formData.tagId || ''}
                    onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                    placeholder="KD-8842"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Species:' : 'نوع (Species):'}
                  </label>
                  <select
                    value={formData.species || 'cow'}
                    onChange={(e) => {
                      const sp = e.target.value as Species;
                      const autoVal = calculateAutoMarketValue(sp, formData.weightKg || 350, formData.milkYieldLitersPerDay || 0, formData.healthScore || 90);
                      setFormData({ ...formData, species: sp, currentMarketValue: autoVal });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                  >
                    <option value="cow">{language === 'en' ? 'Cow' : 'گائے (Cow)'}</option>
                    <option value="buffalo">{language === 'en' ? 'Buffalo' : 'بھینس (Buffalo)'}</option>
                    <option value="goat">{language === 'en' ? 'Goat' : 'بکری (Goat)'}</option>
                    <option value="sheep">{language === 'en' ? 'Sheep' : 'بھیڑ (Sheep)'}</option>
                    <option value="camel">{language === 'en' ? 'Camel' : 'اونٹ (Camel)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Breed:' : 'نسل (Breed):'}
                  </label>
                  <input
                    type="text"
                    value={formData.breed || ''}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder={language === 'en' ? 'e.g. Sahiwal / Nili Ravi' : 'مثال: ساہیوال / نیلی راوی'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Weight (kg):' : 'وزن (کلو):'}
                  </label>
                  <input
                    type="number"
                    value={formData.weightKg || 350}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      const autoVal = calculateAutoMarketValue(formData.species || 'cow', w, formData.milkYieldLitersPerDay || 0, formData.healthScore || 90);
                      setFormData({ ...formData, weightKg: w, currentMarketValue: autoVal });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Age (months):' : 'عمر (ماہ):'}
                  </label>
                  <input
                    type="number"
                    value={formData.ageMonths || 24}
                    onChange={(e) => setFormData({ ...formData, ageMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Milk (L/day):' : 'دودھ (لیٹر/دن):'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.milkYieldLitersPerDay || 0}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      const autoVal = calculateAutoMarketValue(formData.species || 'cow', formData.weightKg || 350, m, formData.healthScore || 90);
                      setFormData({ ...formData, milkYieldLitersPerDay: m, currentMarketValue: autoVal });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Market Valuation Tool */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center">
                    <Calculator className="w-4 h-4 text-emerald-600 me-1" />
                    <span>{language === 'en' ? 'Live Market Price Estimator:' : 'لائیو مارکیٹ پرائس ویلیویشن (Market Price Estimator):'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const autoVal = calculateAutoMarketValue(formData.species || 'cow', formData.weightKg || 350, formData.milkYieldLitersPerDay || 0, formData.healthScore || 90);
                      setFormData({ ...formData, currentMarketValue: autoVal });
                    }}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                  >
                    {language === 'en' ? 'Recalculate Rate' : 'ریٹ دوبارہ نکالیں'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      {language === 'en' ? 'Purchase Price (PKR):' : 'خریداری قیمت (Purchase Price):'}
                    </label>
                    <input
                      type="number"
                      value={formData.purchasePrice || 200000}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mb-1">
                      {language === 'en' ? 'Current Valuation (PKR):' : 'موجودہ مارکیٹ قیمت (Current Valuation):'}
                    </label>
                    <input
                      type="number"
                      value={formData.currentMarketValue || 240000}
                      onChange={(e) => setFormData({ ...formData, currentMarketValue: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-700 dark:text-emerald-300 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all"
                >
                  {language === 'en' ? 'Save Profile & Photos' : 'پروفائل محفوظ کریں (Save Profile & Photos)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAILED PROFILE VIEW MODAL */}
      {selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-6 relative max-h-[92vh] overflow-y-auto space-y-6">
            
            <button
              onClick={() => setSelectedAnimal(null)}
              className="absolute top-4 end-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="relative group shrink-0">
                <img
                  src={selectedAnimal.photos[0] || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'}
                  alt={selectedAnimal.name}
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                />
                <label
                  className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer p-1 text-center"
                  title={language === 'en' ? 'Change Photo' : 'تصویر تبدیل کریں'}
                >
                  <Camera className="w-6 h-6 mb-1 text-emerald-400" />
                  <span className="text-[10px] font-bold">{language === 'en' ? 'Change Photo' : 'تصویر تبدیل کریں'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUploadForSelectedAnimal}
                  />
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {selectedAnimal.tagId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedAnimal.breed}
                  </span>
                  {selectedAnimal.isListedForSale && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center">
                      <Tag className="w-3 h-3 me-1" /> {language === 'en' ? 'For Sale in Market' : 'منڈی میں برائے فروخت'}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {selectedAnimal.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en' 
                    ? `Age: ${selectedAnimal.ageMonths} months • Weight: ${selectedAnimal.weightKg} kg • Bloodline: ${selectedAnimal.bloodline || 'Purebred'}`
                    : `عمر: ${selectedAnimal.ageMonths} ماہ • وزن: ${selectedAnimal.weightKg} کلو • خون کی نسل: ${selectedAnimal.bloodline || 'اصیل'}`}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>{language === 'en' ? 'Update Image' : 'تصویر تبدیل کریں (Update Image)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUploadForSelectedAnimal}
                    />
                  </label>

                  <button
                    onClick={() => {
                      const currentSelected = selectedAnimal;
                      setSelectedAnimal(null);
                      handleOpenEdit(currentSelected);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{language === 'en' ? 'Edit Profile Data' : 'پروفائل ڈیٹا ایڈٹ کریں'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setTransferPrice(selectedAnimal.currentMarketValue);
                      setIsTransferModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{t('transferOwnership', language)}</span>
                  </button>

                  <button
                    onClick={() => handleExportPDFSummary(selectedAnimal)}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
                    title={language === 'en' ? 'Export PDF Health Summary for Buyers' : 'خریداروں کے لیے PDF ہیلتھ سمری ایکسپورٹ کریں'}
                  >
                    <Download className="w-4 h-4" />
                    <span>{language === 'en' ? 'Digital PDF Report' : 'دیجیٹل PDF رپورٹ (Export PDF)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Health Score & Market Value Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">
                  {language === 'en' ? 'Health Score:' : 'صحت سکور:'}
                </span>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {selectedAnimal.healthScore} / 100
                </p>
                <span className="text-[11px] text-emerald-600">
                  {language === 'en' ? 'Excellent Genetic & Physical Condition' : 'عمدہ جینیاتی جسمانی حالت'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800">
                <span className="text-xs text-blue-800 dark:text-blue-300 font-medium block">
                  {language === 'en' ? 'Current Market Value:' : 'موجودہ مارکیٹ ویلیو:'}
                </span>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  PKR {selectedAnimal.currentMarketValue.toLocaleString()}
                </p>
                <span className="text-[11px] text-blue-600">
                  {language === 'en' ? 'Purchase Price:' : 'خریداری قیمت:'} PKR {selectedAnimal.purchasePrice.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800">
                <span className="text-xs text-amber-800 dark:text-amber-300 font-medium block">
                  {language === 'en' ? 'Marketplace Listing Status:' : 'منڈی لسٹنگ سٹیٹس:'}
                </span>
                <p className="text-base font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {selectedAnimal.isListedForSale 
                    ? (language === 'en' ? `For Sale (PKR ${selectedAnimal.askingPrice?.toLocaleString()})` : `برائے فروخت (PKR ${selectedAnimal.askingPrice?.toLocaleString()})`) 
                    : (language === 'en' ? 'In Farm' : 'فارم میں موجود')}
                </p>
                <button
                  onClick={() => handleOpenListForSale(selectedAnimal)}
                  className="text-[10px] text-amber-600 underline font-bold mt-1 block"
                >
                  {language === 'en' ? 'Change Price or Listing' : 'قیمت یا لسٹنگ تبدیل کریں'}
                </button>
              </div>
            </div>

            {/* Interactive Trend Chart (Recharts) */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 me-2" />
                <span>{language === 'en' ? 'Weight & Market Value Historical Progress' : 'وزن اور مارکیٹ ویلیو میں پیش رفت (Historical Progress)'}</span>
              </h3>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                    <YAxis stroke="#888888" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="weight" name={language === 'en' ? 'Weight (kg)' : 'وزن (Kg)'} stroke="#10b981" fillOpacity={1} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DIGITAL PDF PASSPORT & BUYER GUARANTEE BANNER */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-900 to-emerald-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1 text-center sm:text-start">
                <div className="flex items-center justify-center sm:justify-start space-x-2 rtl:space-x-reverse">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-sm text-emerald-300">
                    {language === 'en' ? 'Digital Buyer Health Passport' : 'دیجیٹل تصدیق شدہ پاسپورٹ (Digital Buyer Health Passport)'}
                  </span>
                </div>
                <p className="text-xs text-teal-100 max-w-xl">
                  {language === 'en' 
                    ? 'Export or print the official verified livestock health passport with complete AI diagnostics, scan history, and vaccination records for buyers.'
                    : 'خریداروں کے اعتماد کے لیے اس جانور کا مکمل صحت سکین جرنل، اے آئی تشخیص، اور ویکسینیشن ریکارڈر کی آفیشل PDF سمری ایکسپورٹ کریں یا پرنٹ نکالیں۔'}
                </p>
                <div className="text-[10px] text-teal-300 font-mono">
                  {language === 'en' ? 'Certificate No:' : 'سرٹیفکیٹ نمبر:'} {selectedAnimal.digitalLicenseNumber || `PK-HEALTH-CERT-${selectedAnimal.tagId}`}
                </div>
              </div>

              <button
                onClick={() => handleExportPDFSummary(selectedAnimal)}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center space-x-2 rtl:space-x-reverse shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'en' ? 'Download PDF Report' : 'خریداروں کے لیے PDF ڈاؤنلوڈ کریں'}</span>
              </button>
            </div>

            {/* VACCINATION HISTORY SECTION */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 me-2" />
                  <span>{language === 'en' ? 'Vaccination History' : 'ویکسینیشن ہسٹری (Vaccination History)'}</span>
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                  {selectedAnimal.vaccinationHistory?.length || 0} {language === 'en' ? 'vaccines recorded' : 'ویکسینز درج ہیں'}
                </span>
              </div>

              {selectedAnimal.vaccinationHistory && selectedAnimal.vaccinationHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[11px]">
                        <th className="py-2 text-start font-bold">{language === 'en' ? 'Vaccine' : 'ویکسین نام'}</th>
                        <th className="py-2 text-start font-bold">{language === 'en' ? 'Given Date' : 'تاریخ انجیکشن'}</th>
                        <th className="py-2 text-start font-bold">{language === 'en' ? 'Next Due' : 'اگلی تاریخ'}</th>
                        <th className="py-2 text-start font-bold">{language === 'en' ? 'Status' : 'حالت'}</th>
                        <th className="py-2 text-start font-bold">{language === 'en' ? 'Officer / Vet' : 'معالج'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedAnimal.vaccinationHistory.map((vac) => (
                        <tr key={vac.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                            {vac.vaccineName}
                            <span className="block text-[10px] text-slate-400 font-normal">{vac.diseaseTarget}</span>
                          </td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">{vac.dateGiven || '—'}</td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">{vac.nextDueDate || '—'}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              vac.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {vac.status === 'completed' ? (language === 'en' ? 'Completed' : 'مکمل') : (language === 'en' ? 'Scheduled' : 'شیڈول')}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-600 dark:text-slate-400">{vac.administeredBy || (language === 'en' ? 'Veterinary Officer' : 'ویٹرنری افسر')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">
                  {language === 'en' ? 'No vaccination history recorded' : 'کوئی ویکسینیشن ہسٹری درج نہیں ہے'}
                </p>
              )}
            </div>

            {/* AI HEALTH SCAN JOURNAL SECTION */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                  <Activity className="w-4 h-4 text-emerald-600 me-2" />
                  <span>{language === 'en' ? 'AI Health Scan Journal & Diagnostics' : 'اے آئی ہیلتھ سکین جرنل (AI Health Scan Journal & Diagnostics)'}</span>
                </h3>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2.5 py-1 rounded-full">
                  {selectedAnimal.scanJournal?.length || 0} {language === 'en' ? 'scans' : 'سکینز'}
                </span>
              </div>

              {selectedAnimal.scanJournal && selectedAnimal.scanJournal.length > 0 ? (
                <div className="space-y-3">
                  {selectedAnimal.scanJournal.map((scan) => (
                    <div key={scan.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        {scan.imageUrl && (
                          <img src={scan.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                        )}
                        <div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{scan.detectedDisease}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              scan.severity === 'critical' || scan.severity === 'severe'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                            }`}>
                              {language === 'en' ? 'Severity:' : 'شدت:'} {scan.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {language === 'en' ? `Date: ${scan.date} • Confidence: ${scan.confidence}%` : `تاریخ: ${scan.date} • اے آئی اعتماد سکور: ${scan.confidence}%`}
                          </p>
                          {scan.recommendedMedicines && scan.recommendedMedicines.length > 0 && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                              {language === 'en' ? 'Recommended Medicines:' : 'تجویز کردہ ادویات:'} {scan.recommendedMedicines.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">
                  {language === 'en' 
                    ? 'No scan records found. Use the AI Scanner to upload animal photos and generate health diagnostics.'
                    : "کوئی سکین جرنل درج نہیں ہے۔ آپ 'اے آئی سکینر' کے ذریعے تصویر اپلوڈ کر کے جرنل تیار کر سکتے ہیں۔"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LIST ANIMAL FOR SALE MODAL */}
      {isListForSaleModalOpen && selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <Tag className="w-5 h-5 text-amber-500 me-2" />
                <span>{language === 'en' ? 'List Animal for Sale' : 'منڈی میں برائے فروخت لسٹ کریں (List for Sale)'}</span>
              </h3>
              <button onClick={() => setIsListForSaleModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmListForSale} className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-900 dark:text-amber-200">
                {language === 'en' ? 'Animal:' : 'جانور:'} <strong>{selectedAnimal.name} ({selectedAnimal.tagId})</strong>
                <br />
                {language === 'en' ? 'Est. Market Value:' : 'تخمینہ مارکیٹ قیمت:'} <strong>PKR {selectedAnimal.currentMarketValue.toLocaleString()}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Asking Sale Price (PKR):' : 'طلب کردہ قیمت (Asking Sale Price PKR):'}
                </label>
                <input
                  type="number"
                  required
                  value={listingAskingPrice}
                  onChange={(e) => setListingAskingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'City / Market Location:' : 'شہر / منڈی کا مقام:'}
                </label>
                <input
                  type="text"
                  required
                  value={listingSellerCity}
                  onChange={(e) => setListingSellerCity(e.target.value)}
                  placeholder={language === 'en' ? 'Sahiwal / Multan / Lahore' : 'ساہیوال / ملتان / لاہور'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Contact Phone Number:' : 'رابطہ فون نمبر:'}
                </label>
                <input
                  type="text"
                  required
                  value={listingSellerPhone}
                  onChange={(e) => setListingSellerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Description & Highlights:' : 'جانور کی خصوصیات و تفصیل:'}
                </label>
                <textarea
                  value={listingDescription}
                  onChange={(e) => setListingDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg transition-all"
              >
                {language === 'en' ? 'Publish on Marketplace' : 'منڈی میں لسٹ کر دیں (Publish on Marketplace)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BUY ANIMAL CONFIRMATION MODAL */}
      {isBuyModalOpen && selectedMarketItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <ShoppingBag className="w-5 h-5 text-emerald-600 me-2" />
                <span>{language === 'en' ? 'Buy Animal' : 'جانور کی خریداری (Buy Animal)'}</span>
              </h3>
              <button onClick={() => setIsBuyModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePurchaseFromMarket} className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200">
                <img src={selectedMarketItem.photos[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{selectedMarketItem.name}</h4>
                  <p className="text-xs text-slate-500">{selectedMarketItem.breed} • {selectedMarketItem.weightKg} kg</p>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {language === 'en' ? 'Price:' : 'قیمت:'} PKR {(selectedMarketItem.askingPrice || selectedMarketItem.currentMarketValue).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center justify-between">
                  <span>{language === 'en' ? 'Seller:' : 'فروش:'}</span>
                  <strong className="text-slate-800 dark:text-slate-100">{selectedMarketItem.sellerName} ({selectedMarketItem.sellerCity})</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>{language === 'en' ? 'Contact:' : 'رابطہ:'}</span>
                  <strong className="text-emerald-600 font-mono">{selectedMarketItem.sellerPhone}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>{language === 'en' ? 'Ownership Certificate:' : 'ملکیت منتقلی سرٹیفکیٹ:'}</span>
                  <span className="text-emerald-600 font-bold">{language === 'en' ? 'Automatically generated online' : 'آن لائن خودکار جاری ہو گا'}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all"
              >
                {language === 'en' ? 'Confirm Purchase & Add to Herd' : 'خریداری کی تصدیق کریں (Confirm & Add to Herd)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: TRANSFER OWNERSHIP MODAL */}
      {isTransferModalOpen && selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <UserCheck className="w-5 h-5 text-amber-600 me-2" />
                <span>{language === 'en' ? 'Transfer Ownership' : 'ملکیت کی منتقلی (Transfer Ownership)'}</span>
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteOwnershipTransfer} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Animal:' : 'جانور:'} <strong className="text-slate-800 dark:text-slate-200">{selectedAnimal.name} ({selectedAnimal.tagId})</strong>
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'New Buyer / Owner Name:' : 'نئے خریدار / مالک کا نام:'}
                </label>
                <input
                  type="text"
                  required
                  value={transferBuyerName}
                  onChange={(e) => setTransferBuyerName(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Malik Tahir Hussain' : 'مثال: ملک طاہر حسین'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Buyer Phone Number:' : 'خریدار کا فون نمبر:'}
                </label>
                <input
                  type="text"
                  value={transferBuyerPhone}
                  onChange={(e) => setTransferBuyerPhone(e.target.value)}
                  placeholder="0300-8877665"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Sale Amount (PKR):' : 'فروخت کی رقم (PKR):'}
                </label>
                <input
                  type="number"
                  value={transferPrice}
                  onChange={(e) => setTransferPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition-all"
                >
                  {language === 'en' ? 'Issue Transfer Certificate' : 'منتقلی سرٹیفکیٹ جاری کریں'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 5: EDIT MARKETPLACE LISTING MODAL */}
      {isEditListingModalOpen && editingListingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
                  <Edit3 className="w-4 h-4 text-emerald-600 me-2" />
                  <span>{language === 'en' ? 'Update Marketplace Listing Price & Info' : 'منڈی لسٹنگ میں قیمت اور تفصیل تبدیل کریں'}</span>
                </h3>
                <p className="text-xs text-slate-400">{editingListingItem.name} ({editingListingItem.breed})</p>
              </div>
              <button onClick={() => setIsEditListingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveListingEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'New Asking Price (PKR):' : 'طلب کردہ نئی قیمت (PKR):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1000}
                    value={editListingPrice}
                    onChange={(e) => setEditListingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-black text-amber-700 dark:text-amber-400 outline-none"
                  />
                  <span className="absolute end-3 top-2.5 text-xs text-slate-400 font-bold">
                    {language === 'en' ? 'PKR' : 'روپے'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'Contact Phone:' : 'رابطہ فون نمبر:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editListingPhone}
                    onChange={(e) => setEditListingPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'en' ? 'City / Location:' : 'شہر / منڈی کا مقام:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editListingCity}
                    onChange={(e) => setEditListingCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Additional Sale Details:' : 'فروخت کی اضافی تفصیلات:'}
                </label>
                <textarea
                  rows={2}
                  value={editListingDesc}
                  onChange={(e) => setEditListingDesc(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. High milk yield guaranteed, fully vaccinated, healthy...' : 'مثال: دودھ دینے کی مکمل ضمانت، صحت مند، ویکسین شدہ...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  {language === 'en' ? 'Save Changes' : 'قیمت محفوظ کریں (Save Changes)'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditListingModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  {language === 'en' ? 'Cancel' : 'منسوخ'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
