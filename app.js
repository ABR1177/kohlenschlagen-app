// App Logic - Kohlenschlagen

// State
let players = [];
let currentRound = 1;

// Init
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    loadData();
    startClock();
    fetchWeather();
    renderUI();
}

// Data Management
function loadData() {
    const storedPlayers = localStorage.getItem('kohlenschlagen_players');
    if (storedPlayers) {
        players = JSON.parse(storedPlayers);
    }
    const storedRound = localStorage.getItem('kohlenschlagen_round');
    if (storedRound) {
        currentRound = parseInt(storedRound);
    }
}

function saveData() {
    localStorage.setItem('kohlenschlagen_players', JSON.stringify(players));
    localStorage.setItem('kohlenschlagen_round', currentRound);
    renderUI();
}

function addPlayer(event) {
    event.preventDefault();

    const nameInput = document.getElementById('player-name');
    const teamInput = document.getElementById('player-team');

    const name = nameInput.value.trim();
    const team = teamInput.value.trim();

    if (!name) return; // Validation

    const newPlayer = {
        id: crypto.randomUUID(),
        name: name,
        team: team || 'Kein Team',
        scores: [], // legacy support
        history: [], // new detailed history
        totalScore: 0,
        createdAt: new Date().toISOString()
    };

    players.push(newPlayer);
    saveData();

    // Reset Form & Close Modal
    nameInput.value = '';
    teamInput.value = '';
    togglePlayerModal();
}

// UI Logic
function togglePlayerModal() {
    const modal = document.getElementById('player-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        document.getElementById('player-name').focus();
    }
}

