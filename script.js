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
    document.getElementById("currentPosition").innerHTML = `Vĩ độ: <b>${lat}</b><br>Kinh độ: <b>${lon}</b>`;
    const mapURL = `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`;
    document.getElementById("map").innerHTML = `<iframe src="${mapURL}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}
function showError(err){
    document.getElementById("currentPosition").innerText = "Lỗi: " + err.message;
}
function watchMyPosition(){
    navigator.geolocation.watchPosition((pos) => {
        document.getElementById("watchResult").innerHTML = `Vĩ độ: <b>${pos.coords.latitude}</b><br> Kinh độ: <b>${pos.coords.longitude}</b><br> Tốc độ: <b>${pos.coords.speed || "Không xác định"}</b>`;
    });
}
const fixedLat = 10.762622;
const fixedLon = 106.682210;
function calculateDistance(){
    navigator.geolocation.getCurrentPosition((pos) =>{
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const d = distance(lat, lon, fixedLat, fixedLon);
        document.getElementById("distanceResult").innerHTML = `Khoảng cách đến trường: <b>${d.toFixed(2)} km</b>`;
    });
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