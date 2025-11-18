let watchId = null; //Biến lưu ID của quá trình theo dõi
//Khởi tạo bản đồ 1
let map1 = null;
function initMap1(lat, lon){
    if(map1){ //Xoá bản đồ cũ(nếu có)
        map1.remove();
    }
    map1 = L.map('map1').setView([lat, lon], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map1);
    L.marker([lat, lon]).addTo(map1).bindPopup("Vị trí hiện tại").openPopup();
}
//khởi tạo bản đồ 2
let map2 = null;
let currentMarker = null;
function initMap2(lat, lon) {
    if (!map2) {
        map2 = L.map('map2').setView([lat, lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map2);
    } else {
        map2.setView([lat, lon], map2.getZoom());
    }
    if(currentMarker){
        map2.removeLayer(currentMarker);//Xoá marker cũ
    }
    currentMarker = L.marker([lat, lon]).addTo(map2)
        .bindPopup("Vị trí đang theo dõi").openPopup();
}
//khởi tạo bản đồ 3
let map3 = null;
let routingControl = null;
function initMap3() {
    if (!map3) {
        map3 = L.map('map3').setView([10.762622, 106.682210], 13); // Tọa độ trung tâm mặc định
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map3);
    } else { //Xoá đường đi cũ(nếu có)
        if (routingControl) {
            map3.removeControl(routingControl);
            routingControl = null;
        }
    }
}

//1. Lấy vị trí
function getLocation(){
    if(!navigator.geolocation){
        document.getElementById("currentPosition").innerText = "Trình duyệt không hỗ trợ Geolocation.";
        return;
    }
    navigator.geolocation.getCurrentPosition(showPosition, showError);
}

function showPosition(pos){
    const lat = pos.coords.latitude; //Vĩ độ
    const lon = pos.coords.longitude; //Kinh độ
    const accuracy = pos.coords.accuracy; //Độ chính xác
    document.getElementById("currentPosition").innerHTML = `Vĩ độ: <b>${lat}</b><br>Kinh độ: <b>${lon}</b><br>Độ chính xác: <b>${pos.coords.accuracy}m</b>`;
    initMap1(lat, lon);
}
function showError(err){
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
    document.getElementById("currentPosition").innerText = `Lỗi: ${msg} (${err.message})`;
}

