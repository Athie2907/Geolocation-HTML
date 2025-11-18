let watchId = null; // Biến lưu ID của quá trình theo dõi (không dùng nữa nhưng giữ lại)
let map1 = null;
let map2 = null;
let currentMarker = null;
let map3 = null;

// ======================= CÁC HÀM KHỞI TẠO MAP ==========================

// Khởi tạo bản đồ 1 (Lấy vị trí hiện tại)
function initMap1(lat, lon) {
    if (map1) {
        map1.remove(); // Xoá bản đồ cũ (nếu có)
    }
    map1 = L.map('map1').setView([lat, lon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map1);
    L.marker([lat, lon]).addTo(map1).bindPopup("Vị trí hiện tại").openPopup();
}

// Khởi tạo bản đồ 2 (Tìm và Hiển thị Địa điểm)
function initMap2(lat, lon, name) {
    if (!map2) {
        map2 = L.map('map2').setView([lat, lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map2);
    } else {
        map2.setView([lat, lon], 15); // Đặt view mới
    }
    if(currentMarker){
        map2.removeLayer(currentMarker);// Xoá marker cũ
    }
    currentMarker = L.marker([lat, lon]).addTo(map2)
        .bindPopup(`Điểm đến: <b>${name}</b>`).openPopup();
}

// Khởi tạo bản đồ 3 (Tính Khoảng cách)
function initMap3() {
    if (!map3) {
        map3 = L.map('map3').setView([10.762622, 106.682210], 13); // Tọa độ trung tâm mặc định
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map3);
    }
    // Xóa tất cả các lớp marker cũ trên map3
    map3.eachLayer(function (layer) {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            map3.removeLayer(layer);
        }
    });
}

// ======================= HÀM XỬ LÝ LỖI VÀ VỊ TRÍ ==========================

function showError(err) {
    let msg ="Lỗi không xác định.";
    switch(err.code){
        case err.PERMISSION_DENIED:
            msg ="Người dùng từ chối yêu cầu Geolocation.";
            break;
        case err.POSITION_UNAVAILABLE:
            msg = "Thông tin vị trí không khả dụng.";
            break;
        case err.TIMEOUT:
            msg ="Hết thời gian chờ yêu cầu vị trí.";
            break;
    }
    // Ghi lỗi vào #currentPosition (chỉ dùng cho mục 1)
    document.getElementById("currentPosition").innerText = `Lỗi: ${msg} (${err.message})`;
}

// Công thức Haversine (tính khoảng cách đường chim bay)
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km (Bán kính Trái Đất)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) *
        Math.cos(lat2 * Math.PI/180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}


// ======================= 1. Lấy vị trí hiện tại ==========================

function getLocation() {
    if (!navigator.geolocation) {
        document.getElementById("currentPosition").innerText = "Trình duyệt không hỗ trợ Geolocation.";
        return;
    }
    navigator.geolocation.getCurrentPosition(showPosition, showError, {
        enableHighAccuracy: false, 
        timeout: 5000, 
        maximumAge: 60000 
    });
}

function showPosition(pos) {
    const lat = pos.coords.latitude; // Vĩ độ
    const lon = pos.coords.longitude; // Kinh độ
    const accuracy = pos.coords.accuracy; // Độ chính xác

    document.getElementById("currentPosition").innerHTML = 
        `Vĩ độ: <b>${lat}</b><br>
        Kinh độ: <b>${lon}</b><br>
        Độ chính xác: <b>${accuracy}m</b>`;

    // Khởi tạo bản đồ 1
    initMap1(lat, lon); 
}

// ======================= 2. Tìm và Hiển thị Địa điểm ==========================

