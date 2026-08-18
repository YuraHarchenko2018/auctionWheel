const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const data = [
    { label: "Action", price: 400, color: "#FFD700" },
    { label: "Youtube Video", price: 500, color: "#FF4500" },
    { label: "Game", price: 1000, color: "#32CD32" },
    { label: "Song", price: 5000, color: "#1E90FF" },
    { label: "Entertainment", price: 4800, color: "#FF69B4" },
    { label: "Other", price: 200, color: "#8A2BE2" },
];

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

    // Центр → начало сектора
    ctx.moveTo(x, y);

    // Линия к краю
    ctx.lineTo(startX, startY);

    // Дуга
    ctx.arc(
        x,
        y,
        radius,
        startRadians,
        endRadians
    );

    // Возвращаемся в центр
    ctx.lineTo(x, y);

    // Заливаем сектор
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Рисуем границу
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

    // Не рисуем текст в маленьких секторах
    if (sliceAngle < 15) {
        return;
    }

    const middleAngle = (startAngle + endAngle) / 2;
    const radians = middleAngle * Math.PI / 180;

    const textX = x + radius * textRadius * Math.cos(radians);
    const textY = y + radius * textRadius * Math.sin(radians);

    ctx.save();

    // Перемещаем начало координат в позицию текста
    ctx.translate(textX, textY);

    // Поворачиваем текст по направлению от центра к краю
    ctx.rotate(radians);

    ctx.fillStyle = "black";
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

        // Выбираем тип анимации
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

const updatedData = calculateSliceAngles(data);
drawWheel(0, updatedData);

const spinButton = document.getElementById("spinButton");
const durationInput = document.getElementById("durationInput");

spinButton.addEventListener("click", async () => {
    const randomNumber = await getTrueRandom();

    const seconds = parseFloat(durationInput.value) || 5;
    const duration = seconds * 1000;

    // От 5 до 7 полных оборотов
    const rotations = randomNumber * 6 + 3 + seconds;
    console.log("🚀 ~ rotations:", rotations)

    spinWheel(
        updatedData,
        duration,
        "easeInOut",
        rotations
    );
});