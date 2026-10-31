import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Bot, SlidersHorizontal, Phone, Sparkles, Plus, 
  Mic, ArrowUp, Moon, Sun, Trash2, Store, Award, 
  CheckCircle, AlertTriangle, ArrowRight, X, ChevronRight, 
  Laptop, Smartphone, Headphones, Watch, Zap, Cpu, HardDrive, Monitor, Battery, Camera, ShieldCheck, RefreshCw
} from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:8000';

// Universal Helper to parse prices (handles 53500, "53500", "₹53,500", "54,990", etc.)
function parsePrice(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Universal Helper to format prices cleanly with exactly ONE ₹ symbol
function formatPrice(val) {
  const num = parsePrice(val);
  if (!num) return '';
  return `₹${num.toLocaleString('en-IN')}`;
}

// Helper to get clean display title for past search sessions (resolves old "Tech Dalal" titles to user's query)
function getSessionDisplayTitle(session) {
  if (session.title && session.title !== 'Tech Dalal') {
    return session.title;
  }
  const firstUserMsg = (session.messages || []).find(m => m.role === 'user');
  if (firstUserMsg && firstUserMsg.text) {
    const q = firstUserMsg.text.trim();
    return q.length > 28 ? q.slice(0, 28) + '...' : q;
  }
  return session.title || 'Recent Search';
}

// Universal Product Normalizer: maps database rows from database.py into clean UI props
function normalizeProduct(prod) {
  if (!prod) return {};

  const priceNum = parsePrice(prod.price || prod.store_price);
  const onlineNum = parsePrice(prod.online_price || prod.mrp);
  const savingsNum = (onlineNum > priceNum && priceNum > 0) ? (onlineNum - priceNum) : 0;

  // Raw specs fallback string
  const specsStr = prod.specs || prod.description || prod.specs_summary || '';
  
  // 1. Processor / Chip extraction
  let processor = prod.processor || prod.cpu || '';
  if (!processor && specsStr) {
    const ramIdx = specsStr.search(/,\s*\d+\s*GB\s+RAM/i);
    if (ramIdx > 0) {
      processor = specsStr.substring(0, ramIdx).trim();
    } else {
      processor = specsStr.split(',')[0].trim();
    }
  }

  // 2. RAM extraction (ensures no false matches with GPU VRAM like "4GB GDDR6")
  let ram = prod.ram_gb || prod.ram || '';
  if (!ram && specsStr) {
    const ramMatch = specsStr.match(/(\d+)\s*GB\s+(?:RAM|Memory|Unified|DDR|LPDDR)/i) || 
                     specsStr.match(/(?:RAM|Memory):\s*(\d+)\s*GB/i);
    if (ramMatch) ram = ramMatch[1];
  }
  const ramDisplay = ram ? (String(ram).toLowerCase().includes('gb') ? String(ram) : `${ram}GB`) : '';

  // 3. Storage extraction
  let storage = prod.storage_gb || prod.storage || '';
  if (!storage && specsStr) {
    const storageMatch = specsStr.match(/(\d+\s*(?:GB|TB))\s*(?:Storage|SSD|NVMe|ROM|PCIe)/i) ||
                         specsStr.match(/(?:Storage|SSD|ROM):\s*(\d+\s*(?:GB|TB))/i);
    if (storageMatch) storage = storageMatch[1];
  }
  const storageDisplay = storage ? (String(storage).toLowerCase().includes('gb') || String(storage).toLowerCase().includes('tb') ? String(storage) : `${storage}GB`) : '';

  // 4. Dealer and Area extraction
  let dealerName = prod.dealer_name || prod.dealer || 'Bareilly Verified Store';
  let dealerArea = prod.dealer_area || '';
  if (!dealerArea && dealerName.includes('(') && dealerName.includes(')')) {
    const match = dealerName.match(/(.*?)\s*\((.*?)\)/);
    if (match) {
      dealerName = match[1].trim();
      dealerArea = match[2].trim();
    }
  }

  return {
    ...prod,
    id: prod.id || Math.random(),
    name: prod.name || 'Verified Gadget',
    category: prod.category || 'Gadgets',
    rating: prod.rating || 4.5,
    price: priceNum,
    online_price: onlineNum,
    savings: savingsNum,
    formatted_price: formatPrice(priceNum),
    formatted_online_price: formatPrice(onlineNum),
    formatted_savings: savingsNum > 0 ? formatPrice(savingsNum) : '',
    processor: processor || specsStr || 'Hardware specs verified by local dealer',
    ram: ramDisplay,
    storage: storageDisplay,
    display_specs: prod.display_specs || '',
    upgrade_info: prod.upgrade_info || '',
    camera_specs: prod.camera_specs || '',
    battery_specs: prod.battery_specs || '',
    dealer_name: dealerName,
    dealer_area: dealerArea || 'Bareilly',
    dealer_contact: prod.dealer_contact || prod.contact || '+91-9837123456'
  };
}

// Technical Evaluation & Dalal's Choice Verdict Engine across all categories
function evaluateDalalsChoice(products) {
  if (!products || products.length < 2) return null;

  // 1. Cross-Category Check
  const categories = [...new Set(products.map(p => p.category))];
  if (categories.length > 1) {
    return {
      isCrossCategory: true,
      categories,
      message: `You have selected devices from different categories (${categories.join(' & ')}). A ${categories[0].toLowerCase()} cannot be technically evaluated against a ${categories[1].toLowerCase()}! To get an accurate Dalal's Choice recommendation, please select products from the same category (e.g. all ${categories[0]}).`
    };
  }

  const category = categories[0];

  // 2. Hardware attribute scoring
  const scored = products.map(p => {
    let score = 0;
    const bullets = [];
    const proc = (p.processor || '').toLowerCase();
    const disp = (p.display_specs || '').toLowerCase();
    const upg = (p.upgrade_info || '').toLowerCase();
    const cam = (p.camera_specs || '').toLowerCase();
    const bat = (p.battery_specs || '').toLowerCase();
    const allText = `${proc} ${disp} ${upg} ${cam} ${bat}`.toLowerCase();
    const ram = parsePrice(p.ram) || 8;
    const savings = p.savings || 0;

    if (category === 'Laptops') {
      if (proc.includes('rtx 4050') || proc.includes('rtx 4060')) {
        score += 45;
        bullets.push({ icon: 'zap', label: 'Flagship RTX Graphics', desc: 'Equipped with NVIDIA RTX 40-Series GPU featuring DLSS 3.5 & hardware ray-tracing.' });
      } else if (proc.includes('rtx 3050') || proc.includes('rtx 2050') || proc.includes('gpu')) {
        score += 35;
        bullets.push({ icon: 'zap', label: 'Dedicated Graphics Power', desc: 'Dedicated NVIDIA GPU delivers 4x faster 3D modeling, rendering & high-FPS gaming compared to integrated graphics.' });
      } else if (proc.includes('ultra 5') || proc.includes('m3') || proc.includes('m2') || proc.includes('13420h') || proc.includes('12450hx')) {
        score += 30;
        bullets.push({ icon: 'cpu', label: 'High-Wattage Computing Core', desc: 'High-performance CPU handles intensive compiling, multitasking & scientific simulations with ease.' });
      } else if (proc.includes('i5') || proc.includes('ryzen 5')) {
        score += 22;
        bullets.push({ icon: 'cpu', label: 'Smooth Multi-Core CPU', desc: 'Multi-threaded processor delivers reliable everyday performance for coding and office productivity.' });
      } else {
        score += 14;
        bullets.push({ icon: 'cpu', label: 'Everyday Computing', desc: 'Power-efficient CPU capable for web browsing, document drafting, and online classes.' });
      }

      if (ram >= 16) {
        score += 22;
        bullets.push({ icon: 'hard-drive', label: '16GB High-Speed RAM Pre-installed', desc: 'Ready out-of-the-box for heavy multitasking, IDEs, and coding projects without memory lag.' });
      } else {
        score += 10;
      }

      if (upg.includes('32gb')) {
        score += 18;
        bullets.push({ icon: 'hard-drive', label: '32GB Future-Proof Expansion', desc: 'Dual accessible SO-DIMM slots allow memory expansion up to 32GB RAM plus extra storage slots.' });
      } else if (upg.includes('16gb') || upg.includes('dual')) {
        score += 10;
        bullets.push({ icon: 'hard-drive', label: 'Upgradable Memory Slot', desc: 'Modular RAM slot allows upgrading as project demands grow.' });
      }

      if (disp.includes('144hz') || disp.includes('165hz') || disp.includes('120hz')) {
        score += 15;
        bullets.push({ icon: 'monitor', label: 'Fluid 120Hz+ Display', desc: 'High-refresh-rate panel eliminates cursor stutter and reduces eye strain during extended work sessions.' });
      } else if (disp.includes('oled') || disp.includes('retina')) {
        score += 18;
        bullets.push({ icon: 'monitor', label: 'Premium High-Res Visuals', desc: 'Ultra-vibrant panel with exceptional pixel density and wide color gamut for creative accuracy.' });
      }

    } else if (category === 'Smartphones') {
      if (proc.includes('8 gen 3') || proc.includes('a16') || proc.includes('a17') || proc.includes('8 gen 2') || proc.includes('dimensity 9200')) {
        score += 40;
        bullets.push({ icon: 'zap', label: 'Flagship Processing Power', desc: 'Industry-leading 4nm SoC delivers flagship AnTuTu scores, ultra-fast app launches, and zero thermal throttling.' });
      } else if (proc.includes('7 gen 3') || proc.includes('7s gen 2') || proc.includes('7200')) {
        score += 30;
        bullets.push({ icon: 'cpu', label: 'High-Efficiency Upper-Mid Chipset', desc: 'Advanced 4nm architecture provides near-flagship responsiveness with remarkable battery endurance.' });
      } else {
        score += 18;
        bullets.push({ icon: 'cpu', label: 'Solid 5G Daily Driver', desc: 'Reliable multi-core performance for social media, streaming, and daily multitasking.' });
      }

      if (cam.includes('ois') && (cam.includes('telephoto') || cam.includes('periscope') || cam.includes('gimbal'))) {
        score += 25;
        bullets.push({ icon: 'camera', label: 'Professional Versatile Optics', desc: 'Equipped with Optical Image Stabilization (OIS) plus a dedicated optical telephoto portrait lens.' });
      } else if (cam.includes('ois') || cam.includes('sony lyt') || cam.includes('sony imx')) {
        score += 18;
        bullets.push({ icon: 'camera', label: 'OIS Stabilized Camera', desc: 'Hardware Optical Image Stabilization ensures crisp night photography and shake-free 4K video recording.' });
      }

      if (disp.includes('165hz') || disp.includes('144hz') || disp.includes('120hz')) {
        score += 15;
        bullets.push({ icon: 'monitor', label: '120Hz+ High Refresh AMOLED', desc: 'Silky-smooth 120Hz refresh rate and deep true blacks with HDR support.' });
      }

      if (bat.includes('120w') || bat.includes('100w') || bat.includes('125w') || bat.includes('67w') || bat.includes('65w')) {
        score += 18;
        bullets.push({ icon: 'battery', label: 'Hyper-Fast Charging', desc: 'High-wattage fast charging delivers an all-day battery charge in approximately 30 minutes.' });
      }

    } else if (category === 'Headphones') {
      if (allText.includes('qn1') || allText.includes('v1') || allText.includes('h2') || allText.includes('active noise cancellation') || allText.includes('anc')) {
        score += 40;
        bullets.push({ icon: 'zap', label: 'Class-Leading Active Noise Cancellation', desc: 'Hardware ANC processors effectively silence ambient commuter drone and background noise.' });
      }
      if (allText.includes('ldac') || allText.includes('hi-res') || allText.includes('spatial audio') || allText.includes('dynaudio') || allText.includes('aptx')) {
        score += 30;
        bullets.push({ icon: 'monitor', label: 'Studio-Grade Acoustic Tuning', desc: 'High-resolution wireless audio streaming with wide spatial soundstage and punchy bass.' });
      }
      if (allText.includes('60 hours') || allText.includes('39 hours') || allText.includes('30 hours')) {
        score += 20;
        bullets.push({ icon: 'battery', label: 'Marathon Battery Endurance', desc: 'Extended 30h+ listening time on a single charge with rapid top-up charging.' });
      }
      if (allText.includes('ip54') || allText.includes('ip55') || allText.includes('multipoint') || allText.includes('leather')) {
        score += 10;
        bullets.push({ icon: 'shield-check', label: 'Ergonomic Premium Build', desc: 'Water/sweat-resistant certification with plush memory foam earcups for all-day comfort.' });
      }

    } else if (category === 'Smartwatches') {
      if (allText.includes('ecg') || allText.includes('bioactive') || allText.includes('gps') || allText.includes('sensor')) {
        score += 40;
        bullets.push({ icon: 'zap', label: 'Comprehensive Health & Biometrics', desc: 'Clinical-grade sensor suite tracking ECG, heart rate, sleep quality, and GPS route workouts.' });
      }
      if (allText.includes('sapphire') || allText.includes('amoled') || allText.includes('retina')) {
        score += 30;
        bullets.push({ icon: 'monitor', label: 'Scratch-Proof Vibrant AMOLED', desc: 'Sapphire crystal glass screen with ultra-bright outdoor visibility up to 1000 nits.' });
      }
      if (allText.includes('100 hours') || allText.includes('36 hours') || allText.includes('fast charging')) {
        score += 20;
        bullets.push({ icon: 'battery', label: 'Multi-Day Battery Performance', desc: 'Intelligent power-efficient architecture delivers extended battery life between charges.' });
      }
    }

    if (savings > 0) {
      score += 12;
      bullets.push({
        icon: 'store',
        label: `Bareilly Store Deal: Save ${p.formatted_savings}`,
        desc: `Available in Bareilly at ${p.dealer_name} (${p.dealer_area}) below online prices with official local warranty.`
      });
    }

    return { product: p, score, bullets };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    isCrossCategory: false,
    winner: scored[0],
    runnerUp: scored.length > 1 ? scored[1] : null,
    allScored: scored
  };
}

function FormattedText({ text, isDarkMode }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className={`space-y-1.5 leading-relaxed text-sm text-left ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                const clean = part.slice(2, -2).replace(/\*/g, '');
                return <strong key={pIdx} className={isDarkMode ? 'text-sky-400 font-bold' : 'text-blue-700 font-bold'}>{clean}</strong>;
              }
              return part.replace(/\*/g, '');
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'matrix'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persistent Theme State from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('tech_dalal_theme');
      if (savedTheme !== null) {
        return savedTheme === 'dark';
      }
      return false; // Default to clean light mode if no prior selection
    } catch {
      return false;
    }
  });

  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeContextProductId, setActiveContextProductId] = useState(null);

  // Transition & Entrance Effect State (First-time visit & reload transition)
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Spec Matrix State: loaded directly from backend/database.py via /api/products
  const [productsList, setProductsList] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Persistent Chat Sessions in localStorage
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tech_dalal_react_sessions')) || [];
    } catch {
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const scrollRef = useRef(null);

  // Set document title strictly to Tech Dalal
  useEffect(() => {
    document.title = "Tech Dalal";
  }, []);

  // First-time visit / reload entrance transition trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Interactive Mouse Spotlight Glowing Effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const glow = document.getElementById('cursorGlow');
      if (glow) {
        glow.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Theme synchronization & persistence in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tech_dalal_theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.warn("Could not save theme to localStorage:", e);
    }

    document.body.classList.toggle('light-mode', !isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch live products directly from backend/database.py via /api/products
  const fetchProductsFromBackend = () => {
    setIsLoadingProducts(true);
    axios.get(`${BACKEND_URL}/api/products`)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map(normalizeProduct);
          setProductsList(normalized);
          // Auto-select the first 3 products for immediate comparison
          setSelectedProductIds(prev => prev.length === 0 ? normalized.slice(0, 3).map(p => p.id) : prev);
        }
      })
      .catch(err => {
        console.error("Could not fetch products from backend:", err);
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  };

  useEffect(() => {
    fetchProductsFromBackend();
  }, []);

  // Smooth auto-scroll in chat
  useEffect(() => {
    if (scrollRef.current && currentView === 'chat') {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading, currentView]);

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setActiveContextProductId(null);
    setHasStartedChat(false);
    setMessages([]);
    setInput('');
    setCurrentView('chat');
  };

  const saveSessionToStorage = (sessionId, title, newMessages) => {
    setChatSessions(prevSessions => {
      const exists = prevSessions.some(s => s.id === sessionId);
      let updated;
      if (exists) {
        updated = prevSessions.map(s => s.id === sessionId ? { ...s, messages: newMessages, title: title } : s);
      } else {
        updated = [{ id: sessionId, title: title, messages: newMessages }, ...prevSessions];
      }
      localStorage.setItem('tech_dalal_react_sessions', JSON.stringify(updated));
      return updated;
    });
  };

  const sendQuery = async (queryTextOverride) => {
    const query = (queryTextOverride || input).trim();
    if (!query) return;

    if (currentView !== 'chat') setCurrentView('chat');

    let sessionId = currentSessionId;
    // Save session title using the user's actual search query
    let sessionTitle = query.length > 28 ? query.slice(0, 28) + '...' : query;

    if (!sessionId) {
      sessionId = 'session_' + Date.now();
      setCurrentSessionId(sessionId);
    } else {
      const existing = chatSessions.find(s => s.id === sessionId);
      if (existing?.title && existing.title !== 'Tech Dalal') {
        sessionTitle = existing.title;
      }
    }

    if (!hasStartedChat) setHasStartedChat(true);

    const userMsg = { role: 'user', text: query };
    const currentMsgsWithUser = [...messages, userMsg];
    setMessages(currentMsgsWithUser);
    setInput('');
    setIsLoading(true);

    saveSessionToStorage(sessionId, sessionTitle, currentMsgsWithUser);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/recommend`, {
        prompt: query,
        context_product_id: activeContextProductId
      });

      const data = res.data;
      const rawRecs = Array.isArray(data.recommendations) ? data.recommendations : [];
      const cleanRecs = rawRecs.map(normalizeProduct);

      if (cleanRecs.length > 0) {
        setActiveContextProductId(cleanRecs[0].id);
      }

      const botMessage = {
        role: 'assistant',
        commentary: data.ai_commentary || 'Here are the best verified gadget choices based on your criteria:',
        recommendations: cleanRecs,
        followUps: data.follow_ups || []
      };

      const finalMsgs = [...currentMsgsWithUser, botMessage];
      setMessages(finalMsgs);
      saveSessionToStorage(sessionId, sessionTitle, finalMsgs);

    } catch (err) {
      const errorMsg = { 
        role: 'assistant', 
        commentary: 'Could not connect to FastAPI server at http://127.0.0.1:8000. Please ensure the backend is running with `uvicorn main:app --reload`.' 
      };
      const finalMsgs = [...currentMsgsWithUser, errorMsg];
      setMessages(finalMsgs);
      saveSessionToStorage(sessionId, sessionTitle, finalMsgs);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setHasStartedChat(true);
    setMessages(session.messages || []);
    setCurrentView('chat');
    
    const lastBot = [...(session.messages || [])].reverse().find(m => m.role === 'assistant');
    if (lastBot?.recommendations?.length > 0) {
      setActiveContextProductId(lastBot.recommendations[0].id);
    } else {
      setActiveContextProductId(null);
    }
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    setChatSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('tech_dalal_react_sessions', JSON.stringify(updated));
      return updated;
    });
    if (currentSessionId === id) {
      startNewChat();
    }
  };

  // Spec Matrix Handlers
  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= 3) {
          alert("You can compare up to 3 products at a time in the Spec Matrix.");
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const removeComparedProduct = (productId) => {
    setSelectedProductIds(prev => prev.filter(id => id !== productId));
  };

  const clearAllCompared = () => {
    setSelectedProductIds([]);
  };

  // Dynamically derive all available categories directly from database products
  const availableCategories = ['all', ...Array.from(new Set(productsList.map(p => p.category).filter(Boolean)))];

  // Filter products for Matrix catalog list
  const filteredMatrixProducts = productsList.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchFilter.toLowerCase();
    const matchesSearch = !query || 
      p.name?.toLowerCase().includes(query) || 
      (p.processor && p.processor.toLowerCase().includes(query)) ||
      (p.brand && p.brand.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  const comparedProducts = productsList.filter(p => selectedProductIds.includes(p.id));
  const dalalsVerdict = evaluateDalalsChoice(comparedProducts);

  return (
    <div className={`min-h-screen w-full flex flex-col ${
      isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'
    } overflow-x-hidden relative transition-colors duration-300`}>
      
      {/* Interactive Mouse Spotlight Glowing Effect */}
      <div 
        id="cursorGlow" 
        className={`pointer-events-none fixed w-[500px] h-[500px] rounded-full blur-[110px] transition-transform duration-75 ease-out z-0 ${
          isDarkMode ? 'bg-blue-500/15' : 'bg-blue-400/15'
        }`}
      ></div>

      {/* Top Navigation Bar */}
      <header className={`w-full h-16 border-b flex items-center justify-between px-4 sm:px-6 z-40 backdrop-blur-md sticky top-0 transition-colors ${
        isDarkMode ? 'bg-[#0f172a]/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-xl transition ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Toggle Sidebar"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentView('chat')}>
            <img 
              src="/logo.png" 
              alt="Tech Dalal" 
              className={`w-9 h-9 rounded-xl object-contain border p-0.5 shadow-sm transition ${
                isDarkMode ? 'border-sky-500/40 bg-slate-800' : 'border-blue-300 bg-blue-50'
              }`} 
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xl font-black tracking-tight ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm' 
                    : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 bg-clip-text text-transparent'
                }`}>
                  Tech Dalal
                </span>
                <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${
                  isDarkMode 
                    ? 'bg-blue-500/15 text-sky-300 border-blue-500/30' 
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}>
                  Bareilly
                </span>
              </div>
              <p className={`text-[10px] hidden sm:block font-medium ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Local Tech Scout & Spec Showdown
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher: AI Advisor vs Spec Matrix */}
        <div className={`flex items-center space-x-1 p-1 rounded-xl border shadow-sm transition-colors ${
          isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              currentView === 'chat'
                ? isDarkMode ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>💬 AI Advisor</span>
          </button>
          <button
            onClick={() => setCurrentView('matrix')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              currentView === 'matrix'
                ? isDarkMode ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>📊 Spec Matrix</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl transition border shadow-sm ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar Drawer */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar Drawer */}
        <aside className={`fixed inset-y-16 left-0 w-72 z-30 flex flex-col justify-between p-4 backdrop-blur-xl border-r transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDarkMode ? 'bg-[#0f172a]/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-xl'}`}>
          <div className="space-y-4">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-400 hover:bg-blue-500 text-white font-semibold text-sm shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Search</span>
            </button>

            <div>
              <p className={`text-xs font-bold uppercase tracking-wider px-2 mb-2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Recent Searches
              </p>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {chatSessions.length === 0 ? (
                  <p className={`text-xs px-2 py-3 italic ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    No recent searches yet. Ask anything in chat!
                  </p>
                ) : (
                  chatSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                        currentSessionId === session.id
                          ? isDarkMode ? 'bg-blue-600/20 text-sky-400 font-semibold' : 'bg-blue-100 text-blue-700 font-semibold'
                          : isDarkMode ? 'text-slate-300 hover:bg-slate-800/80' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">
                        {getSessionDisplayTitle(session)}
                      </span>
                      <button
                        onClick={(e) => deleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-1 transition"
                        title="Delete search"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={`pt-4 border-t text-xs ${
            isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center space-x-2">
              <Store className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold">Bareilly Verified Store Network</span>
            </div>
            <p className="text-[11px] mt-1 opacity-80">
              Civil Lines, DD Puram, Station Road, Ayub Khan Chauraha
            </p>
          </div>
        </aside>

        {/* View 1: 💬 AI Advisor Chat */}
        {currentView === 'chat' && (
          <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full px-4 sm:px-6 relative z-10">
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-6">
              
              {/* Centered Hero with First-Time Visit / Reload Transition Effect */}
              {!hasStartedChat && messages.length === 0 && (
                <div className={`flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 transition-all duration-700 ease-out transform ${
                  isPageLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                }`}>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/25 animate-pulse">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                    <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>

                  <div className="space-y-2">
                    <h1 className={`text-3xl sm:text-4xl font-black tracking-tight transition-colors ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      Hello, Gadget Hunter
                    </h1>
                    <p className={`text-base font-medium max-w-md mx-auto transition-colors ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      What tech gadget should we find today?
                    </p>
                  </div>

                  {/* Suggestion Pills: Covering all categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl w-full pt-4">
                    {[
                      "Best laptop for CSE engineering student",
                      "Best noise cancelling headphones with ANC",
                      "Check local store discount in Bareilly",
                      "Smartwatch with ECG and long battery"
                    ].map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendQuery(pill)}
                        className={`text-left p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between group ${
                          isDarkMode
                            ? 'bg-[#1e293b]/80 border-slate-700/60 text-slate-200 hover:border-blue-500 hover:bg-[#1e293b] hover:text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-900 shadow-sm'
                        }`}
                      >
                        <span>{pill}</span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Message Stream */}
              {messages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                  {msg.role === 'user' ? (
                    <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-xl text-sm font-semibold shadow-md">
                      {msg.text}
                    </div>
                  ) : (
                    <div className={`w-full rounded-2xl border p-5 space-y-4 shadow-sm transition-colors ${
                      isDarkMode ? 'bg-[#1e293b]/90 border-slate-700/60' : 'bg-white border-slate-200'
                    }`}>
                      {/* Name of Conversation Header: STRICTLY "Tech Dalal" */}
                      <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5 text-blue-500" />
                        <span className={`text-xs font-black uppercase tracking-wider ${
                          isDarkMode ? 'text-sky-400' : 'text-blue-700'
                        }`}>
                          Tech Dalal
                        </span>
                      </div>

                      {/* Commentary Text */}
                      <FormattedText text={msg.commentary} isDarkMode={isDarkMode} />

                      {/* Product Recommendations Cards */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {msg.recommendations.map((prod, pIdx) => (
                            <div
                              key={prod.id || pIdx}
                              className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition hover:shadow-md ${
                                isDarkMode ? 'bg-[#0f172a]/80 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                      isDarkMode 
                                        ? 'bg-blue-500/15 text-sky-400 border-blue-500/30' 
                                        : 'bg-blue-100 text-blue-800 border-blue-200'
                                    }`}>
                                      {prod.category}
                                    </span>
                                    <h4 className={`text-base font-bold mt-1.5 ${
                                      isDarkMode ? 'text-white' : 'text-slate-900'
                                    }`}>
                                      {prod.name}
                                    </h4>
                                  </div>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                    isDarkMode 
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}>
                                    ★ {prod.rating}
                                  </span>
                                </div>

                                <div className="space-y-1.5 mt-3 text-xs">
                                  {/* Processor / Chip / Driver */}
                                  {prod.processor && (
                                    <div className="flex items-start space-x-2">
                                      <Cpu className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400 shrink-0 mt-0.5" />
                                      <span className={`font-medium line-clamp-2 ${
                                        isDarkMode ? 'text-slate-200' : 'text-slate-700'
                                      }`}>
                                        {prod.processor}
                                      </span>
                                    </div>
                                  )}

                                  {/* RAM & Storage (For Laptops, Phones, Smartwatches) */}
                                  {(prod.ram || prod.storage) && (
                                    <div className="flex items-center space-x-2">
                                      <HardDrive className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                                      <span className={`font-medium ${
                                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                      }`}>
                                        {prod.ram ? `${prod.ram} RAM` : ''}
                                        {prod.ram && prod.storage ? ' • ' : ''}
                                        {prod.storage ? `${prod.storage}` : ''}
                                      </span>
                                    </div>
                                  )}

                                  {/* Display / Driver Specs */}
                                  {prod.display_specs && (
                                    <div className="flex items-center space-x-2">
                                      <Monitor className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                                      <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                                        {prod.display_specs}
                                      </span>
                                    </div>
                                  )}

                                  {/* Battery / Charging Specs */}
                                  {prod.battery_specs && (
                                    <div className="flex items-center space-x-2">
                                      <Battery className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                                      <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                                        {prod.battery_specs}
                                      </span>
                                    </div>
                                  )}

                                  {/* Hardware Features / Upgrade Info */}
                                  {prod.upgrade_info && (
                                    <div className="flex items-center space-x-2">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                                        {prod.upgrade_info}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bareilly Local Store Pricing & Contact */}
                              <div className={`pt-3 border-t space-y-2 ${
                                isDarkMode ? 'border-slate-800' : 'border-slate-200'
                              }`}>
                                <div className="flex items-baseline justify-between">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                                      Bareilly Store Deal
                                    </span>
                                    <span className={`text-lg font-black ${
                                      isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                    }`}>
                                      {prod.formatted_price}
                                    </span>
                                  </div>

                                  {/* Online MRP and Savings */}
                                  {prod.online_price > prod.price && (
                                    <div className="text-right">
                                      <span className="text-xs line-through text-slate-400 dark:text-slate-500 block">
                                        {prod.formatted_online_price}
                                      </span>
                                      {prod.savings > 0 && prod.formatted_savings && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block ${
                                          isDarkMode 
                                            ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' 
                                            : 'text-emerald-700 bg-emerald-100 border-emerald-200'
                                        }`}>
                                          Save {prod.formatted_savings}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-xs pt-1">
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <Store className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400 shrink-0" />
                                    <span className={`truncate font-semibold ${
                                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                    }`}>
                                      {prod.dealer_name} {prod.dealer_area ? `(${prod.dealer_area})` : ''}
                                    </span>
                                  </div>
                                  {prod.dealer_contact && (
                                    <a
                                      href={`tel:${prod.dealer_contact}`}
                                      className="flex items-center space-x-1 text-blue-600 dark:text-sky-400 hover:underline font-bold ml-2 shrink-0"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>Call</span>
                                    </a>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    if (!selectedProductIds.includes(prod.id)) {
                                      setSelectedProductIds(prev => [...prev.slice(-2), prod.id]);
                                    }
                                    setCurrentView('matrix');
                                  }}
                                  className={`w-full mt-2 py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition ${
                                    isDarkMode
                                      ? 'bg-blue-600/10 hover:bg-blue-600/20 text-sky-400 border-blue-500/30'
                                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  <span>Compare in Spec Matrix</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Follow-up Prompts */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {msg.followUps.map((pill, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => sendQuery(pill)}
                              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                                isDarkMode 
                                  ? 'bg-slate-800 border-slate-700 text-sky-300 hover:bg-slate-700' 
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {pill}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className={`p-4 rounded-2xl border max-w-sm flex items-center space-x-3 shadow-sm ${
                  isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <Sparkles className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-xs font-semibold">Dalal is checking Bareilly store stocks & specs...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className={`p-3 border-t backdrop-blur-md sticky bottom-0 transition-colors ${
              isDarkMode ? 'bg-[#0f172a]/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'
            }`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendQuery();
                }}
                className={`flex items-center space-x-2 border rounded-2xl p-2 transition shadow-md ${
                  isDarkMode 
                    ? 'bg-[#1e293b] border-slate-700 focus-within:border-sky-500' 
                    : 'bg-white border-slate-300 focus-within:border-blue-600'
                }`}
              >
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-xl transition ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Voice Search (Chrome/Edge)"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Dalal anything (e.g. noise cancelling headphones, laptop for coding, smartwatch in Civil Lines)..."
                  className={`flex-1 bg-transparent border-none outline-none text-sm px-2 font-medium ${
                    isDarkMode ? 'text-slate-100 placeholder-slate-400' : 'text-slate-900 placeholder-slate-500'
                  }`}
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold transition shadow-sm"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </form>
            </div>
          </main>
        )}

        {/* View 2: 📊 Spec Matrix (Side-by-Side Showdown & Dalal's Choice) */}
        {currentView === 'matrix' && (
          <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)] p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Tech Savvy Matrix Catalog Selection */}
              <div className={`lg:col-span-4 rounded-2xl border p-4 space-y-4 shadow-sm ${
                isDarkMode ? 'bg-[#1e293b]/90 border-slate-700/60' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Tech Savvy Matrix
                    </h3>
                    <span className="text-[11px] font-bold text-blue-500 dark:text-sky-400">
                      {selectedProductIds.length}/3 Selected
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Choose 2 or 3 products to compare specs and unlock Dalal's Choice recommendation.
                  </p>
                </div>

                {/* Dynamic Category Filter Pills directly derived from database.py categories */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {availableCategories.map(cat => {
                    const count = cat === 'all' 
                      ? productsList.length 
                      : productsList.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length;
                    const label = cat === 'all' ? `All (${count})` : `${cat} (${count})`;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white shadow-sm'
                            : isDarkMode 
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Search in Matrix */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search gadgets by name, processor, brand..."
                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-medium ${
                      isDarkMode 
                        ? 'bg-[#0f172a] border-slate-700 text-slate-100 placeholder-slate-400 focus:border-sky-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500'
                    }`}
                  />
                  {searchFilter && (
                    <button 
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Loading state or Scrollable Gadget Checkbox List */}
                {isLoadingProducts ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                    <span>Loading products from backend database...</span>
                  </div>
                ) : productsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No products found. Please ensure backend is running at {BACKEND_URL}.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                    {filteredMatrixProducts.map(prod => {
                      const isChecked = selectedProductIds.includes(prod.id);
                      const isDisabled = !isChecked && selectedProductIds.length >= 3;

                      return (
                        <div
                          key={prod.id}
                          onClick={() => !isDisabled && toggleProductSelection(prod.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                            isChecked
                              ? isDarkMode ? 'bg-blue-600/15 border-blue-500/60' : 'bg-blue-50 border-blue-400'
                              : isDisabled
                                ? 'opacity-40 cursor-not-allowed border-transparent'
                                : isDarkMode 
                                  ? 'bg-[#0f172a]/60 border-slate-700/60 hover:border-slate-600' 
                                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => {}}
                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-xs font-bold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                {prod.name}
                              </h4>
                              <span className="text-[10px] font-black text-emerald-500 shrink-0 ml-1">
                                {prod.formatted_price}
                              </span>
                            </div>
                            <p className={`text-[11px] truncate mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              {prod.processor}
                            </p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                              <span>{prod.category}</span>
                              <span>•</span>
                              <span className="truncate">{prod.dealer_name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Spec Comparison Showdown & Dalal's Choice Verdict */}
              <div className="lg:col-span-8 space-y-6">

                {/* Top Summary & Selected Chips */}
                <div className={`p-4 rounded-2xl border shadow-sm ${
                  isDarkMode ? 'bg-[#1e293b]/90 border-slate-700/60' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Compare Specifications
                      </h2>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Select 2 or 3 products to see side-by-side technical showdown
                      </p>
                    </div>

                    {selectedProductIds.length > 0 && (
                      <button
                        onClick={clearAllCompared}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition self-start sm:self-auto ${
                          isDarkMode ? 'text-slate-300 hover:text-white bg-slate-800' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                        }`}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Active Selected Tags */}
                  <div className={`flex flex-wrap items-center gap-2 mt-3 pt-3 border-t ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      Selected Products ({selectedProductIds.length}/3):
                    </span>
                    {comparedProducts.map(prod => (
                      <span
                        key={prod.id}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          isDarkMode 
                            ? 'bg-blue-600/20 border-blue-500/40 text-sky-300' 
                            : 'bg-blue-100 border-blue-300 text-blue-800'
                        }`}
                      >
                        <span>{prod.name}</span>
                        <button
                          onClick={() => removeComparedProduct(prod.id)}
                          className="hover:text-red-400 p-0.5"
                          title="Remove from comparison"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {selectedProductIds.length === 0 && (
                      <span className={`text-xs italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        No products selected. Check items on the left to begin.
                      </span>
                    )}
                  </div>
                </div>

                {/* AI-Powered Suggestion: DALAL'S CHOICE OR CROSS-CATEGORY WARNING */}
                {selectedProductIds.length < 2 ? (
                  <div className={`p-5 rounded-2xl border border-dashed flex items-center space-x-3 text-center justify-center ${
                    isDarkMode ? 'border-slate-700 text-slate-300 bg-[#1e293b]/40' : 'border-slate-300 text-slate-600 bg-slate-50'
                  }`}>
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <p className="text-xs sm:text-sm font-semibold">
                      Select <strong>2 or 3 products</strong> to activate <span className="text-amber-500 font-bold">Dalal's Choice</span> AI showdown analysis & technical comparison.
                    </p>
                  </div>
                ) : dalalsVerdict?.isCrossCategory ? (
                  /* Cross-Category Guardrail Warning */
                  <div className={`p-5 rounded-2xl border-2 transition shadow-md ${
                    isDarkMode 
                      ? 'bg-amber-950/20 border-amber-500/60 text-amber-200' 
                      : 'bg-amber-50/90 border-amber-400 text-amber-900'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                      <div>
                        <h4 className="text-base font-extrabold tracking-tight">
                          ⚠️ Dalal's Rule: Comparing Different Categories!
                        </h4>
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-90 mt-0.5">
                          Cross-Category Mismatch Detected ({dalalsVerdict.categories.join(' vs ')})
                        </p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed mt-3 pl-8 font-medium">
                      {dalalsVerdict.message}
                    </p>
                    <div className="mt-3 pl-8 flex flex-wrap gap-2">
                      {dalalsVerdict.categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-bold border border-amber-500/30 transition"
                        >
                          Filter {cat} Only
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Dalal's Choice Verdict Card */
                  <div className={`p-5 rounded-2xl border-2 transition shadow-lg relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-[#1e293b] via-[#1e293b]/95 to-blue-950/40 border-amber-500/50'
                      : 'bg-gradient-to-br from-amber-50/90 via-white to-blue-50/60 border-amber-400 shadow-sm'
                  }`}>
                    {/* Header: Dalal's Choice Title */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-slate-700/80 border-amber-200">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                          <Award className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-lg font-black tracking-tight ${
                              isDarkMode ? 'text-amber-400' : 'text-amber-800'
                            }`}>
                              👑 Dalal's Choice: AI Showdown Verdict
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              🏆 Top Pick
                            </span>
                          </div>
                          <p className={`text-xs font-medium ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            Automated hardware attribute & value-for-money analysis across {comparedProducts.length} selected gadgets
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Dalal Confidence Score</span>
                        <span className="text-sm font-black text-amber-400">
                          {dalalsVerdict.winner.score}/100 Pts
                        </span>
                      </div>
                    </div>

                    {/* Winner Details */}
                    <div className="pt-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-500 dark:text-sky-400">
                            Recommended Winner
                          </span>
                          <h4 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {dalalsVerdict.winner.product.name}
                          </h4>
                          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {dalalsVerdict.winner.product.processor} {dalalsVerdict.winner.product.ram ? `• ${dalalsVerdict.winner.product.ram} RAM` : ''}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className={`text-xl font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {dalalsVerdict.winner.product.formatted_price}
                          </span>
                          {dalalsVerdict.winner.product.savings > 0 && (
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md block sm:inline-block sm:ml-2">
                              Save {dalalsVerdict.winner.product.formatted_savings} in Bareilly
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Technical Comparison Bullets: Why It Won */}
                      <div className="space-y-2 pt-2">
                        <p className={`text-xs font-bold uppercase tracking-wider ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          Key Technical Strengths:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {dalalsVerdict.winner.bullets.map((b, bIdx) => (
                            <div
                              key={bIdx}
                              className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
                                isDarkMode 
                                  ? 'bg-[#0f172a]/70 border-slate-700/60 text-slate-200' 
                                  : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-bold text-blue-500 dark:text-sky-400 mr-1">{b.label}:</span>
                                <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{b.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Runner-up & Alternative note */}
                      {dalalsVerdict.runnerUp && (
                        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isDarkMode 
                            ? 'bg-slate-800/60 border-slate-700 text-slate-200' 
                            : 'bg-slate-100 border-slate-300 text-slate-800'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-amber-500">🥈 Dalal's Value Pick:</span>
                            <span>
                              <strong>{dalalsVerdict.runnerUp.product.name}</strong> ({dalalsVerdict.runnerUp.product.formatted_price})
                            </span>
                          </div>
                          <span className="text-[11px] opacity-80 hidden sm:inline">
                            Ideal if you need a reliable alternative at a different price point.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Side-by-Side Technical Showdown Grid */}
                {selectedProductIds.length > 0 && (
                  <div className="space-y-3">
                    <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Side-by-Side Showdown ({comparedProducts.length} {comparedProducts.length === 1 ? 'Product' : 'Products'})
                    </h3>

                    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(3, comparedProducts.length)} gap-4`}>
                      {comparedProducts.map(prod => (
                        <div
                          key={prod.id}
                          className={`rounded-2xl border p-4 space-y-4 flex flex-col justify-between transition shadow-sm ${
                            isDarkMode ? 'bg-[#1e293b]/90 border-slate-700/60' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div>
                            {/* Product Title Header */}
                            <div className={`flex items-start justify-between pb-3 border-b ${
                              isDarkMode ? 'border-slate-800' : 'border-slate-100'
                            }`}>
                              <div>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                  isDarkMode ? 'bg-blue-500/15 text-sky-400 border-blue-500/30' : 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}>
                                  {prod.category}
                                </span>
                                <h4 className={`text-base font-bold mt-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {prod.name}
                                </h4>
                              </div>
                              <button
                                onClick={() => removeComparedProduct(prod.id)}
                                className="text-slate-400 hover:text-red-400 p-1"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Pricing Box */}
                            <div className={`my-3 p-3 rounded-xl border ${
                              isDarkMode ? 'bg-[#0f172a]/80 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Bareilly Deal</span>
                              <div className="flex items-baseline justify-between mt-0.5">
                                <span className={`text-lg font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                  {prod.formatted_price}
                                </span>
                                {prod.online_price > prod.price && (
                                  <span className="text-xs line-through text-slate-400">
                                    {prod.formatted_online_price}
                                  </span>
                                )}
                              </div>
                              {prod.savings > 0 && prod.formatted_savings && (
                                <span className="text-[10px] font-bold text-emerald-500 mt-1 block">
                                  Save {prod.formatted_savings} locally
                                </span>
                              )}
                            </div>

                            {/* Specifications Rows */}
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-slate-400 text-[11px] block font-semibold">
                                  {prod.category === 'Headphones' ? 'Audio Engine / DSP' : prod.category === 'Smartwatches' ? 'Processor / SiP' : 'Processor'}
                                </span>
                                <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                  {prod.processor}
                                </span>
                              </div>

                              {(prod.ram || prod.storage) && (
                                <div>
                                  <span className="text-slate-400 text-[11px] block font-semibold">Memory & Storage</span>
                                  <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {prod.ram ? `${prod.ram} RAM` : ''}
                                    {prod.ram && prod.storage ? ' • ' : ''}
                                    {prod.storage ? `${prod.storage}` : ''}
                                  </span>
                                </div>
                              )}

                              {prod.display_specs && (
                                <div>
                                  <span className="text-slate-400 text-[11px] block font-semibold">
                                    {prod.category === 'Headphones' ? 'Acoustic Driver / Codecs' : 'Display Specs'}
                                  </span>
                                  <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {prod.display_specs}
                                  </span>
                                </div>
                              )}

                              {prod.camera_specs && (
                                <div>
                                  <span className="text-slate-400 text-[11px] block font-semibold">
                                    {prod.category === 'Headphones' ? 'Mics & Noise Cancellation' : prod.category === 'Smartwatches' ? 'Biometric Sensors' : 'Camera Specs'}
                                  </span>
                                  <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {prod.camera_specs}
                                  </span>
                                </div>
                              )}

                              {prod.battery_specs && (
                                <div>
                                  <span className="text-slate-400 text-[11px] block font-semibold">Battery & Playtime</span>
                                  <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {prod.battery_specs}
                                  </span>
                                </div>
                              )}

                              {prod.upgrade_info && (
                                <div>
                                  <span className="text-slate-400 text-[11px] block font-semibold">Hardware Upgradability & Features</span>
                                  <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {prod.upgrade_info}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Dealer Badge & Action */}
                          <div className={`pt-3 border-t text-xs space-y-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="flex items-center space-x-1.5">
                              <Store className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400 shrink-0" />
                              <span className={`truncate font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {prod.dealer_name}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              📍 {prod.dealer_area}
                            </p>
                            {prod.dealer_contact && (
                              <a
                                href={`tel:${prod.dealer_contact}`}
                                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Contact Store ({prod.dealer_contact})</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}