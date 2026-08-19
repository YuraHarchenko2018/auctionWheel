const canvas = document.getElementById("canvas");
const winnerDisplay = document.getElementById("winnerDisplay");

const ctx = canvas.getContext("2d");
var theWinner;

const state = {
    data: [],
    onChangeCallbacks: [],
    onChange: function(callback) {
        this.onChangeCallbacks.push(callback);
    },
    getData: function() {
        return this.data;
    },
    setData: function(newData) {
        this.data = newData;
        console.log(this.onChangeCallbacks)
        this.onChangeCallbacks.forEach(callback => callback(newData));
    },
    pushDataItem: function(newItem) {
        this.data.push(newItem);
        this.onChangeCallbacks.forEach(callback => callback(this.data));
    },
    removeData: function(id) {
        this.data = this.data.filter(item => item.id !== id);
        this.onChangeCallbacks.forEach(callback => callback(this.data));
    }
}

// re-render the wheel whenever the state changes
state.onChange((data) => {
    const updatedData = calculateSliceAngles(data);
    drawWheel(0, updatedData);
})

// save the state to localStorage whenever it changes
state.onChange((data) => {
    localStorage.setItem("wheelData", JSON.stringify(data));
})

async function getTrueRandom() {
    const response = await fetch(
        "https://www.random.org/decimal-fractions/?num=1&dec=5&col=1&format=plain&rnd=new"
    );

    const text = await response.text();

    return parseFloat(text);
}

function calculateSliceAngles(data) {
    const totalPrice = data.reduce((sum, slice) => sum + slice.price, 0);

    const updatedData = data.map(slice => {
        const sliceAngle = (slice.price / totalPrice) * 360;

        return {
            ...slice,
            angle: +sliceAngle.toFixed(2)
        };
    });

    return updatedData;
}

function drawPointer(
    x = 400,
    y = 400,
    radius = 300
) {
    ctx.fillStyle = "white";

    ctx.beginPath();

    ctx.moveTo(x, y - radius);
    ctx.lineTo(x - 15, y - radius - 20);
    ctx.lineTo(x + 15, y - radius - 20);

    ctx.closePath();
    ctx.fill();
}

function drawCircle(
    x = 400,
    y = 400,
    radius = 300
) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    drawPointer(x, y + 20, radius);
}

