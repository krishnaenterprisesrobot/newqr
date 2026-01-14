const API = "https://script.google.com/macros/s/AKfycbwWa0WNM5koQ2xt4tc5ABb9HTBJXxjQSIrZAp0Fa6UG0sxV8FW4Zo_X6fXRG8TVWde4/exec"; 

let lastValue = "";
let idleTimeout = null;

function setIdle() {
    document.getElementById('n').innerText = "System Ready";
    document.getElementById('a').innerText = "0";
    document.getElementById('q').innerHTML = `<div class="idle-msg">Waiting for transaction...</div>`;
    lastValue = "IDLE";
    if (idleTimeout) clearTimeout(idleTimeout);
}

async function update() {
    try {
        // Fetch with cache-busting to ensure speed
        const response = await fetch(`${API}?t=${Date.now()}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const live = data.live;

        // Reset to IDLE if no active amount or ID is found
        if (!live || !live.upiid || !live.amount || live.amount == 0) {
            if (lastValue !== "IDLE") setIdle();
            return;
        }

        const currentValue = live.amount + live.upiid;
        
        // Only trigger update if data actually changed
        if (currentValue !== lastValue) {
            // Clear any existing countdown
            if (idleTimeout) clearTimeout(idleTimeout);

            const upiString = `upi://pay?pa=${live.upiid}&pn=${encodeURIComponent(live.name)}&am=${live.amount}&cu=INR`;
            // Using QuickChart API for faster response times
            const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiString)}&size=300&margin=1`;

            // PRE-LOAD IMAGE: Wait for the image to download before showing it
            const tempImg = new Image();
            tempImg.src = qrUrl;
            tempImg.onload = () => {
                document.getElementById('a').innerText = live.amount;
                document.getElementById('n').innerText = live.name;
                const qrContainer = document.getElementById('q');
                qrContainer.innerHTML = '';
                qrContainer.appendChild(tempImg);
                
                lastValue = currentValue;

                // Start the 2-minute timer ONLY after successful render
                idleTimeout = setTimeout(setIdle, 120000);
            };
        }
    } catch (error) {
        console.error("Sync Error:", error);
    }
}

// Start polling
update(); 
setInterval(update, 3000);
