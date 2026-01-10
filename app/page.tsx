'use client';
import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { 
  Download, Music, Star, ArrowDown, Instagram, Mail, Phone, CheckCircle2,
  ChevronRight, Menu, X, Send 
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, where } from 'firebase/firestore';

// --- TIPAGENS ---
interface Evento {
  id: string;
  title: string;
  date: string; // Formato YYYY-MM-DD
  location: string;
}

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAeymmxS6TbSTZwTF8VwfPTrMWzdJLqsOY",
  authDomain: "mizaagenda.firebaseapp.com",
  databaseURL: "https://mizaagenda-default-rtdb.firebaseio.com",
  projectId: "mizaagenda",
  storageBucket: "mizaagenda.firebasestorage.app",
  messagingSenderId: "368316809762",
  appId: "1:368316809762:web:a04b98528804f96c59407b",
  measurementId: "G-VLNY8V64R5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CONSTANTES ---
const MONTHS_FILTER = [
  { value: 'all', label: 'Todos' },
  { value: '01', label: 'JAN' }, { value: '02', label: 'FEV' },
  { value: '03', label: 'MAR' }, { value: '04', label: 'ABR' },
  { value: '05', label: 'MAI' }, { value: '06', label: 'JUN' },
  { value: '07', label: 'JUL' }, { value: '08', label: 'AGO' },
  { value: '09', label: 'SET' }, { value: '10', label: 'OUT' },
  { value: '11', label: 'NOV' }, { value: '12', label: 'DEZ' },
];