//2.Theo dõi vị trí
function watchMyPosition(){
    if(!navigator.geolocation){
        document.getElementById("watchResult").innerText ="Trình duyệt không hỗ trợ Geolocation.";
        return;
    }
    if(watchId !== null){
        document.getElementById("watchResult").innerText = "Đã bật chế độ theo dõi vị trí."
    }
    //Bắt đầu theo dõi
    watchId = navigator.geolocation.watchPosition((pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const speed = pos.coords.speed || "Không xác định";

        document.getElementById("watchResult").innerHTML =
            `Vĩ độ: <b>${lat}</b><br>
            Kinh độ: <b>${lon}</b><br>
            Tốc độ: <b>${speed ? (speed * 3.6).toFixed(2) + " km/h" : "Không xác định"}</b><br>
            Cập nhật lúc: <b>${new Date(pos.timestamp).toLocaleTimeString()}</b>`;

        // Cập nhật vị trí trên bản đồ 2
        initMap2(lat, lon);
    }, showError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });

    document.getElementById("watchResult").innerHTML = "Đang chờ vị trí... (Đang theo dõi)";
}
function clearWatchPosition(){
    if(watchId !== null){
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        document.getElementById("watchResult").innerHTML = "Đã ngừng theo dõi vị trí.";

        // Xóa marker trên bản đồ 2 nếu có
        if (map2 && currentMarker) {
            map2.removeLayer(currentMarker);
            currentMarker = null;
        }
    } else{
        document.getElementById("watchResult").innerHTML = "Chưa có quá trình theo dõi nào được bật.";
    }
}
//Công thức Haversine
function distance(lat1, lon1, lat2, lon2){
    const R = 6371; // bán kính Trái Đất
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Bước 1: Geocoding (chuyển tên địa điểm thành tọa độ)
async function geocodeAndCalculate() {
    initMap3(); // Khởi tạo bản đồ 3

    const destinationName = document.getElementById("destinationName").value.trim();
    if (destinationName === "") {
        document.getElementById("distanceResult").innerHTML = "Vui lòng nhập tên địa điểm muốn đến.";
        return;
    }
    document.getElementById("distanceResult").innerHTML = "Đang tìm tọa độ...";

    try {
        // Sử dụng dịch vụ Nominatim của OSM (API miễn phí)
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destinationName)}&format=json&limit=1`;
        
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data && data.length > 0) {
            const fixedLat = parseFloat(data[0].lat);
            const fixedLon = parseFloat(data[0].lon);
            const fixedName = data[0].display_name;
            
            // Bước 2: Lấy vị trí hiện tại và tính toán
            calculateRoute(fixedLat, fixedLon, fixedName);

        } else {
            document.getElementById("distanceResult").innerHTML = `Không tìm thấy tọa độ cho địa điểm: <b>${destinationName}</b>.`;
        }
    } catch (error) {
        document.getElementById("distanceResult").innerHTML = `Lỗi tìm kiếm tọa độ: ${error.message}`;
        console.error("Geocoding Error:", error);
    }
}

// Bước 2: Tính toán khoảng cách/đường đi
function calculateRoute(fixedLat, fixedLon, fixedName) {
    if (!navigator.geolocation) {
        document.getElementById("distanceResult").innerText = "Trình duyệt không hỗ trợ Geolocation.";
        return;
    }

    document.getElementById("distanceResult").innerHTML = "Đã tìm thấy tọa độ. Đang lấy vị trí hiện tại...";

    navigator.geolocation.getCurrentPosition((pos) => {
        const currentLat = pos.coords.latitude;
        const currentLon = pos.coords.longitude;

        // 1. Tính khoảng cách Haversine (đường chim bay)
        const d = distance(currentLat, currentLon, fixedLat, fixedLon);
        
        // 2. Hiển thị đường đi bằng Leaflet Routing Machine (sử dụng OSRM)
        
        // Xóa đường đi cũ nếu có
        if (routingControl) {
            map3.removeControl(routingControl);
        }

        const waypoints = [
            L.latLng(currentLat, currentLon), // Vị trí hiện tại
            L.latLng(fixedLat, fixedLon)     // Vị trí đích
        ];

        routingControl = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false, // Tắt tính toán lại khi kéo marker
            lineOptions: {styles: [{color: '#007bff', weight: 6}]},
            // Sử dụng OSRM
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            geocoder: L.Control.Geocoder.nominatim(),
            showAlternatives: false,
            // Đặt tên cho các điểm
            createMarker: function(i, waypoint, n) {
                const label = i === 0 ? "Vị trí của tôi" : fixedName;
                return L.marker(waypoint.latLng).bindPopup(label).openPopup();
            }
        }).addTo(map3);

        // Lắng nghe sự kiện khi tìm được đường đi
        routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            const routeDistance = (summary.totalDistance / 1000).toFixed(2); // Tổng khoảng cách đường đi
            const routeTime = summary.totalTime; // Tổng thời gian đi (giây)

            const minutes = Math.floor(routeTime / 60);
            const seconds = Math.round(routeTime % 60);
            
            document.getElementById("distanceResult").innerHTML = `
                <b>Điểm đến:</b> ${fixedName} (${fixedLat.toFixed(6)}, ${fixedLon.toFixed(6)})<br>
                <b>Khoảng cách đường chim bay (Haversine):</b> ${d.toFixed(2)} km<br>
                <b>Khoảng cách theo đường đi (OSRM):</b> <span style="color: green;">${routeDistance} km</span><br>
                <b>Thời gian ước tính:</b> <span style="color: green;">${minutes} phút ${seconds} giây</span>
            `;

             // Fit map to show the whole route
            map3.fitBounds(routingControl.getPlan().getBounds(), {padding: [20, 20]});
        });

        routingControl.on('routingerror', function(e) {
            document.getElementById("distanceResult").innerHTML = `Lỗi tìm đường đi (OSRM): ${e.message}. Vẫn hiển thị khoảng cách đường chim bay: <b>${d.toFixed(2)} km</b>`;
        });

    }, (err) => {
        showError(err);
        document.getElementById("distanceResult").innerHTML = `Lỗi lấy vị trí hiện tại: ${document.getElementById("distanceResult").innerText}.`;
    });
}