// ==================== API CONFIGURATION ====================
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxUJSjIFZYDAc1Xw3oTp5woPQVZCjEx9_F8QpEq746-tIosc52RdbTU-AkcJVllTkSj4w/exec';

// Data default
const DEFAULT_ADMINS = [{ username: 'admin', password: 'admin123' }];
const CABOR = ['Futsal', 'Basket', 'Catur', 'Voli', 'Badminton', 'Esport', 'Tenis Meja'];
const RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06', 'RT 07', 'RT 08', 'RT 09', 'RT 10', 'RT 11', 'RT 12', 'RT 13', 'RT 14', 'BY'];

const DEFAULT_PARTICIPANTS = [
    { id: '1', name: 'Ahmad Fauzi', rt: 'RT 01', sport: 'Futsal', noHp: '081234567890', status: 'Aktif' },
    { id: '2', name: 'Budi Santoso', rt: 'RT 02', sport: 'Basket', noHp: '081234567891', status: 'Aktif' },
    { id: '3', name: 'Citra Dewi', rt: 'RT 03', sport: 'Badminton', noHp: '081234567892', status: 'Aktif' },
];

const DEFAULT_ANNOUNCEMENTS = [
    { id: 'a1', judul: 'Pembukaan Lomba', isi: 'Acara pembukaan 10 Agustus 2025', penting: true, date: new Date().toISOString() },
];

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
        const url = `${API_BASE_URL}?action=save&sheet=${sheetName}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log(`💾 Saved to ${sheetName}:`, result);
        return result;
    } catch (error) {
        console.error(`Error saving to ${sheetName}:`, error);
        return { success: false };
    }
}

// ==================== INISIALISASI DATA LOCAL ====================
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
        const spreadsheetData = await fetchFromSpreadsheet('Bracket');
        
        if (spreadsheetData && spreadsheetData.length > 0) {
            const matches = spreadsheetData.map(row => ({
                id: row.matchId,
                cabor: sportIdToName(row.sportId),
                timA: row.team1,
                timB: row.team2,
                skorA: row.score1 && row.score1 !== '-' && row.score1 !== '' ? parseInt(row.score1) : null,
                skorB: row.score2 && row.score2 !== '-' && row.score2 !== '' ? parseInt(row.score2) : null,
                status: (row.done === true || row.done === 'TRUE' || row.done === 'true') ? 'Selesai' : 'Terjadwal',
                round: row.round,
                tanggal: formatDateFromSpreadsheet(row.date),
                waktu: formatTimeFromSpreadsheet(row.time)
            }));
            
            // Filter hanya match yang valid (team1 dan team2 ada)
            const validMatches = matches.filter(m => m.timA && m.timB);
            localStorage.setItem('app_matches', JSON.stringify(validMatches));
            return validMatches;
        }
        
        // Fallback ke localStorage
        const data = localStorage.getItem('app_matches');
        if (data) {
            return JSON.parse(data);
        }
        
        return [];
        
    } catch (error) {
        console.error('Error getMatches:', error);
        return [];
    }
}

async function saveMatches(matches) {
    localStorage.setItem('app_matches', JSON.stringify(matches));
    
    // Konversi ke format spreadsheet
    const bracketRows = matches.map(m => ({
        sportId: nameToSportId(m.cabor),
        matchId: m.id,
        round: m.round,
        team1: m.timA,
        team2: m.timB,
        score1: m.skorA !== null ? String(m.skorA) : '',
        score2: m.skorB !== null ? String(m.skorB) : '',
        winner: (m.skorA && m.skorB && m.skorA > m.skorB) ? m.timA : 
                (m.skorA && m.skorB && m.skorB > m.skorA) ? m.timB : '',
        done: m.status === 'Selesai',
        date: m.tanggal,
        time: m.waktu
    }));
    
    await saveToSpreadsheet('Bracket', bracketRows);
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
            
            let roundKey = 'penyisihan';
            if (match.round === 'Penyisihan') roundKey = 'penyisihan';
            else if (match.round === 'Perempat Final') roundKey = 'perempat';
            else if (match.round === 'Semi Final') roundKey = 'semifinal';
            
            // Tentukan sisi
            let side = 'left';
            if (match.id && match.id.startsWith('L')) {
                side = 'left';
            } else if (match.id && match.id.startsWith('R')) {
                side = 'right';
            } else {
                const teamANum = parseInt(match.timA?.replace(/\D/g, '')) || 0;
                if (teamANum >= 1 && teamANum <= 7) side = 'left';
                else if (teamANum >= 8 && teamANum <= 14) side = 'right';
                else side = brackets[sportId].left[roundKey].length <= brackets[sportId].right[roundKey].length ? 'left' : 'right';
            }
            
            // Skor
            let score1 = '-', score2 = '-';
            let winner = null;
            let done = false;
            
            if (match.skorA !== null && match.skorA !== undefined) {
                score1 = String(match.skorA);
                score2 = String(match.skorB);
                done = true;
                if (parseInt(match.skorA) > parseInt(match.skorB)) {
                    winner = match.timA;
                } else if (parseInt(match.skorB) > parseInt(match.skorA)) {
                    winner = match.timB;
                }
            }
            
            // Tanggal sudah dalam format DD/MM/YYYY dari getMatches
            const matchDate = match.tanggal || 'TBA';
            const matchTime = match.waktu || '19:00';
            
            brackets[sportId][side][roundKey].push({
                id: match.id,
                team1: match.timA,
                team2: match.timB,
                score1: score1,
                score2: score2,
                winner: winner,
                done: done,
                date: matchDate,
                time: matchTime
            });
        });
        
        return brackets;
        
    } catch (error) {
        console.error('Error getBracketData:', error);
        return {};
    }
}

async function saveBracketData(brackets) {
    localStorage.setItem('app_bracket', JSON.stringify(brackets));
    return { success: true };
}

// ==================== HELPER FUNCTIONS ====================
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
    return map[sportId?.toLowerCase()] || sportId;
}

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