function renderUI() {
    // Update Stats
    document.getElementById('player-count').textContent = players.length;
    const roundDisplay = document.getElementById('current-round-display');
    if (roundDisplay) roundDisplay.textContent = currentRound;

    // Render Player List (Start Page)
    const listElement = document.getElementById('player-list');
    const emptyState = document.getElementById('empty-state');

    listElement.innerHTML = '';

    if (players.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');

        players.forEach(player => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors animate-fade-in';
            li.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold shadow-lg text-white">
                        ${player.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex flex-col">
                        <span class="font-medium text-white">${player.name}</span>
                        <span class="text-[10px] text-slate-400">${player.team}</span>
                    </div>
                </div>
                <div class="text-right">
                     <span class="text-sm font-bold text-emerald-400">${player.totalScore}</span>
                     <span class="text-[10px] text-slate-500 block">Punkte</span>
                </div>
            `;
            listElement.appendChild(li);
        });
    }

    renderScoringInputs();
    function renderLeaderboard() {
        // Clone and Sort: Highest score first
        const sortedPlayers = [...players].sort((a, b) => b.totalScore - a.totalScore);

        const podiumContainer = document.getElementById('leaderboard-podium');
        const listContainer = document.getElementById('leaderboard-list');
        const emptyState = document.getElementById('empty-leaderboard');

        podiumContainer.innerHTML = '';
        listContainer.innerHTML = '';

        if (sortedPlayers.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        // Split Top 3 and Rest
        const top3 = sortedPlayers.slice(0, 3);
        const rest = sortedPlayers.slice(3);

        // Render Podium
        // We need specific order for visual podium: 2nd (Left), 1st (Center), 3rd (Right)
        const podiumOrder = [
            { rank: 2, data: top3[1], height: 'h-24', color: 'from-slate-300 to-slate-400', border: 'border-slate-300', iconColor: 'text-slate-300' },
            { rank: 1, data: top3[0], height: 'h-32', color: 'from-yellow-400 to-amber-500', border: 'border-yellow-400', iconColor: 'text-yellow-400', scale: 'scale-110 z-10' },
            { rank: 3, data: top3[2], height: 'h-20', color: 'from-orange-400 to-amber-700', border: 'border-orange-500', iconColor: 'text-amber-700' }
        ];

        podiumOrder.forEach(item => {
            if (!item.data) return; // Handle distinct cases with < 3 players

            const div = document.createElement('div');
            div.className = `flex flex-col items-center ${item.scale || ''}`;
            div.innerHTML = `
            <div class="mb-2 flex flex-col items-center">
                <span class="font-bold text-white text-sm whitespace-nowrap">${item.data.name}</span>
                <span class="text-xs text-emerald-400 font-bold">${item.data.totalScore} Pkt</span>
            </div>
            <div class="w-20 ${item.height} bg-gradient-to-b ${item.color} rounded-t-lg shadow-lg flex flex-col justify-end items-center pb-2 border-t-2 border-l border-r ${item.border} bg-opacity-90 backdrop-blur-sm">
                <i data-lucide="trophy" class="w-6 h-6 ${item.rank === 1 ? 'text-white drop-shadow-md' : 'text-white/80'} mb-1"></i>
                <span class="text-2xl font-black text-white mix-blend-overlay">${item.rank}</span>
            </div>
        `;
            podiumContainer.appendChild(div);
        });

        // Render List (Rank 4+)
        rest.forEach((player, index) => {
            const rank = index + 4;
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 animate-fade-in';
            li.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="font-bold text-sm w-6 text-center text-slate-500">#${rank}</span>
                <div class="flex flex-col">
                    <span class="font-medium text-white">${player.name}</span>
                    <span class="text-[10px] text-slate-400">${player.team}</span>
                </div>
            </div>
            <span class="font-bold text-emerald-400">${player.totalScore}</span>
        `;
            listContainer.appendChild(li);
        });

        if (window.lucide) lucide.createIcons();
    }
    renderLeaderboard();

    function renderStats() {
        // Aggregation Variables
        let totalMeters = 0;
        let maxMeter = 0;
        let maxMeterPlayer = '-';

        const hitCounts = {}; // { "Volltreffer": 5, ... }
        const penaltyCounts = {}; // { "Zu spät": 2, ... }
        const pflichtAttempts = { 1: 0, 2: 0, 3: 0 };

        // Process All Data
        players.forEach(p => {
            if (p.history) {
                p.history.forEach(entry => {
                    // 1. Meters
                    if (entry.type === 'meter') {
                        totalMeters += entry.amount;
                        if (entry.amount > maxMeter) {
                            maxMeter = entry.amount;
                            maxMeterPlayer = p.name;
                        }
                    }

                    // 2. Hits (Ratings)
                    if (entry.type === 'rating') {
                        // Reason contains the name, e.g. "Volltreffer (+3)" or just "Volltreffer" depending on logic
                        // We strip the (+X) for cleaner grouping if needed, but current select text has it.
                        // Let's keep full text for mapped counting
                        const label = entry.reason.split(' (')[0]; // Simple split to get "Volltreffer"
                        hitCounts[label] = (hitCounts[label] || 0) + 1;
                    }

                    // 3. Penalties
                    if (entry.type === 'penalty') {
                        const label = entry.reason.split(' (')[0];
                        penaltyCounts[label] = (penaltyCounts[label] || 0) + 1;
                    }

                    // 4. Pflichtschlagen
                    if (entry.type === 'pflicht') {
                        // reason format: "Pflichtschlagen (Versuch X)"
                        if (entry.reason.includes('Versuch 1')) pflichtAttempts[1]++;
                        if (entry.reason.includes('Versuch 2')) pflichtAttempts[2]++;
                        if (entry.reason.includes('Versuch 3')) pflichtAttempts[3]++;
                    }
                });
            }
        });

        // --- Render Meters ---
        const metersContainer = document.getElementById('stats-meters');
        if (metersContainer) {
            metersContainer.innerHTML = `
            <div class="flex justify-between items-center bg-white/5 p-2 rounded">
                <span class="text-slate-400 text-xs">Gesamtstrecke</span>
                <span class="text-white font-bold">${totalMeters} m</span>
            </div>
            <div class="flex justify-between items-center bg-white/5 p-2 rounded">
                <span class="text-slate-400 text-xs">Weitester Schlag</span>
                <div class="text-right">
                    <span class="text-white font-bold block">${maxMeter} m</span>
                    <span class="text-[10px] text-slate-500">${maxMeterPlayer}</span>
                </div>
            </div>
        `;
        }

        // --- Helper to render bars ---
        const renderBar = (containerId, dataObj, colorClass) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';

            const entries = Object.entries(dataObj).sort((a, b) => b[1] - a[1]); // Sort by count desc
            if (entries.length === 0) {
                container.innerHTML = '<p class="text-[10px] text-slate-600 italic">Keine Daten.</p>';
                return;
            }

            const maxVal = Math.max(...Object.values(dataObj));

            entries.forEach(([label, count]) => {
                const percent = (count / maxVal) * 100;
                container.innerHTML += `
                <div class="mb-2">
                    <div class="flex justify-between text-xs mb-1">
                        <span class="text-slate-300">${label}</span>
                        <span class="text-white font-bold">${count}x</span>
                    </div>
                    <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full ${colorClass} rounded-full" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
            });
        };

        // Render Categories
        renderBar('stats-hits', hitCounts, 'bg-emerald-500');
        renderBar('stats-penalties', penaltyCounts, 'bg-red-500');

        // Render Pflicht attempts (Custom order 1 -> 2 -> 3)
        const pflichtContainer = document.getElementById('stats-pflicht');
        if (pflichtContainer) {
            pflichtContainer.innerHTML = '';
            const totalPflicht = pflichtAttempts[1] + pflichtAttempts[2] + pflichtAttempts[3];

            if (totalPflicht === 0) {
                pflichtContainer.innerHTML = '<p class="text-[10px] text-slate-600 italic">Keine Daten.</p>';
            } else {
                [1, 2, 3].forEach(attempt => {
                    const count = pflichtAttempts[attempt];
                    const percent = (count / totalPflicht) * 100; // Relative to total pflicht hits
                    pflichtContainer.innerHTML += `
                    <div class="mb-2">
                         <div class="flex justify-between text-xs mb-1">
                            <span class="text-slate-300">${attempt}. Versuch</span>
                            <span class="text-white font-bold">${count}x</span>
                        </div>
                        <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-500 rounded-full" style="width: ${percent || 0}%"></div>
                        </div>
                    </div>
                `;
                });
            }
        }
    }
    renderStats(); // Call the new renderStats function

    // Refresh Icons
    if (window.lucide) lucide.createIcons();
}

// Scoring Logic
function renderScoringInputs() {
    const container = document.getElementById('scoring-list');
    container.innerHTML = '';

    if (players.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center">Keine Spieler vorhanden.</p>';
        return;
    }

    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'glass-card p-5 space-y-4 border border-white/5 h-full flex flex-col justify-between transition-transform hover:scale-[1.01]';
        div.innerHTML = `
            <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold shadow-lg text-white">
                        ${player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                         <span class="font-medium text-white block">${player.name}</span>
                         <span class="text-[10px] text-slate-500">Gesamt: ${player.totalScore}</span>
                    </div>
                </div>
            </div>
            
            <!-- 1. Standard: Meter & Schlag -->
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Meter</label>
                    <input type="number" data-id="${player.id}" data-type="meter" placeholder="0" 
                        class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-emerald-500 transition-colors">
                </div>
                <div>
                    <label class="text-[10px] text-slate-400 uppercase font-bold block mb-1">Schlag</label>
                    <select data-id="${player.id}" data-type="rating" class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors">
                        <option value="-1">...</option>
                        <option value="0">Windditsch (0)</option>
                        <option value="1">Streifschuss (+1)</option>
                        <option value="1">Knüppeltreffer (+1)</option>
                        <option value="2">Treffer (+2)</option>
                        <option value="3">Volltreffer (+3)</option>
                     </select>
                </div>
            </div>

            <!-- 2. Pflichtschlagen (Special) -->
            <div class="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
                <label class="text-[10px] text-indigo-300 uppercase font-bold block mb-2 flex items-center gap-1">
                    <i data-lucide="star" class="w-3 h-3"></i> Pflichtschlagen (+20)
                </label>
                <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" data-id="${player.id}" data-type="pflicht-success" class="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-700">
                        <span class="text-sm text-white">Geschafft?</span>
                    </label>
                    <select data-id="${player.id}" data-type="pflicht-attempt" class="bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white w-24">
                        <option value="0">Versuch...</option>
                        <option value="1">1. Versuch</option>
                        <option value="2">2. Versuch</option>
                        <option value="3">3. Versuch</option>
                    </select>
                </div>
            </div>

            <!-- 3. Strafen -->
            <div class="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                 <label class="text-[10px] text-red-400 uppercase font-bold block mb-1">Strafe</label>
                 <select data-id="${player.id}" data-type="penalty" class="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors">
                    <option value="0">Keine Strafe</option>
                    <option value="-5">Zu spät (-5)</option>
                    <option value="-5">Keine Kopfbedeckung (-5)</option>
                    <option value="-10">Kohle weg (-10)</option>
                    <option value="-20">Heide kaputt (-20)</option>
                 </select>
            </div>
        `;
        container.appendChild(div);
    });

    // Create icons for new elements
    if (window.lucide) lucide.createIcons();
}

function saveRound() {
    let hasUpdates = false;

    players.forEach(player => {
        // Selectors
        const meterInput = document.querySelector(`input[data-id="${player.id}"][data-type="meter"]`);
        const ratingSelect = document.querySelector(`select[data-id="${player.id}"][data-type="rating"]`);

        const pflichtSuccess = document.querySelector(`input[data-id="${player.id}"][data-type="pflicht-success"]`);
        const pflichtAttempt = document.querySelector(`select[data-id="${player.id}"][data-type="pflicht-attempt"]`);

        const penaltySelect = document.querySelector(`select[data-id="${player.id}"][data-type="penalty"]`);

        // Values
        const meterVal = parseInt(meterInput.value);
        const ratingVal = parseInt(ratingSelect.value);
        const penaltyVal = parseInt(penaltySelect.value);

        let playerUpdated = false;

        // 1. Meter
        if (!isNaN(meterVal) && meterVal !== 0) {
            addScoreToPlayer(player.id, meterVal, 'meter');
            playerUpdated = true;
        }

        // 2. Rating (Schlag)
        if (ratingVal >= 0) { // -1 is default "..."
            const reason = ratingSelect.options[ratingSelect.selectedIndex].text;
            addScoreToPlayer(player.id, ratingVal, 'rating', reason);
            playerUpdated = true;
        }

        // 3. Pflichtschlagen
        if (pflichtSuccess.checked) {
            const attempt = pflichtAttempt.value;
            const reason = `Pflichtschlagen (Versuch ${attempt})`;
            addScoreToPlayer(player.id, 20, 'pflicht', reason);
            playerUpdated = true;
            // Uncheck after save
            pflichtSuccess.checked = false;
            pflichtAttempt.selectedIndex = 0;
        }

        // 4. Penalty
        if (penaltyVal !== 0) {
            const reason = penaltySelect.options[penaltySelect.selectedIndex].text;
            addScoreToPlayer(player.id, penaltyVal, 'penalty', reason);
            playerUpdated = true;
            // Reset
            penaltySelect.selectedIndex = 0;
        }

        if (playerUpdated) hasUpdates = true;

        // Reset Standard Inputs
        meterInput.value = '';
        ratingSelect.selectedIndex = 0;
    });

    if (hasUpdates) {
        currentRound++; // Next Round
        saveData();
        alert('Einträge gespeichert! 💾');
        switchView('view-leaderboard');
    } else {
        alert('Bitte geben Sie für mindestens einen Spieler Werte ein.');
    }
}

// Game Lifecycle
function endGame() {
    // Show Clear Button
    document.getElementById('btn-clear-game').classList.remove('hidden');
    document.getElementById('btn-end-game').classList.add('opacity-50', 'pointer-events-none'); // Disable "End Game" visually
    alert('Spiel ist nun beendet. Sie können die Daten jetzt löschen.');
}

function clearGame() {
    if (confirm('Sind Sie sicher? Dies löscht ALLE Spieler und Ergebnisse unwiderruflich!')) {
        players = [];
        currentRound = 1; // Reset Round
        saveData(); // Clears storage as players is empty

        // Reset UI State
        document.getElementById('btn-clear-game').classList.add('hidden');
        document.getElementById('btn-end-game').classList.remove('opacity-50', 'pointer-events-none');

        switchView('view-start');
        alert('Alle Daten wurden gelöscht.');
    }
}

function addScoreToPlayer(playerId, amount, type, reason = '') {
    const player = players.find(p => p.id === playerId);
    if (player) {
        if (!player.history) player.history = [];

        // Meters should not affect total score (Requested update)
        let scoreImpact = amount;
        if (type === 'meter') {
            scoreImpact = 0;
            // Optionally track total meters if needed later
            if (!player.totalMeters) player.totalMeters = 0;
            player.totalMeters += amount;
        }

        player.history.push({
            amount: amount,
            scoreImpact: scoreImpact,
            type: type,
            reason: reason,
            timestamp: new Date().toISOString()
        });

        player.totalScore += scoreImpact;
    }
}

// Navigation
function switchView(viewId) {
    // 1. Update Navigation Highlighting (Immediate Feedback)
    const activeNavMap = {
        'view-start': 'nav-start',
        'view-input': 'nav-input',
        'view-leaderboard': 'nav-leaderboard',
        'view-stats': 'nav-stats'
    };

    // Reset all nav buttons
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('text-emerald-400', 'scale-110');
        btn.classList.add('text-slate-500');
    });

    // Highlight active nav button
    const activeBtnId = activeNavMap[viewId];
    if (activeBtnId) {
        const btn = document.getElementById(activeBtnId);
        if (btn) {
            btn.classList.remove('text-slate-500');
            btn.classList.add('text-emerald-400', 'scale-110');
        }
    }

    // 2. Switch View Visibility
    ['view-start', 'view-input', 'view-leaderboard', 'view-stats'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    // 3. Render Dynamic Content
    if (viewId === 'view-leaderboard') renderLeaderboard();
    if (viewId === 'view-stats') renderStats();
}

function startClock() {
    const update = () => {
        const now = new Date();

        // Date
        const dateElement = document.getElementById('current-date');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (dateElement) dateElement.textContent = now.toLocaleDateString('de-DE', options);

        // Time
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            timeElement.textContent = timeString;
        }
    };

    update(); // Immediate
    setInterval(update, 1000); // Every second
}

// Weather Logic
function fetchWeather() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
            // 1. Fetch Weather
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const weatherData = await weatherRes.json();
            const weather = weatherData.current_weather;

            // 2. Fetch Location Name (Reverse Geocoding)
            let locationName = 'Unbekannt';
            try {
                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=de&format=json`);
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results.length > 0) {
                    locationName = geoData.results[0].name; // City/Village name
                }
            } catch (e) {
                console.warn('Geocoding failed', e);
            }

            const widget = document.getElementById('weather-widget');
            const tempEl = document.getElementById('weather-temp');
            const iconEl = document.getElementById('weather-icon');
            const locEl = document.getElementById('weather-location');

            // Update DOM
            tempEl.textContent = `${Math.round(weather.temperature)}°C`;
            if (locEl) locEl.textContent = locationName;

            // Map Weather Code to Lucide Icon Name
            const code = weather.weathercode;
            let iconName = 'cloud';

            if (code === 0) iconName = 'sun'; // Clear sky
            else if (code >= 1 && code <= 3) iconName = 'cloud-sun'; // Partly cloudy
            else if (code >= 45 && code <= 48) iconName = 'cloud-fog'; // Fog
            else if (code >= 51 && code <= 67) iconName = 'cloud-rain'; // Rain
            else if (code >= 71 && code <= 77) iconName = 'snowflake'; // Snow
            else if (code >= 95) iconName = 'cloud-lightning'; // Thunderstorm

            // Update Icon
            iconEl.setAttribute('data-lucide', iconName);

            // Show Widget
            widget.classList.remove('hidden');

            // Refresh Icons
            if (window.lucide) lucide.createIcons();

        } catch (error) {
            console.error('Weather fetch failed', error);
        }
    }, (error) => {
        console.log('Location access denied or error', error);
    });
}
