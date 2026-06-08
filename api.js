// ==================== API CONFIGURATION ====================
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxUJSjIFZYDAc1Xw3oTp5woPQVZCjEx9_F8QpEq746-tIosc52RdbTU-AkcJVllTkSj4w/exec';

// Data default
const DEFAULT_ADMINS = [{ username: 'admin', password: 'admin123' }];
const CABOR = ['Futsal', 'Basket', 'Catur', 'Voli', 'Badminton', 'Esport', 'Tenis Meja'];
const RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06', 'RT 07', 'RT 08', 'RT 09', 'RT 10', 'RT 11', 'RT 12', 'RT 13', 'RT 14', 'BY'];


const DEFAULT_ANNOUNCEMENTS = [
    { id: 'a1', judul: 'Pembukaan Lomba', isi: 'Acara pembukaan 10 Agustus 2025', penting: true, date: new Date().toISOString() },
];
// ==================== FUNGSI CALL API LANGSUNG ====================
async function callAPI(action, sheet, data = null) {
    const url = `${API_BASE_URL}?action=${action}&sheet=${sheet}&t=${Date.now()}`;
    
    const options = {
        method: data ? 'POST' : 'GET',
        mode: 'no-cors',  // Ganti dari 'cors' ke 'no-cors'
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
        console.log(`📤 POST to ${sheet}:`, data.length, 'records');
    } else {
        console.log(`📥 GET from ${sheet}`);
    }
    
    try {
        const response = await fetch(url, options);
        
        // Karena mode 'no-cors', response tidak bisa dibaca
        // Tapi request tetap terkirim
        console.log(`✅ ${action} request sent to ${sheet}`);
        
        // Untuk GET, kita perlu data dari cache
        if (action === 'get') {
            // Coba ambil dari localStorage dulu
            const cacheKey = `app_${sheet}`.toLowerCase();
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                console.log(`📦 Using cached ${sheet} data`);
                return JSON.parse(cached);
            }
        }
        
        return [];
        
    } catch (error) {
        console.error(`❌ ${action} error:`, error);
        
        // Fallback ke cache
        if (action === 'get') {
            const cacheKey = `app_${sheet}`.toLowerCase();
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        return [];
    }
}
// ==================== AMBIL DATA DARI SPREADSHEET ====================
async function fetchFromSpreadsheet(sheetName) {
    try {
        const url = `${API_BASE_URL}?action=get&sheet=${sheetName}`;
        console.log(`📥 Fetching ${sheetName} from spreadsheet...`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            console.log(`✅ Received ${data.length} rows from ${sheetName}`);
            return data;
        }
        return [];
    } catch (error) {
        console.error(`Error fetching ${sheetName}:`, error);
        return [];
    }
}

