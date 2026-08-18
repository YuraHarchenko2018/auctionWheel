const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const data = [
    { label: "Пуки каки", price: 400, color: "#FFD700" },
    { label: "Видео ютуб", price: 500, color: "#FF4500" },
    { label: "Майнкрафт", price: 1000, color: "#32CD32" },
    { label: "Артур пирожков", price: 5000, color: "#1E90FF" },
    { label: "пиво и в танки", price: 4800, color: "#FF69B4" },
    { label: "птица любви", price: 200, color: "#8A2BE2" },
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

    function getProgress(normalizedTime) {
        if (normalizedTime <= 0) return 0;
        if (normalizedTime >= 1) return 1;

        // Временные точки
        const t0 = 0.00;
        const t1 = 0.10;
        const t2 = 0.33;   // пик скорости
        const t3 = 0.58;
        const t4 = 0.80;
        const t5 = 1.00;

        // Прогресс
        const p0 = 0.00;
        const p1 = 0.03;
        const p2 = 0.46;
        const p3 = 0.74;
        const p4 = 0.915;
        const p5 = 1.00;

        // Скорости — после пика только снижаем, без завышения
        const v0 = 0.0;
        const v1 = 0.75;
        const v2 = 2.15;   // пик
        const v3 = 1.35;
        const v4 = 0.68;
        const v5 = 0.0;

        function hermite(t, tStart, tEnd, pStart, pEnd, vStart, vEnd) {
            const dt = tEnd - tStart;
            const s = (t - tStart) / dt;
            const s2 = s * s;
            const s3 = s2 * s;

            const h00 =  2 * s3 - 3 * s2 + 1;
            const h10 =      s3 - 2 * s2 + s;
            const h01 = -2 * s3 + 3 * s2;
            const h11 =      s3 -     s2;

            return h00 * pStart + h10 * (vStart * dt) + h01 * pEnd + h11 * (vEnd * dt);
        }

        if (normalizedTime <= t1) {
            return hermite(normalizedTime, t0, t1, p0, p1, v0, v1);
        }
        if (normalizedTime <= t2) {
            return hermite(normalizedTime, t1, t2, p1, p2, v1, v2);
        }
        if (normalizedTime <= t3) {
            return hermite(normalizedTime, t2, t3, p2, p3, v2, v3);
        }
        if (normalizedTime <= t4) {
            return hermite(normalizedTime, t3, t4, p3, p4, v3, v4);
        }
        return hermite(normalizedTime, t4, t5, p4, p5, v4, v5);
    }

    // function getProgress(normalizedTime) {
    //     console.log("🚀 ~ getProgress ~ normalizedTime:", normalizedTime)
    //     const ACCEL_END = 0.1;
    //     const BRAKE_START = 0.6;      // можно ставить любое значение

    //     if (normalizedTime <= 0) return 0;
    //     if (normalizedTime >= 1) return 1;

    //     // ——— Разгон ———
    //     if (normalizedTime <= ACCEL_END) {
    //         const p = normalizedTime / ACCEL_END;
    //         // 2p² - p³
    //         return 0.1 * (2 * p * p - p * p * p);
    //     }

    //     // ——— Постоянная скорость ———
    //     if (normalizedTime <= BRAKE_START) {
    //         return normalizedTime;           // скорость = 1
    //     }

    //     // ——— Торможение ———
    //     const progressAtBrakeStart = BRAKE_START;
    //     const remaining = 1 - progressAtBrakeStart;

    //     const p = (normalizedTime - BRAKE_START) / (1 - BRAKE_START);

    //     // Кривая с непрерывной скоростью: g(0)=0, g(1)=1, g'(0)=1, g'(1)=0
    //     const eased = p + p * p - p * p * p;

    //     return progressAtBrakeStart + remaining * eased;
    // }

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
                progress = getProgress(progress);
                break;

            case "oldEaseInOut":
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
    const rand = Math.random();
    const randomNumber = await getTrueRandom();

    const seconds = parseFloat(durationInput.value) || 5;
    const duration = seconds * 1000;

    // От 5 до 7 полных оборотов
    const rotations = randomNumber * 6 + 3 + seconds;
    console.log("🚀 ~ rotations:", rotations)

    spinWheel(
        updatedData,
        duration,
        "oldEaseInOut",
        rotations
    );
});