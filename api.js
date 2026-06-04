// ==================== API CONFIGURATION ====================
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxUJSjIFZYDAc1Xw3oTp5woPQVZCjEx9_F8QpEq746-tIosc52RdbTU-AkcJVllTkSj4w/exec';

// Data default untuk development (karena CORS)
const DEFAULT_ADMINS = [{ username: 'admin', password: 'admin123' }];
const CABOR = ['Futsal', 'Basket', 'Catur', 'Voli', 'Badminton', 'Esport', 'Tenis Meja'];
const RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06', 'RT 07', 'RT 08', 'RT 09', 'RT 10', 'RT 11', 'RT 12', 'RT 13', 'RT 14','BY'];

const DEFAULT_PARTICIPANTS = [
    { id: '1', name: 'Ahmad Fauzi', rt: 'RT 01', sport: 'Futsal', noHp: '081234567890', status: 'Aktif' },
    { id: '2', name: 'Budi Santoso', rt: 'RT 02', sport: 'Basket', noHp: '081234567891', status: 'Aktif' },
    { id: '3', name: 'Citra Dewi', rt: 'RT 03', sport: 'Badminton', noHp: '081234567892', status: 'Aktif' },
    { id: '4', name: 'Dian Pratama', rt: 'RT 01', sport: 'Voli', noHp: '081234567893', status: 'Aktif' },
    { id: '5', name: 'Eko Wahyu', rt: 'RT 04', sport: 'Catur', noHp: '081234567894', status: 'Aktif' },
];
const DEFAULT_ANNOUNCEMENTS = [
    { id: 'a1', judul: 'Pembukaan Lomba', isi: 'Acara pembukaan 10 Agustus 2025', penting: true, date: new Date().toISOString() },
];