export default function MizaUltraLuxury() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agenda, setAgenda] = useState<Evento[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado do Filtro de Mês
  const [filterMonth, setFilterMonth] = useState('all');

  const videos = [
    { id: "video1", thumb: "/galeria-1.jpeg", src: "/video1.mp4", type: "local" },
    { id: "yt1", thumb: "/galeria-2.jpeg", src: "/video2.mp4", type: "local" },
    { id: "yt2", thumb: "/galeria-3.jpeg", src: "/video3.mp4", type: "local" },
    { id: "yt3", thumb: "/galeria-4.jpeg", src: "/video4.mp4", type: "local" },
  ];

  // --- ADMIN MODE ---
  const [adminMode, setAdminMode] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFooterClick = () => {
    setClickCount(prev => prev + 1);
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => setClickCount(0), 1000);
    if (clickCount + 1 === 5) {
      const password = prompt("Digite a senha do Admin:");
      if (password === "miza2025") {
        setAdminMode(true);
        alert("Modo Admin ativado! Role até a Agenda para adicionar eventos.");
      } else {
        alert("Senha incorreta!");
      }
      setClickCount(0);
    }
  };

  // --- FUNÇÕES DE AGENDA ---
  const [eventoForm, setEventoForm] = useState({ title: '', date: '', location: '' });

  const handleAddEvento = async () => {
    if (!eventoForm.title || !eventoForm.date || !eventoForm.location) {
      alert("Por favor, preencha todos os campos do evento.");
      return;
    }

    try {
      await addDoc(collection(db, 'agenda'), {
        title: eventoForm.title,
        date: eventoForm.date,
        location: eventoForm.location
      });

      alert("Evento adicionado com sucesso!");
      setEventoForm({ title: '', date: '', location: '' });
    } catch (err: any) {
      console.error('ERRO AO ADICIONAR:', err);
      if (err.code === 'permission-denied') {
        alert("ERRO: Permissão negada! Verifique as regras do Firestore no Console do Firebase.");
      } else {
        alert("Erro ao salvar: " + err.message);
      }
    }
  };

  const removeEvento = async (id: string) => {
    if (!confirm("Deseja realmente excluir este evento permanentemente?")) return;
    setAgenda(prev => prev.filter(ev => ev.id !== id));
    try {
      await deleteDoc(doc(db, 'agenda', id));
    } catch (err) {
      console.warn('Erro ao remover evento do Firebase:', err);
      alert("Erro ao remover do banco de dados.");
    }
  };

  const formatDateBr = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // --- FETCH AGENDA (Load Data) ---
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const q = query(
      collection(db, 'agenda'), 
      where('date', '>=', todayStr), 
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events: Evento[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Evento, 'id'>)
      }));
      setAgenda(events);
    }, (error) => {
      console.error('ERRO DE LEITURA (SNAPSHOT):', error);
      if (error.message.includes("requires an index")) {
        console.error("VOCÊ PRECISA CRIAR UM ÍNDICE NO FIREBASE.");
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredAgenda = agenda.filter(evento => {
    if (filterMonth === 'all') return true;
    const eventMonth = evento.date.split('-')[1];
    return eventMonth === filterMonth;
  });

  // --- SCROLL NAVBAR ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- WHATSAPP FORM ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const phoneNumber = "5519992465605";
    const message = encodeURIComponent(
      `*Novo Orçamento via Site*\n\n*Nome:* ${formData.name}\n*Telefone:* ${formData.phone}\n*Email:* ${formData.email}\n\n*Mensagem:*\n${formData.message}`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');

    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: '', phone: '', email: '', message: '' });
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden">
      {/* Estilos globais */}
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800&family=Manrope:wght@200;300;400;500;700&display=swap');
          
          :root {
            --gold-gradient: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
          }

          .font-display { font-family: 'Cinzel', serif; }
          .font-body { font-family: 'Manrope', sans-serif; }

          .gold-text {
            background: var(--gold-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 300% 300%;
            animation: shine 6s linear infinite;
          }

          .gold-border {
             border-image: var(--gold-gradient);
             border-image-slice: 1;
          }

          .bg-noise {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
          }

          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          @keyframes shine {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* Background Noise Texture */}
      <div className="fixed inset-0 bg-noise pointer-events-none z-0 mix-blend-overlay"></div>

      {/* --- Navbar Premium --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${scrolled ? 'bg-black/80 backdrop-blur-lg border-white/10 py-4' : 'bg-transparent border-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-xl md:text-2xl font-display font-bold tracking-[0.2em] text-white flex items-center gap-2 z-50">
            <img src="/LOGO.png" alt="MIZA" className="h-8 md:h-10 w-auto" />
            <span className="text-amber-500"></span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <a href="#about" className="hover:text-amber-400 transition-colors">Sobre</a>
            <a href="#services" className="hover:text-amber-400 transition-colors">Serviços</a>
            <a href="#gallery" className="hover:text-amber-400 transition-colors">Galeria</a>
            <a href="#downloads" className="hover:text-amber-400 transition-colors">Downloads</a>
            <a href="#contact" className="px-6 py-2 border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-black transition-all rounded-sm">
              Contato
            </a>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-white z-50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-0 left-0 w-full h-screen bg-black/95 backdrop-blur-xl border-b border-zinc-800 p-8 flex flex-col items-center justify-center gap-8 md:hidden z-40">
             <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display text-white hover:text-amber-500">Sobre</a>
             <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display text-white hover:text-amber-500">Serviços</a>
             <a href="#gallery" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display text-white hover:text-amber-500">Galeria</a>
             <a href="#downloads" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display text-white hover:text-amber-500">Downloads</a>
             <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-amber-500 font-bold uppercase text-xl pt-4 border border-amber-500 px-8 py-3 rounded-sm">Entre em contato</a>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative min-h-screen flex items-center justify-center pt-24 md:pt-20 overflow-hidden">
        {/* Abstract Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-amber-600/10 rounded-full blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-purple-900/10 rounded-full blur-[80px] md:blur-[120px]" />

        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Column */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left order-1 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-[10px] uppercase tracking-[0.2em] font-bold mx-auto lg:mx-0">
              <Star size={10} className="fill-amber-400" /> Professional DJ
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-medium leading-[1.1] md:leading-[0.9] tracking-tight">
              O MAESTRO <br />
              DAS <span className="gold-text font-black">FREQUÊNCIAS</span>
            </h1>
            
            <p className="text-zinc-400 font-body text-base md:text-lg lg:text-xl max-w-xl leading-relaxed border-none lg:border-l-2 lg:border-amber-500/30 lg:pl-6 mx-auto lg:mx-0">
              10 anos de carreira criando atmosferas únicas. <br className="hidden md:block" />
              Especialista em elevar o nível de grandes eventos sociais.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <button className="bg-gradient-to-r from-amber-600 to-amber-700 text-black px-8 py-4 font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-[0_0_30px_-5px_rgba(217,119,6,0.3)] w-full sm:w-auto">
                <a href="#contact">Solicitar Orçamento</a>
              </button>
              <button className="px-8 py-4 border border-zinc-700 text-white font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                <a href="#videos"> Ver Showreel</a>
              </button>
            </div>
          </div>

          {/* Hero Image / Dynamic Element */}
          <div className="lg:col-span-5 relative order-2 lg:order-2 w-full max-w-md mx-auto lg:max-w-full">
            <div className="relative w-full aspect-[3/4] rounded-sm border border-white/10 group  ">
               <div className="absolute inset-0">
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
                 <div className="w-full h-full flex items-center justify-center text-zinc-600 font-display bg-zinc-900">
                    <img src="/miza.png" alt="FOTO MIZA"  />
                 </div>
               </div>
               
               {/* Cards Flutuantes */}
               <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8 bg-black/60 backdrop-blur-md border border-white/10 p-4 md:p-6 animate-float z-20 rounded-lg">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-amber-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Próximo Nível</p>
                      <p className="text-white font-display text-lg md:text-xl">Eventos Premium</p>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500 flex items-center justify-center text-black">
                      <ArrowDown size={18} />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50 z-20">
          <span className="text-[9px] md:text-[10px] uppercase tracking-widest">Role para explorar</span>
          <ArrowDown size={14} />
        </div>
      </header>

      {/* --- SOBRE (Responsivo: Texto Centralizado no Mobile, Esquerda no Desktop) --- */}
      <section id="about" className="py-24 md:py-32 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-center">
            
            {/* Lado Imagem (Primeiro no Mobile) */}
            <div className="w-full md:w-1/2 order-1 md:order-1">
                <div className="aspect-square bg-zinc-900 border border-zinc-800 rounded-lg relative max-w-md mx-auto md:max-w-full">
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-700 font-display text-sm">
                          <img src="/mia2.png" alt="FOTO MIZA" />
                    </div>
                </div>
            </div>

            {/* Lado Texto (Segundo no Mobile) */}
            <div className="w-full md:w-1/2 space-y-6 md:space-y-8 text-center md:text-left order-2 md:order-2">
              <h2 className="text-3xl md:text-5xl font-display leading-tight">
                Não é apenas tocar.<br/> 
                É <span className="text-amber-500">ler a alma</span> da festa.
              </h2>
              
              <div className="space-y-6 text-zinc-400 font-body leading-relaxed text-base md:text-lg">
                <p>
                  <strong className="text-white">MIZA</strong> é especialista em grandes eventos sociais. Com 10 anos de estrada, ele desenvolveu um sexto sentido para pistas de dança.
                </p>
                <p>
                  Sua técnica de mixagem Open Format permite transitar entre estilos com elegância, garantindo que avós e netos compartilhem a mesma euforia na pista.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 md:gap-6 border-t border-zinc-800 pt-8">
                <div>
                   <span className="block text-2xl md:text-4xl font-display text-white">10</span>
                   <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-amber-500">Anos</span>
                </div>
                <div>
                   <span className="block text-2xl md:text-4xl font-display text-white">500+</span>
                   <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-amber-500">Eventos</span>
                </div>
                <div>
                   <span className="block text-2xl md:text-4xl font-display text-white">100%</span>
                   <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-amber-500">Energia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- AGENDA --- */}
      <section id="agenda" className="py-24 bg-zinc-900/20 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">Próximos Eventos</h3>
            <h2 className="text-3xl md:text-5xl font-display text-white mb-8">Agenda</h2>

            {/* Filtro de Meses */}
            <div className="flex gap-2 overflow-x-auto pb-4 justify-start md:justify-center no-scrollbar mask-gradient">
              {MONTHS_FILTER.map((month) => (
                <button
                  key={month.value}
                  onClick={() => setFilterMonth(month.value)}
                  className={`
                    px-4 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border
                    ${filterMonth === month.value 
                      ? 'bg-amber-500 text-black border-amber-500' 
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-amber-500/50 hover:text-white'}
                  `}
                >
                  {month.label}
                </button>
              ))}
            </div>

            {/* Painel Admin */}
            {adminMode && (
              <div className="mt-6 flex flex-col md:flex-row justify-center md:justify-start gap-4 items-center border-t border-white/10 pt-6">
                <input
                  type="text"
                  placeholder="Título do evento"
                  value={eventoForm.title}
                  onChange={e => setEventoForm({ ...eventoForm, title: e.target.value })}
                  className="p-2 rounded bg-zinc-900 border border-zinc-700 text-white w-full md:w-auto"
                />
                <input
                  type="date"
                  value={eventoForm.date}
                  onChange={e => setEventoForm({ ...eventoForm, date: e.target.value })}
                  className="p-2 rounded bg-zinc-900 border border-zinc-700 text-white w-full md:w-auto"
                />
                <input
                  type="text"
                  placeholder="Local"
                  value={eventoForm.location}
                  onChange={e => setEventoForm({ ...eventoForm, location: e.target.value })}
                  className="p-2 rounded bg-zinc-900 border border-zinc-700 text-white w-full md:w-auto"
                />
                <button
                  onClick={handleAddEvento}
                  className="px-6 py-2 bg-amber-500 text-black font-bold rounded hover:bg-amber-400 transition-colors w-full md:w-auto"
                >
                  Adicionar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredAgenda.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-lg">
                  <p className="text-zinc-500 font-display text-lg">Nenhum evento futuro encontrado para este período.</p>
                  {adminMode && <p className="text-amber-500 text-xs mt-2">Dica: Se você acabou de adicionar, verifique se a data não é passada.</p>}
              </div>
            ) : (
              filteredAgenda.map((evento) => (
                <div key={evento.id} className="bg-zinc-800 border border-white/5 p-6 rounded-lg hover:border-amber-500 transition-all relative group">
                  {/* Destaque visual da data */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-display text-white leading-snug pr-4">{evento.title}</h3>
                    <div className="bg-zinc-900 border border-zinc-700 p-2 rounded text-center min-w-[60px]">
                      <span className="block text-amber-500 font-bold text-sm">
                        {evento.date.split('-')[2]}
                      </span>
                      <span className="block text-zinc-500 text-[10px] uppercase font-bold">
                        {MONTHS_FILTER.find(m => m.value === evento.date.split('-')[1])?.label || ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-amber-500/50"></span>
                       <strong>Data:</strong> {formatDateBr(evento.date)}
                    </p>
                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                       <strong>Local:</strong> {evento.location}
                    </p>
                  </div>

                  {adminMode && (
                    <button 
                      onClick={() => removeEvento(evento.id)} 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 text-xs border border-red-500 px-2 py-1 rounded hover:bg-red-500 hover:text-black transition-all"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- SERVIÇOS --- */}
      <section id="services" className="py-24 bg-zinc-900/30 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">Especialidades</h3>
            <h2 className="text-3xl md:text-5xl font-display text-white">Serviços Premium</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Card 1 */}
            <div className="group relative bg-[#0a0a0a] border border-white/5 p-8 md:p-10 hover:border-amber-500/30 transition-all duration-500 text-center md:text-left">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              <h3 className="text-xl md:text-2xl font-display mb-4 text-white group-hover:text-amber-500 transition-colors">Casamentos</h3>
              <p className="text-zinc-400 mb-6 leading-relaxed text-sm md:text-base">
                Proporcionamos uma experiência única e memorável, com uma seleção musical que atende a todos os gostos e cria a atmosfera perfeita para esse dia especial.
              </p>
              <a href="#contact" className="inline-flex justify-center md:justify-start items-center text-xs uppercase font-bold tracking-widest text-zinc-500 group-hover:text-white transition-colors w-full md:w-auto">
                Saiba mais <ChevronRight size={14} className="ml-2" />
              </a>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-[#0a0a0a] border border-white/5 p-8 md:p-10 hover:border-amber-500/30 transition-all duration-500 text-center md:text-left">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              <h3 className="text-xl md:text-2xl font-display mb-4 text-white group-hover:text-purple-400 transition-colors">15 Anos</h3>
              <p className="text-zinc-400 mb-6 leading-relaxed text-sm md:text-base">
                Deixe a festa inesquecível com playlist personalizada. Momentos de pura diversão e emoção garantidos para a aniversariante e seus convidados.
              </p>
              <a href="#contact" className="inline-flex justify-center md:justify-start items-center text-xs uppercase font-bold tracking-widest text-zinc-500 group-hover:text-white transition-colors w-full md:w-auto">
                Saiba mais <ChevronRight size={14} className="ml-2" />
              </a>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-[#0a0a0a] border border-white/5 p-8 md:p-10 hover:border-amber-500/30 transition-all duration-500 text-center md:text-left">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              <h3 className="text-xl md:text-2xl font-display mb-4 text-white group-hover:text-blue-400 transition-colors">Formaturas</h3>
              <p className="text-zinc-400 mb-6 leading-relaxed text-sm md:text-base">
                Celebre a conclusão de um ciclo com energia máxima. Seleção musical projetada para fazer todos dançarem até o amanhecer!
              </p>
              <a href="#contact" className="inline-flex justify-center md:justify-start items-center text-xs uppercase font-bold tracking-widest text-zinc-500 group-hover:text-white transition-colors w-full md:w-auto">
                Saiba mais <ChevronRight size={14} className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* --- GALERIA VÍDEOS (4 VÍDEOS) --- */}
     <section id="videos" className="py-24 bg-[#050505]">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-display mb-4 md:mb-0">Galeria de Fotos e Vídeos</h2>
          <div className="h-px bg-zinc-800 flex-grow ml-8 hidden md:block"></div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 h-auto md:h-[600px]">

          {videos.map((video, index) => (
            <div
              key={video.id}
              onClick={() => setActiveVideo(activeVideo === video.id ? null : video.id)}
              className={`
                bg-zinc-800 relative group overflow-hidden cursor-pointer
                ${index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}
                ${index === 3 ? "sm:col-span-2 md:row-span-1" : ""}
                aspect-square md:aspect-auto
              `}
            >
              {/* Se for o vídeo ativo → mostra player */}
              {activeVideo === video.id ? (
                video.type === "local" ? (
                  <video
                    src={video.src}
                    controls
                    autoPlay
                    playsInline // Adicionado: Melhora comportamento no iPhone
                    className="w-full h-full object-contain bg-black" // ALTERADO: object-contain para não cortar, bg-black para barras
                  />
                ) : (
                  <div className="w-full h-full bg-black">
                     <ReactPlayer
                        oEmbedUrl={video.src}
                        playing
                        controls
                        width="100%"
                        height="100%"
                        style={{ objectFit: 'contain' }} // Garante contain no ReactPlayer
                     />
                  </div>
                )
              ) : (
                <>
                  <img
                    src={`${video.thumb}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={`Thumbnail ${video.id}`}
                  />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-colors duration-500"></div>

                  <span className="absolute bottom-4 left-4 text-xs font-bold uppercase tracking-widest text-white z-10 pointer-events-none">
                    CLIQUE PARA ASSISTIR
                  </span>
                </>
              )}
            </div>
          ))}

        </div>

      </div>
    </section>

      {/* --- DOWNLOADS --- */}
      <section id="downloads" className="py-24 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-zinc-900 to-transparent -z-10"></div>

        <div className="container mx-auto px-6">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-display mb-4">Downloads & Presskit</h2>
            <p className="text-zinc-400">Área destinada a contratantes, produtores e imprensa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                title: 'Release', 
                subtitle: 'Biografia e Histórico', 
                icon: <CheckCircle2 />,
                link: '/MIZA-Rider-Release.pdf'
              },
              { 
                title: 'Rider Técnico', 
                subtitle: 'Mapa de palco e som', 
                icon: <Music />,
                link: '/MIZA-Rider-Técnico.pdf'
              },
              { 
                title: 'Presskit', 
                subtitle: 'Fotos e Logos (Drive)', 
                icon: <Download />,
                link: 'https://drive.google.com/drive/folders/1nAoLO2Z30Q2_lAd_ZDmMo53RwTJ-dFm8?usp=drive_link'
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-zinc-900/50 border border-white/5 p-8 flex flex-col justify-between group hover:bg-zinc-900 transition-colors rounded-sm text-center md:text-left">
                <div className="mb-8">
                  <div className="mb-4 text-amber-500 flex justify-center md:justify-start">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-500">{item.subtitle}</p>
                </div>
                
                <a 
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 border border-zinc-700 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors block text-center"
                >
                  Baixar Agora
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTATO & FOOTER --- */}
      <section id="contact" className="pt-24 bg-black border-t border-zinc-900">
        <div className="container mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-display mb-8">
                Vamos criar algo <br/> <span className="text-amber-500">Épico?</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-12 max-w-md mx-auto md:mx-0">
                Sua data é exclusiva. Entre em contato para verificar disponibilidade e garantir o melhor para seu evento.
              </p>
              
              <div className="space-y-6 flex flex-col items-center md:items-start">
                <a href="https://w.app/km39wg" className="flex items-center gap-4 text-lg md:text-xl hover:text-amber-500 transition-colors group">
                  <div className="w-10 h-10 md:w-12 md:h-12 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-amber-500 transition-colors">
                    <Phone size={20} />
                  </div>
                  <span>(19) 99246-5605</span>
                </a>
                <a href="mailto:djmizaeventos@hotmail.com" className="flex items-center gap-4 text-lg md:text-xl hover:text-amber-500 transition-colors group">
                  <div className="w-10 h-10 md:w-12 md:h-12 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-amber-500 transition-colors">
                    <Mail size={20} />
                  </div>
                  <span>djmizaeventos@hotmail.com</span>
                </a>
                <a href="https://www.instagram.com/miza.dj/" className="flex items-center gap-4 text-lg md:text-xl hover:text-amber-500 transition-colors group">
                  <div className="w-10 h-10 md:w-12 md:h-12 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-amber-500 transition-colors">
                    <Instagram size={20} />
                  </div>
                  <span>@miza.dj</span>
                </a>
              </div>
            </div>

            <div className="bg-zinc-900 p-8 md:p-12 border border-zinc-800 rounded-sm">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Nome</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-black border border-zinc-800 p-4 text-white focus:border-amber-500 focus:outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Telefone</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-black border border-zinc-800 p-4 text-white focus:border-amber-500 focus:outline-none transition-colors" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-zinc-800 p-4 text-white focus:border-amber-500 focus:outline-none transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Mensagem</label>
                  <textarea 
                    rows={4} 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-black border border-zinc-800 p-4 text-white focus:border-amber-500 focus:outline-none transition-colors"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-5 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Redirecionando...' : (
                    <>Enviar via WhatsApp <Send size={18} /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* --- RODAPÉ / CREDITS --- */}
        <div className="border-t border-zinc-900 bg-[#020202] py-8">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600 text-center md:text-left">
            <p onClick={handleFooterClick} className="cursor-pointer hover:text-amber-500 select-none">© 2025 MIZA DJ. Todos os direitos reservados.</p>

            
            <div className="flex items-center justify-center md:justify-end gap-2 group cursor-pointer hover:text-zinc-400 transition-colors">
              <span>Desenvolvido por</span>
              <span className="font-bold text-zinc-500 group-hover:text-amber-500 transition-colors uppercase tracking-wider">
                Matteo Bonvento
              </span>
              <span className="hidden md:inline">| @codebymatteo</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}