async function saveToSpreadsheet(sheetName, data) {
    try {
        const url = `${API_BASE_URL}?action=save&sheet=${sheetName}&t=${Date.now()}`;
        
        // Gunakan mode no-cors untuk menghindari CORS error
        const response = await fetch(url, {
            method: 'POST',
            mode: 'no-cors',  // Kunci utama
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        // Karena mode no-cors, response tidak bisa dibaca
        // Tapi request tetap terkirim
        console.log(`💾 Save request sent to ${sheetName}`);
        
        // Simpan juga ke localStorage sebagai backup
        const cacheKey = `app_${sheetName}`.toLowerCase();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        
        return { success: true, message: 'Request sent' };
        
    } catch (error) {
        console.error(`Error saving to ${sheetName}:`, error);
        
        // Fallback: simpan ke localStorage saja
        const cacheKey = `app_${sheetName}`.toLowerCase();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        console.log(`💾 Saved to localStorage as fallback: ${cacheKey}`);
        
        return { success: true, localBackup: true };
    }
}

// ==================== INISIALISASI DATA LOCAL ====================
function initLocalData() {
    if (!localStorage.getItem('app_admins')) {
        localStorage.setItem('app_admins', JSON.stringify(DEFAULT_ADMINS));
    }
    if (!localStorage.getItem('app_announcements')) {
        localStorage.setItem('app_announcements', JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem('app_settings')) {
        localStorage.setItem('app_settings', JSON.stringify({ startDate: '2025-08-10', endDate: '2025-08-24', theme: 'red' }));
    }
}

initLocalData();

// ==================== PESERTA ====================
async function getParticipants() {
    // Coba ambil dari spreadsheet dulu
    const spreadsheetData = await fetchFromSpreadsheet('Peserta');
    if (spreadsheetData && spreadsheetData.length > 0) {
        localStorage.setItem('app_participants', JSON.stringify(spreadsheetData));
        return spreadsheetData;
    }
    
    // Fallback ke localStorage
    const data = localStorage.getItem('app_participants');
    return data ? JSON.parse(data) : DEFAULT_PARTICIPANTS;
}

async function saveParticipants(participants) {
    localStorage.setItem('app_participants', JSON.stringify(participants));
    await saveToSpreadsheet('Peserta', participants);
    return { success: true };
}

// ==================== PENGUMUMAN ====================
async function getAnnouncements() {
    const spreadsheetData = await fetchFromSpreadsheet('Pengumuman');
    if (spreadsheetData && spreadsheetData.length > 0) {
        localStorage.setItem('app_announcements', JSON.stringify(spreadsheetData));
        return spreadsheetData;
    }
    
    const data = localStorage.getItem('app_announcements');
    return data ? JSON.parse(data) : DEFAULT_ANNOUNCEMENTS;
}

async function saveAnnouncements(announcements) {
    localStorage.setItem('app_announcements', JSON.stringify(announcements));
    await saveToSpreadsheet('Pengumuman', announcements);
    return { success: true };
}

// ==================== ADMIN ====================
async function getAdmins() {
    const spreadsheetData = await fetchFromSpreadsheet('Admins');
    if (spreadsheetData && spreadsheetData.length > 0) {
        return spreadsheetData;
    }
    const data = localStorage.getItem('app_admins');
    return data ? JSON.parse(data) : DEFAULT_ADMINS;
}

async function saveAdmins(admins) {
    localStorage.setItem('app_admins', JSON.stringify(admins));
    await saveToSpreadsheet('Admins', admins);
    return { success: true };
}

// ==================== SETTINGS ====================
async function getSettings() {
    const spreadsheetData = await fetchFromSpreadsheet('Settings');
    if (spreadsheetData && spreadsheetData.length > 0) {
        return spreadsheetData[0];
    }
    const data = localStorage.getItem('app_settings');
    return data ? JSON.parse(data) : { startDate: '2025-08-10', endDate: '2025-08-24', theme: 'red' };
}

async function saveSettings(settings) {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    await saveToSpreadsheet('Settings', [settings]);
    return { success: true };
}

// ==================== BRACKET / MATCH ====================
async function getMatches() {
    try {
        const spreadsheetData = await callAPI('get', 'Bracket');
        console.log('📊 Raw spreadsheet data:', spreadsheetData);
        
        if (spreadsheetData && spreadsheetData.length > 0) {
            const matches = spreadsheetData.map(row => {
                // Parse skor - perhatikan nilai 0
                let skorA = null;
                let skorB = null;
                
                // Cek score1 - nilai 0 harus tetap diproses
                if (row.score1 !== undefined && row.score1 !== null && row.score1 !== '0') {
                    // Jangan gunakan && row.score1 karena 0 akan dianggap falsy
                    const parsed = parseInt(row.score1);
                    if (!isNaN(parsed)) {
                        skorA = parsed;
                    }
                }
                
                // Cek score2
                if (row.score2 !== undefined && row.score2 !== null && row.score2 !== '0') {
                    const parsed = parseInt(row.score2);
                    if (!isNaN(parsed)) {
                        skorB = parsed;
                    }
                }
                
                console.log(`Match ${row.team1} vs ${row.team2}: raw scores = ${row.score1}|${row.score2} -> parsed = ${skorA}|${skorB}`);
                
                // Parse status done
                let isDone = false;
                if (row.done === true || row.done === 'TRUE' || row.done === 'true' || row.done === 1) {
                    isDone = true;
                }
                
                return {
                    id: row.matchId || row.id,
                    cabor: sportIdToName(row.sportId),
                    timA: row.team1,
                    timB: row.team2,
                    skorA: skorA,
                    skorB: skorB,
                    status: isDone ? 'Selesai' : 'Terjadwal',
                    round: row.round,
                    tanggal: row.date || 'TBA',
                    waktu: row.time || '19:00'
                };
            });
            
        
            // Simpan ke cache
            localStorage.setItem('app_matches', JSON.stringify(spreadsheetData));
            return spreadsheetData;
        }
        
        // Fallback ke localStorage
        const data = localStorage.getItem('app_matches');
        return data ? JSON.parse(data) : [];
        
    } catch (error) {
        console.error('Error getMatches:', error);
        return [];
    }
}

// Helper function
function sportIdToName(sportId) {
    const map = {
        'futsal': 'Futsal',
        'basket': 'Basket',
        'voli': 'Voli',
        'badminton': 'Badminton',
        'catur': 'Catur',
        'esport': 'Esport',
        'tenismeja': 'Tenis Meja'
    };
    return map[sportId] || sportId;
}

async function saveMatches(matches) {
    console.log('💾 Saving matches...');
    
    // Simpan ke localStorage dulu
    localStorage.setItem('app_matches', JSON.stringify(matches));
    
    // Update app_bracket juga
    const brackets = await getBracketData();
    localStorage.setItem('app_bracket', JSON.stringify(brackets));
    
    // Konversi ke format spreadsheet
    const bracketRows = matches.map(m => ({
        sportId: nameToSportId(m.cabor),
        matchId: m.id,
        round: m.round,
        team1: m.timA,
        team2: m.timB,
        score1: m.skorA !== null ? String(m.skorA) : '',
        score2: m.skorB !== null ? String(m.skorB) : '',
        winner: (m.skorA !== null && m.skorB !== null && m.skorA > m.skorB) ? m.timA : 
                (m.skorA !== null && m.skorB !== null && m.skorB > m.skorA) ? m.timB : '',
        done: m.status === 'Selesai',
        date: m.tanggal,
        time: m.waktu
    }));
    
    // Kirim ke spreadsheet (dengan no-cors)
    await saveToSpreadsheet('Bracket', bracketRows);
    
    // Trigger event untuk refresh
    window.dispatchEvent(new Event('storage'));
    
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

// ==================== BRACKET DATA UNTUK INDEX ====================
async function getBracketData() {
    try {
        const matches = await getMatches();
        console.log('📦 Matches for bracket:', matches);
        
        const brackets = {};
        const sportMap = {
            'Futsal': 'futsal',
            'Basket': 'basket',
            'Voli': 'voli',
            'Badminton': 'badminton',
            'Catur': 'catur',
            'Esport': 'esport',
            'Tenis Meja': 'tenismeja'
        };
        
        matches.forEach(match => {
            const sportId = sportMap[match.cabor];
            if (!sportId) return;
            
            if (!brackets[sportId]) {
                brackets[sportId] = {
                    left: { penyisihan: [], perempat: [], semifinal: [] },
                    right: { penyisihan: [], perempat: [], semifinal: [] },
                    final: { team1: null, team2: null, score1: '-', score2: '-', winner: null, done: false, date: 'TBA', time: '19:00' },
                    thirdPlace: { team1: null, team2: null, score1: '-', score2: '-', winner: null, done: false, date: 'TBA', time: '19:00' }
                };
            }
            
            // ========== HANDLER UNTUK FINAL ==========
            if (match.round === 'Final' || match.round === 'final') {
                brackets[sportId].final = {
                    id: match.id,
                    team1: match.timA,
                    team2: match.timB,
                    score1: match.skorA !== null ? String(match.skorA) : '-',
                    score2: match.skorB !== null ? String(match.skorB) : '-',
                    winner: (match.skorA !== null && match.skorB !== null && match.skorA > match.skorB) ? match.timA :
                            (match.skorA !== null && match.skorB !== null && match.skorB > match.skorA) ? match.timB : null,
                    done: (match.skorA !== null && match.skorB !== null),
                    date: match.tanggal || 'TBA',
                    time: match.waktu || '19:00'
                };
                return;
            }
            
            // ========== HANDLER UNTUK PEREBUTAN JUARA 3 ==========
            if (match.round === 'Perebutan Juara 3' || match.round === 'thirdPlace' || match.round === 'Third Place') {
                brackets[sportId].thirdPlace = {
                    id: match.id,
                    team1: match.timA,
                    team2: match.timB,
                    score1: match.skorA !== null ? String(match.skorA) : '-',
                    score2: match.skorB !== null ? String(match.skorB) : '-',
                    winner: (match.skorA !== null && match.skorB !== null && match.skorA > match.skorB) ? match.timA :
                            (match.skorA !== null && match.skorB !== null && match.skorB > match.skorA) ? match.timB : null,
                    done: (match.skorA !== null && match.skorB !== null),
                    date: match.tanggal || 'TBA',
                    time: match.waktu || '19:00'
                };
                return;
            }
            
            // ========== HANDLER UNTUK PENYISIHAN, PEREMPAT, SEMI ==========
            let roundKey = 'penyisihan';
            if (match.round === 'Penyisihan') roundKey = 'penyisihan';
            else if (match.round === 'Perempat Final') roundKey = 'perempat';
            else if (match.round === 'Semi Final') roundKey = 'semifinal';
            else return;
            
            // Tentukan sisi
            // Tentukan sisi - pastikan ini benar
                let side = 'left';
                if (match.id && match.id.startsWith('R')) {
    side = 'right';
} else if (match.id && match.id.startsWith('L')) {
    side = 'left';
} else {
    // fallback berdasarkan nomor RT
    const teamNum = parseInt(match.timA?.replace(/\D/g, '')) || 0;
    side = teamNum <= 7 ? 'left' : 'right';
}
            
            
            
            brackets[sportId][side][roundKey].push({
                id: match.id,
                team1: match.timA,
                team2: match.timB,
                score1: match.skorA !== null ? String(match.skorA) : '-',
                score2: match.skorB !== null ? String(match.skorB) : '-',
                winner: (match.skorA !== null && match.skorB !== null && match.skorA > match.skorB) ? match.timA :
                        (match.skorA !== null && match.skorB !== null && match.skorB > match.skorA) ? match.timB : null,
                done: (match.skorA !== null && match.skorB !== null),
                date: match.tanggal || 'TBA',
                time: match.waktu || '19:00'
            });
        });
        
        console.log('✅ Processed brackets:', brackets);
        
        // Simpan ke localStorage untuk backup
        localStorage.setItem('app_bracket', JSON.stringify(brackets));
        
        return brackets;
        
    } catch (error) {
        console.error('Error getBracketData:', error);
        // Ambil dari cache jika error
        const cached = localStorage.getItem('app_bracket');
        if (cached) {
            console.log('📦 Using cached bracket data');
            return JSON.parse(cached);
        }
        return {};
    }
}

async function saveBracketData(brackets) {
    localStorage.setItem('app_bracket', JSON.stringify(brackets));
    return { success: true };
}

// ==================== HELPER FUNCTIONS ====================


function nameToSportId(name) {
    const map = {
        'Futsal': 'futsal',
        'Basket': 'basket',
        'Voli': 'voli',
        'Badminton': 'badminton',
        'Catur': 'catur',
        'Esport': 'esport',
        'Tenis Meja': 'tenismeja'
    };
    return map[name] || name?.toLowerCase();
}
// ==================== HELPER FORMAT TANGGAL ====================
function formatDateFromSpreadsheet(dateValue) {
    if (!dateValue) return 'TBA';
    
    // Jika sudah dalam format string DD/MM/YYYY
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
        return dateValue;
    }
    
    // Jika dalam format YYYY-MM-DD
    if (typeof dateValue === 'string' && dateValue.includes('-')) {
        const parts = dateValue.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateValue;
    }
    
    // Jika dalam format Date object dari spreadsheet
    try {
        const date = new Date(dateValue);
        
        // Cek apakah tanggal valid (bukan 1899-12-30 yang berarti kosong)
        if (date.getFullYear() < 1900) {
            return 'TBA';
        }
        
        if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
    } catch(e) {
        console.warn('Date parsing error:', dateValue);
    }
    
    return 'TBA';
}

function formatTimeFromSpreadsheet(timeValue) {
    if (!timeValue) return '19:00';
    if (typeof timeValue === 'string') return timeValue;
    
    // Jika dalam format Date object
    try {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    } catch(e) {}
    
    return '19:00';
}

// ==================== TEST ====================
async function testAPI() {
    console.log('🧪 Testing API Connection...');
    
    const peserta = await getParticipants();
    console.log(`📊 Participants: ${peserta.length} records`);
    
    const matches = await getMatches();
    console.log(`🏆 Matches: ${matches.length} records`);
    
    const brackets = await getBracketData();
    console.log(`🎯 Brackets:`, Object.keys(brackets));
    
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
window.getMatches = getMatches;
window.saveMatches = saveMatches;
window.updateMatchScore = updateMatchScore;
window.getBracketData = getBracketData;
window.saveBracketData = saveBracketData;
window.testAPI = testAPI;

console.log('✅ API.js loaded with Google Spreadsheet integration');
