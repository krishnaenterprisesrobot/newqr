const API = "https://script.google.com/macros/s/AKfycbwWa0WNM5koQ2xt4tc5ABb9HTBJXxjQSIrZAp0Fa6UG0sxV8FW4Zo_X6fXRG8TVWde4/exec"; 

let lastValue = "";
let idleTimeout = null;

function setIdle() {
    document.getElementById('n').innerText = "System Standby";
    document.getElementById('a').innerText = "0";
    document.getElementById('q').innerHTML = `
        <div class="idle-ui">
            <div class="scanner-line"></div>
            <p>AWAITING SIGNAL</p>
        </div>`;
    lastValue = "IDLE";
}

async function update() {
    try {
        const response = await fetch(`${API}?t=${Date.now()}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const live = data.live;

        // Check for empty or zero state
        if (!live || !live.upiid || !live.amount || live.amount == 0) {
            if (lastValue !== "IDLE") setIdle();
            return;
        }

        const currentValue = live.amount + live.upiid;
        
        // Only update if backend data changed
        if (currentValue !== lastValue) {
            if (idleTimeout) clearTimeout(idleTimeout);

            const upiString = `upi://pay?pa=${live.upiid}&pn=${encodeURIComponent(live.name)}&am=${live.amount}&cu=INR`;
            const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiString)}&size=300&margin=1&ecLevel=H`;

            const tempImg = new Image();
            tempImg.src = qrUrl;
            
            tempImg.onload = () => {
                // Update text and trigger pop animation
                const amtEl = document.getElementById('a');
                amtEl.innerText = live.amount;
                amtEl.parentElement.classList.add('pop-effect');
                setTimeout(() => amtEl.parentElement.classList.remove('pop-effect'), 400);

                document.getElementById('n').innerText = live.name;
                
                // Replace QR with "Float In" animation
                const qrContainer = document.getElementById('q');
                qrContainer.innerHTML = '';
                qrContainer.appendChild(tempImg);
                
                lastValue = currentValue;

                // Return to idle after 2 minutes of no changes
                idleTimeout = setTimeout(setIdle, 120000);
            };
        }
    } catch (error) {
        console.error("3D Sync Error:", error);
    }
}

// 2-second interval polling
setInterval(update, 2000);
update();