async function searchAndDisplayMap() {
    const searchName = document.getElementById("searchName").value.trim();
    if (searchName === "") {
        document.getElementById("watchResult").innerHTML = "Vui lòng nhập tên địa điểm muốn tìm.";
        return;
    }
    document.getElementById("watchResult").innerHTML = "Đang tìm tọa độ...";

    try {
        // Geocoding (chuyển tên thành tọa độ)
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchName)}&format=json&limit=1`;
        
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const fixedName = data[0].display_name;
            
            document.getElementById("watchResult").innerHTML = 
                `Đã tìm thấy: <b>${fixedName}</b><br>
                Vĩ độ: <b>${lat}</b> - Kinh độ: <b>${lon}</b>`;
                
            initMap2(lat, lon, fixedName);

        } else {
            document.getElementById("watchResult").innerHTML = `Không tìm thấy tọa độ cho địa điểm: <b>${searchName}</b>.`;
        }
    } catch (error) {
        document.getElementById("watchResult").innerHTML = `Lỗi tìm kiếm tọa độ: ${error.message}`;
        console.error("Geocoding Error:", error);
    }
}


// ======================= 3. Tính Khoảng cách Đường chim bay ==========================

async function geocodeAndCalculateDistance() {
    initMap3(); // Khởi tạo 3
    const destinationName = document.getElementById("destinationName").value.trim();
    if (destinationName === "") {
        document.getElementById("distanceResult").innerHTML = "Vui lòng nhập tên địa điểm muốn đến.";
        return;
    }
    document.getElementById("distanceResult").innerHTML = "Đang tìm tọa độ...";

    try {
        // Geocoding
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destinationName)}&format=json&limit=1`;
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data && data.length > 0) {
            const fixedLat = parseFloat(data[0].lat);
            const fixedLon = parseFloat(data[0].lon);
            const fixedName = data[0].display_name;
            
            // Bước 2: Lấy vị trí hiện tại và tính toán khoảng cách
            calculateHaversineDistance(fixedLat, fixedLon, fixedName);

        } else {
            document.getElementById("distanceResult").innerHTML = `Không tìm thấy tọa độ cho địa điểm: <b>${destinationName}</b>.`;
        }
    } catch (error) {
        document.getElementById("distanceResult").innerHTML = `Lỗi tìm kiếm tọa độ: ${error.message}`;
        console.error("Geocoding Error:", error);
    }
}

function calculateHaversineDistance(fixedLat, fixedLon, fixedName) {
    if (!navigator.geolocation) {
        document.getElementById("distanceResult").innerText = "Trình duyệt không hỗ trợ Geolocation.";
        return;
    }

    document.getElementById("distanceResult").innerHTML = "Đã tìm thấy tọa độ đích. Đang lấy vị trí hiện tại...";

    // Tối ưu hóa lấy vị trí
    navigator.geolocation.getCurrentPosition((pos) => {
        const currentLat = pos.coords.latitude;
        const currentLon = pos.coords.longitude;

        // 1. Tính khoảng cách Haversine (đường chim bay)
        const d = distance(currentLat, currentLon, fixedLat, fixedLon);

        // 2. Hiển thị 2 điểm và đường thẳng (chim bay) trên bản đồ 3
        L.marker([currentLat, currentLon]).addTo(map3).bindPopup("Vị trí của tôi").openPopup();
        L.marker([fixedLat, fixedLon]).addTo(map3).bindPopup(fixedName).openPopup();
        L.polyline([[currentLat, currentLon], [fixedLat, fixedLon]], {color: 'red', weight: 4}).addTo(map3);

        // Fit map để hiển thị cả hai điểm
        const bounds = L.latLngBounds([[currentLat, currentLon], [fixedLat, fixedLon]]);
        map3.fitBounds(bounds, {padding: [50, 50]});

        // 3. Hiển thị kết quả
        document.getElementById("distanceResult").innerHTML = `
            <b>Vị trí hiện tại:</b> (${currentLat.toFixed(6)}, ${currentLon.toFixed(6)})<br>
            <b>Điểm đến:</b> ${fixedName}<br>
            <b>Khoảng cách đường chim bay:</b> <span style="color: red;">${d.toFixed(2)} km</span>
        `;

    }, (err) => {
        // Ghi lỗi Geolocation vào kết quả
        document.getElementById("distanceResult").innerHTML = `Lỗi lấy vị trí hiện tại: ${err.message}.`;
    }, {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 60000
    });
}