const API = "https://script.google.com/macros/s/AKfycbwWa0WNM5koQ2xt4tc5ABb9HTBJXxjQSIrZAp0Fa6UG0sxV8FW4Zo_X6fXRG8TVWde4/exec"; 
let lastValue = "";
let isSuccessState = false;

function setIdle() {
    document.getElementById('a').innerText = "0";
    document.getElementById('n').innerText = "System Standby";
    document.getElementById('q').innerHTML = `
        <div class="idle-ui">
            <div class="scanner-line"></div>
            <p>AWAITING SIGNAL</p>
        </div>`;
    lastValue = "IDLE";
}

function playSound() {
    document.getElementById("upiSound").play().catch(() => {});
}

function createConfetti() {
    for(let i=0; i<60; i++) {
        let c = document.createElement("div");
        c.className = "confetti";
        c.style.left = Math.random()*100+"vw";
        c.style.animationDuration = (Math.random()*3+2)+"s";
        c.style.background = `hsl(${Math.random()*360}, 100%, 50%)`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 5000);
    }
}

function showSuccess(amount, name) {
    if(isSuccessState) return;
    isSuccessState = true;
    
    document.getElementById('success-amt').innerText = "₹" + amount;
    document.getElementById('success-to').innerText = name;
    document.getElementById('success-tx').innerText = "TX" + Math.floor(Math.random()*9999999);
    
    document.getElementById('success-overlay').style.display = 'flex';
    playSound();
    createConfetti();

    setTimeout(() => {
        document.getElementById('success-overlay').style.display = 'none';
        setIdle();
        isSuccessState = false;
    }, 5000);
}

async function update() {
    if (isSuccessState) return; 

    try {
        const response = await fetch(`${API}?t=${Date.now()}`);
        const data = await response.json();
        const live = data.live;

        if (!live || !live.upiid || !live.amount || live.amount == 0 || live.amount === "0") {
            if (lastValue !== "IDLE") setIdle();
            return;
        }

        if (live.amount === "SUCCESS" || live.upiid === "SUCCESS_FLAG") {
            const currentAmt = document.getElementById('a').innerText;
            const currentName = document.getElementById('n').innerText;
            if(currentAmt !== "0") {
                showSuccess(currentAmt, currentName);
            }
            return;
        }

        const currentValue = live.amount + live.upiid;
        if (currentValue !== lastValue) {
            const upiString = `upi://pay?pa=${live.upiid}&pn=${encodeURIComponent(live.name)}&am=${live.amount}&cu=INR`;
            const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiString)}&size=300&margin=1&ecLevel=H`;

            document.getElementById('a').innerText = live.amount;
            document.getElementById('n').innerText = live.name;
            document.getElementById('q').innerHTML = `<img src="${qrUrl}" style="width:85%; border-radius:15px;">`;
            
            lastValue = currentValue;
        }
    } catch (e) { 
        console.error("Sync Error:", e); 
    }
}

// Start polling
setInterval(update, 2000);

// Interaction listener to unlock audio playback (browsers block auto-play)
document.body.addEventListener('click', () => {
    const audio = document.getElementById("upiSound");
    audio.load();
}, {once: true});
