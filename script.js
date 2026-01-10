const API = "https://script.google.com/macros/s/AKfycbwWa0WNM5koQ2xt4tc5ABb9HTBJXxjQSIrZAp0Fa6UG0sxV8FW4Zo_X6fXRG8TVWde4/exec"; 

let lastValue = "";
let idleTimeout;

function setIdle() {
    document.getElementById('n').innerText = "System Ready";
    document.getElementById('a').innerText = "0";
    document.getElementById('q').innerHTML = `<div class="idle-msg">Waiting for QR...</div>`;
    lastValue = "IDLE";
}

async function update() {
    try {
        // Prevent browser caching by adding a timestamp
        const response = await fetch(`${API}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // If amount is 0, empty, or null -> Go Idle
        if (!data.live.upiid || !data.live.amount || data.live.amount == 0) {
            if (lastValue !== "IDLE") setIdle();
            return;
        }

        const currentValue = data.live.amount + data.live.upiid;
        
        if (currentValue !== lastValue) {
            clearTimeout(idleTimeout);
            
            document.getElementById('n').innerText = data.live.name;
            document.getElementById('a').innerText = data.live.amount;
            
            const upi = `upi://pay?pa=${data.live.upiid}&pn=${encodeURIComponent(data.live.name)}&am=${data.live.amount}&cu=INR`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upi)}`;
            
            document.getElementById('q').innerHTML = `<img src="${qrUrl}" alt="QR Code">`;
            lastValue = currentValue;

            // Start 2-minute timer (120,000 ms)
            idleTimeout = setTimeout(setIdle, 120000);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        document.getElementById('n').innerText = "Offline - Retrying...";
    }
}

// Initial run
update(); 
// Poll every 3 seconds
setInterval(update, 3000);