function drawPizzaSlice(
    startAngle,
    endAngle,
    fillColor = "#FFD700",
    borderColor = "white",
    radius = 300,
    x = 400,
    y = 400
) {
    const startRadians = startAngle * Math.PI / 180;
    const endRadians = endAngle * Math.PI / 180;

    const startX = x + radius * Math.cos(startRadians);
    const startY = y + radius * Math.sin(startRadians);

    ctx.beginPath();

    // Center → start of the slice
    ctx.moveTo(x, y);

    // Line to the edge
    ctx.lineTo(startX, startY);

    // Arc
    ctx.arc(
        x,
        y,
        radius,
        startRadians,
        endRadians
    );

    // Return to the center
    ctx.lineTo(x, y);

    // Fill the slice
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Draw the border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawSliceText(
    text,
    startAngle,
    endAngle,
    textRadius = 0.65,
    radius = 300,
    x = 400,
    y = 400
) {
    const sliceAngle = endAngle - startAngle;

    // Do not draw text in small slices
    if (sliceAngle < 15) {
        return;
    }

    const middleAngle = (startAngle + endAngle) / 2;
    const radians = middleAngle * Math.PI / 180;

    const textX = x + radius * textRadius * Math.cos(radians);
    const textY = y + radius * textRadius * Math.sin(radians);

    ctx.save();

    // Move the coordinate origin to the text position
    ctx.translate(textX, textY);

    // Rotate the text in the direction from the center to the edge
    ctx.rotate(radians);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(text, 0, 0);

    ctx.restore();
}

function spinWheel(
    updatedData = [],
    duration = 3000,
    easing = "easeOut",
    rotations = 5
) {
    const startTime = performance.now();
    const totalRotation = rotations * 360;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;

        let progress = Math.min(elapsed / duration, 1);

        // Select the easing type
        switch (easing) {
            case "linear":
                break;

            case "easeOut":
                progress = 1 - Math.pow(1 - progress, 3);
                break;

            case "easeInOut":
                progress = progress < 0.5 
                    ? 4 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                break;

            default:
                progress = 1 - Math.pow(1 - progress, 3);
        }

        const rotation = totalRotation * progress;

        drawWheel(rotation, updatedData);

        if (elapsed < duration) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

function drawWheel(rotation = 0, updatedData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let currentAngle = rotation;

    updatedData.forEach(slice => {

        const startAngle = currentAngle;
        const endAngle = currentAngle + slice.angle;

        const normalizedStartAngle = startAngle % 360;
        const normalizedEndAngle = endAngle % 360;

        if (normalizedStartAngle < 270 && normalizedEndAngle > 270) {
            theWinner = slice;
            winnerDisplay.textContent = `${slice.label} ($${slice.price})`;
        }

        drawPizzaSlice(
            startAngle,
            endAngle,
            slice.color
        );

        drawSliceText(
            `${slice.label}: $${slice.price}`,
            startAngle,
            endAngle
        );

        currentAngle = endAngle;
    });

    drawCircle();
}


// Handle spin button click
const spinButton = document.getElementById("spinButton");
const durationInput = document.getElementById("durationInput");

spinButton.addEventListener("click", async () => {
    const updatedData = calculateSliceAngles(state.getData());
    const randomNumber = await getTrueRandom() || Math.random();

    const seconds = parseFloat(durationInput.value) || 5;
    const duration = seconds * 1000;

    // From 5 to 7 full rotations
    const rotations = randomNumber * 6 + 3 + seconds;
    console.log("🚀 ~ rotations:", rotations)

    spinWheel(
        updatedData,
        duration,
        "easeInOut",
        rotations
    );
});


// Handle adding new options
const optionLabelInput = document.getElementById("optionLabelInput");
const optionPriceInput = document.getElementById("optionPriceInput");
const addOptionButton = document.getElementById("addOptionButton");

addOptionButton.addEventListener("click", () => {
    const label = optionLabelInput.value.trim();
    const price = parseFloat(optionPriceInput.value);

    if (label && !isNaN(price)) {
        state.pushDataItem({
            id: state.getData().length,
            label,
            price,
            color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        });
        optionLabelInput.value = "";
        optionPriceInput.value = "";
    }
});


// Render option list
const optionsList = document.getElementById("optionsList");

state.onChange((data) => {
    optionsList.innerHTML = "";
    data.forEach((option) => {
        const optionElement = document.createElement("div");
        optionElement.className = "optionItem";
        optionElement.innerHTML = `
            <span class="optionLabel">${option.label}</span>
            <span class="optionPrice">$${option.price.toFixed(2)}</span>
            <button class="removeOptionButton" data-id="${option.id}">Remove</button>
        `;
        optionsList.appendChild(optionElement);
    });
});

// Handle removing options
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("removeOptionButton")) {
        const id = parseInt(event.target.getAttribute("data-id"));
        state.removeData(id);
    }
});


// Startup
const savedData = localStorage.getItem("wheelData");

if (savedData) {
    state.setData(JSON.parse(savedData));
} else {
    state.setData([
        { id: 0, label: "Action", price: 400, color: "#FFD700" },
        { id: 1, label: "Youtube Video", price: 500, color: "#FF4500" },
        { id: 2, label: "Game", price: 1000, color: "#32CD32" },
        { id: 3, label: "Song", price: 5000, color: "#1E90FF" },
        { id: 4, label: "Entertainment", price: 4800, color: "#FF69B4" },
        { id: 5, label: "Other", price: 200, color: "#8A2BE2" },
    ]);
}
