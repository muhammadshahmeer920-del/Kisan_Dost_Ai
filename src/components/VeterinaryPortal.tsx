import React, { useState } from 'react';
import { VetDoctor, Appointment, Animal, Language } from '../types';
import { t } from '../lib/translations';
import { initialVets } from '../lib/mockData';
import { 
  Stethoscope, 
  Video, 
  Phone, 
  MapPin, 
  Star, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  X,
  MessageSquare
} from 'lucide-react';

interface VeterinaryPortalProps {
  animals: Animal[];
  appointments: Appointment[];
  onBookAppointment: (appointment: Appointment) => void;
  language: Language;
}

export const VeterinaryPortal: React.FC<VeterinaryPortalProps> = ({
  animals,
  appointments,
  onBookAppointment,
  language,
}) => {
  const [vets] = useState<VetDoctor[]>(initialVets);
  const [selectedVet, setSelectedVet] = useState<VetDoctor | null>(null);
  const [activeVideoCall, setActiveVideoCall] = useState<Appointment | null>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState(animals[0]?.id || '');
  const [appointmentDate, setAppointmentDate] = useState('2026-08-10');
  const [appointmentReason, setAppointmentReason] = useState('دودھ کی کمی اور حاملہ جانور کا باقاعدہ معائنہ');

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVet) return;

    const chosenAnimal = animals.find((a) => a.id === selectedAnimalId);

    const newApt: Appointment = {
      id: 'apt_' + Date.now(),
      farmerId: 'usr_001',
      vetId: selectedVet.id,
      vetName: selectedVet.name,
      animalId: selectedAnimalId,
      animalName: chosenAnimal?.name || 'گائے',
      date: appointmentDate,
      timeSlot: '11:00 AM',
      type: 'video',
      status: 'confirmed',
      reason: appointmentReason,
    };

    onBookAppointment(newApt);
    setSelectedVet(null);
    alert(`کامیابی! ${selectedVet.name} کے ساتھ آن لائن ویڈیو ویٹرنری اپائنٹمنٹ بک ہو گئی ہے۔`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Stethoscope className="w-6 h-6 text-emerald-600 me-2" />
          <span>{t('vetPortal', language)}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          تصدیق شدہ ویٹرنری ڈاکٹروں سے آن لائن ویڈیو کنسلٹیشن، ہسپتال اپائنٹمنٹ اور نسخہ حاصل کریں۔
        </p>
      </div>

      {/* Active Appointments */}
      {appointments.length > 0 && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center">
            <Calendar className="w-4 h-4 me-2 text-emerald-600" />
            <span>آنے والی ویٹرنری اپائنٹمنٹس (Upcoming Appointments)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{apt.vetName}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    جانور: {apt.animalName} • {apt.date} ({apt.timeSlot})
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-xs">{apt.reason}</p>
                </div>

                <button
                  onClick={() => setActiveVideoCall(apt)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center space-x-1 rtl:space-x-reverse"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>ویڈیو کال شروع کریں</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vet Doctors Directory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vets.map((vet) => (
          <div
            key={vet.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <img
                src={vet.imageUrl}
                alt={vet.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div>
                <div className="flex items-center space-x-1 rtl:space-x-reverse text-amber-500 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{vet.rating}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{vet.name}</h3>
                <p className="text-[11px] text-emerald-600 font-medium">{vet.specialty}</p>
                <p className="text-[10px] text-slate-400">{vet.qualifications} ({vet.experienceYears} سالہ تجربہ)</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{vet.clinicAddress} ({vet.distanceKm} کلومیٹر)</span>
              </div>
              <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{vet.phone}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">فیس:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">PKR {vet.consultationFeePKR}</span>
              </div>

              <button
                onClick={() => setSelectedVet(vet)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                بکنگ کریں
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                ویٹرنری اپائنٹمنٹ بکنگ ({selectedVet.name})
              </h3>
              <button onClick={() => setSelectedVet(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  جانور کا انتخاب کریں:
                </label>
                <select
                  value={selectedAnimalId}
                  onChange={(e) => setSelectedAnimalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                >
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.tagId}) - {a.breed}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ:
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تفصیلی وجہ یا علامات:
                </label>
                <textarea
                  rows={3}
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-all"
                >
                  آن لائن کنسلٹیشن کی تصدیق کریں (PKR {selectedVet.consultationFeePKR})
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Simulated Live Video Consultation Screen */}
      {activeVideoCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 text-white space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h3 className="text-sm font-bold">لائیو ویٹرنری ویڈیو کنسلٹیشن: {activeVideoCall.vetName}</h3>
              </div>
              <button onClick={() => setActiveVideoCall(null)} className="p-1 rounded-lg bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Simulated Video Stream */}
            <div className="relative h-64 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800"
                alt="Vet Doctor"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute bottom-3 start-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold">
                {activeVideoCall.vetName} (آن لائن)
              </div>
            </div>

            <p className="text-xs text-slate-300">
              ڈاکٹر سے لائیو گفتگو جاری ہے۔ ڈاکٹر صاحب آپ کے جانور <strong>{activeVideoCall.animalName}</strong> کے لیے علاج اور نسخہ تحریر کر رہے ہیں۔
            </p>

            <button
              onClick={() => {
                alert('ڈاکٹر صاحب نے نسخہ (Prescription) آپ کے فارم اکاؤنٹ میں بھیج دیا ہے۔');
                setActiveVideoCall(null);
              }}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg"
            >
              کال مکمل کریں اور نسخہ ڈاؤن لوڈ کریں
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