// Inisialisasi data di localStorage jika belum ada
function initLocalData() {
    if (!localStorage.getItem('app_admins')) {
        localStorage.setItem('app_admins', JSON.stringify(DEFAULT_ADMINS));
    }
    if (!localStorage.getItem('app_participants')) {
        localStorage.setItem('app_participants', JSON.stringify(DEFAULT_PARTICIPANTS));
    }
    if (!localStorage.getItem('app_announcements')) {
        localStorage.setItem('app_announcements', JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem('app_settings')) {
        localStorage.setItem('app_settings', JSON.stringify({ startDate: '2025-08-10', endDate: '2025-08-24', theme: 'red' }));
    }
}

// Panggil init
initLocalData();

// ==================== PESERTA ====================
async function getParticipants() {
    const data = localStorage.getItem('app_participants');
    return data ? JSON.parse(data) : DEFAULT_PARTICIPANTS;
}

async function saveParticipants(participants) {
    localStorage.setItem('app_participants', JSON.stringify(participants));
    // Coba sync ke API (optional, tidak masalah jika gagal)
    trySyncToAPI('Peserta', participants);
    return { success: true };
}

// ==================== PENGUMUMAN ====================
async function getAnnouncements() {
    const data = localStorage.getItem('app_announcements');
    return data ? JSON.parse(data) : DEFAULT_ANNOUNCEMENTS;
}

async function saveAnnouncements(announcements) {
    localStorage.setItem('app_announcements', JSON.stringify(announcements));
    trySyncToAPI('Pengumuman', announcements);
    return { success: true };
}

// ==================== ADMIN ====================
async function getAdmins() {
    const data = localStorage.getItem('app_admins');
    const admins = data ? JSON.parse(data) : DEFAULT_ADMINS;
    console.log('📋 Admins from localStorage:', admins);
    return admins;
}

async function saveAdmins(admins) {
    localStorage.setItem('app_admins', JSON.stringify(admins));
    trySyncToAPI('Admins', admins);
    return { success: true };
}

// ==================== SETTINGS ====================
async function getSettings() {
    const data = localStorage.getItem('app_settings');
    return data ? JSON.parse(data) : { startDate: '2025-08-10', endDate: '2025-08-24', theme: 'red' };
}

async function saveSettings(settings) {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    trySyncToAPI('Settings', [settings]);
    return { success: true };
}

// ==================== BRACKET ====================
// ==================== BRACKET / MATCH ====================
async function getMatches() {
    // Ambil dari localStorage dulu (sementara)
    const data = localStorage.getItem('app_matches');
    if (data) {
        return JSON.parse(data);
    }
    
    // Sample data awal
    const sampleMatches = [
        { id: 'm1', cabor: 'Futsal', timA: 'RT 01', timB: 'RT 02', skorA: null, skorB: null, status: 'Terjadwal', tanggal: '2025-08-15', round: 'Penyisihan' },
        { id: 'm2', cabor: 'Futsal', timA: 'RT 03', timB: 'RT 04', skorA: null, skorB: null, status: 'Terjadwal', tanggal: '2025-08-15', round: 'Penyisihan' },
        { id: 'm3', cabor: 'Basket', timA: 'RT 01', timB: 'RT 03', skorA: null, skorB: null, status: 'Terjadwal', tanggal: '2025-08-16', round: 'Penyisihan' },
        { id: 'm4', cabor: 'Voli', timA: 'RT 02', timB: 'RT 04', skorA: null, skorB: null, status: 'Terjadwal', tanggal: '2025-08-16', round: 'Penyisihan' },
    ];
    
    localStorage.setItem('app_matches', JSON.stringify(sampleMatches));
    return sampleMatches;
}

async function saveMatches(matches) {
    localStorage.setItem('app_matches', JSON.stringify(matches));
    return { success: true };
}

async function updateMatchScore(matchId, skorA, skorB) {
    const matches = await getMatches();
    const index = matches.findIndex(m => m.id === matchId);
    if (index !== -1) {
        matches[index].skorA = skorA;
        matches[index].skorB = skorB;
        if (skorA !== null && skorB !== null) {
            matches[index].status = 'Selesai';
        }
        await saveMatches(matches);
        return true;
    }
    return false;
}

// Export ke window
window.getMatches = getMatches;
window.saveMatches = saveMatches;
window.updateMatchScore = updateMatchScore;

// ==================== BRACKET DATA UNTUK INDEX ====================
async function getBracketData() {
    // Ambil data matches yang sudah disimpan
    const matches = await getMatches();
    
    // Konversi ke format bracket yang dibutuhkan index
    const brackets = {};
    
    matches.forEach(match => {
        const sportMap = {
            'Futsal': 'futsal',
            'Basket': 'basket',
            'Voli': 'voli',
            'Badminton': 'badminton',
            'Catur': 'catur',
            'Esport': 'esport',
            'Tenis Meja': 'tenismeja'
        };
        
        const sportId = sportMap[match.cabor] || match.cabor.toLowerCase();
        
        if (!brackets[sportId]) {
            brackets[sportId] = {
                left: { penyisihan: [], perempat: [], semifinal: [] },
                right: { penyisihan: [], perempat: [], semifinal: [] },
                final: { team1: null, team2: null, score1: '-', score2: '-', winner: null, done: false },
                thirdPlace: { team1: null, team2: null, score1: '-', score2: '-', winner: null, done: false }
            };
        }
        
        // Masukkan match ke penyisihan dulu
        brackets[sportId].left.penyisihan.push({
            id: match.id,
            team1: match.timA,
            team2: match.timB,
            score1: match.skorA !== null ? String(match.skorA) : '-',
            score2: match.skorB !== null ? String(match.skorB) : '-',
            winner: (match.skorA !== null && match.skorB !== null) ? 
                (match.skorA > match.skorB ? match.timA : match.timB) : null,
            done: match.status === 'Selesai',
            date: match.tanggal || 'TBA',
            time: '19:00'
        });
    });
    
    return brackets;
}

async function saveBracketData(brackets) {
    localStorage.setItem('app_bracket', JSON.stringify(brackets));
    return { success: true };
}

// ==================== SYNC KE API (BACKGROUND) ====================
async function trySyncToAPI(sheet, data) {
    try {
        const url = `${API_BASE_URL}?action=save&sheet=${sheet}`;
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log(`🔄 Synced ${sheet} to API (background)`);
    } catch (e) {
        console.log(`⚠️ Cannot sync ${sheet} to API, but data saved locally`);
    }
}

// ==================== TEST ====================
async function testAPI() {
    console.log('🧪 Testing...');
    const peserta = await getParticipants();
    console.log(`📊 Participants: ${peserta.length} records`);
    const admins = await getAdmins();
    console.log(`👥 Admins:`, admins);
    return { success: true };
}

// Export ke window
window.getParticipants = getParticipants;
window.saveParticipants = saveParticipants;
window.getAnnouncements = getAnnouncements;
window.saveAnnouncements = saveAnnouncements;
window.getAdmins = getAdmins;
window.saveAdmins = saveAdmins;
window.getSettings = getSettings;
window.saveSettings = saveSettings;
window.getBracketData = getBracketData;
window.saveBracketData = saveBracketData;
window.testAPI = testAPI;

console.log('✅ API.js loaded with localStorage persistence');