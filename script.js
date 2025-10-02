
// ======= DATA =======
let dataKelas = JSON.parse(localStorage.getItem("dataKelas")) || {
  "Kelas 1": [{nama: "Ani", gender: "P"}, {nama: "Budi", gender: "L"}],
  "Kelas 2": [{nama: "Cici", gender: "P"}, {nama: "Dedi", gender: "L"}],
  "Kelas 3": [{nama: "Eka", gender: "P"}, {nama: "Fajar", gender: "L"}],
  "Kelas 4": [{nama: "Gina", gender: "P"}, {nama: "Hadi", gender: "L"}],
  "Kelas 5": [], "Kelas 6": []
};
let akunGuru = JSON.parse(localStorage.getItem("akunGuru")) || [];
let absensiLog = JSON.parse(localStorage.getItem("absensiLog")) || [];

const statusOptions = ["Hadir", "Izin", "Sakit", "Alpha", "Terlambat"];
let userRole = null, userKelas = null;

// ======= UTIL =======
function saveAll(){
  localStorage.setItem("dataKelas", JSON.stringify(dataKelas));
  localStorage.setItem("akunGuru", JSON.stringify(akunGuru));
  localStorage.setItem("absensiLog", JSON.stringify(absensiLog));
}

// ======= LOGIN =======
function login(){
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  if(u === "admin" && p === "1234"){
    userRole = "admin";
    document.getElementById("login").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    document.getElementById("grafikPanel").style.display = "none";
    renderGuruList();
  } else {
    const guru = akunGuru.find(g => g.username === u && g.password === p);
    if(guru){
      userRole = "guru";
      userKelas = guru.kelas;
      document.getElementById("login").style.display = "none";
      document.getElementById("guruPanel").style.display = "block";
      renderTabel(userKelas);
    } else {
      alert("❌ Username/Password salah!");
    }
  }
}
function logout(){
  userRole = null; userKelas = null;
  document.getElementById("login").style.display = "block";
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("guruPanel").style.display = "none";
  document.getElementById("grafikPanel").style.display = "none";
}

// ======= GURU =======
function renderTabel(kelas){
  const container = document.getElementById("kelas-container");
  container.innerHTML = "";
  if(!dataKelas[kelas]) return;
  let html = `<h3>${kelas}</h3><table><tr><th>Nama</th><th>Gender</th><th>Status</th></tr>`;
  dataKelas[kelas].forEach(s => {
    const key = `${kelas}-${s.nama}`;
    const saved = localStorage.getItem(key) || "Hadir";
    html += `<tr><td>${s.nama}</td><td>${s.gender}</td><td>
      <select id="${key}">${statusOptions.map(opt => `<option value="${opt}" ${saved===opt?"selected":""}>${opt}</option>`).join("")}</select>
      </td></tr>`;
  });
  html += "</table>";
  container.innerHTML = html;
}
function simpanAbsensi(){
  if(!userKelas) return;
  const today = new Date(); const tgl = today.toISOString().split("T")[0];
  dataKelas[userKelas].forEach(s => {
    const key = `${userKelas}-${s.nama}`;
    const val = document.getElementById(key).value;
    localStorage.setItem(key, val);
    absensiLog.push({tanggal: tgl, kelas: userKelas, nama: s.nama, status: val});
  });
  saveAll();
  alert("✅ Absensi tersimpan!");
}
function unduhCSV(){
  if(!userKelas) return;
  let csv = "Tanggal,Kelas,Nama,Status\n";
  absensiLog.filter(l => l.kelas === userKelas).forEach(l => { csv += `${l.tanggal},${l.kelas},${l.nama},${l.status}\n`; });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "absensi_" + userKelas + ".csv"; a.click(); URL.revokeObjectURL(url);
}

// ======= ADMIN =======
function tambahSiswa(){
  const nama = document.getElementById("namaBaru").value.trim();
  const gender = document.getElementById("genderBaru").value;
  const kelas = document.getElementById("kelasBaru").value;
  if(!nama){ alert("Nama tidak boleh kosong!"); return; }
  dataKelas[kelas].push({nama, gender});
  saveAll();
  document.getElementById("namaBaru").value = "";
  alert("✅ Siswa baru ditambahkan!");
}
function tambahGuru(){
  const user = document.getElementById("guruUser").value.trim();
  const pass = document.getElementById("guruPass").value.trim();
  const kelas = document.getElementById("guruKelas").value;
  if(!user || !pass){ alert("Username & Password wajib diisi!"); return; }
  akunGuru.push({username: user, password: pass, kelas});
  saveAll();
  document.getElementById("guruUser").value = ""; document.getElementById("guruPass").value = "";
  renderGuruList();
  alert("✅ Akun guru ditambahkan!");
}
function hapusGuru(i){ if(!confirm("Hapus akun guru ini?")) return; akunGuru.splice(i,1); saveAll(); renderGuruList(); }
function resetPass(i){ akunGuru[i].password = "1234"; saveAll(); renderGuruList(); alert("✅ Password direset ke '1234'"); }
function renderGuruList(){
  const ul = document.getElementById("daftarGuru"); ul.innerHTML = "";
  akunGuru.forEach((g,i) => {
    ul.innerHTML += `<li>${g.username} (${g.kelas}) 
      <button onclick="resetPass(${i})">Reset</button>
      <button class="danger" onclick="hapusGuru(${i})">Hapus</button></li>`;
  });
}

// ======= TEMPLATE CSV =======
function downloadTemplate(){
  const csv = "Nama,Kelas\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "template_siswa.csv"; a.click(); URL.revokeObjectURL(url);
}
function uploadTemplate(){
  const fileInput = document.getElementById("uploadFile");
  if(!fileInput.files.length){ alert("❌ Pilih file CSV terlebih dahulu!"); return; }
  const file = fileInput.files[0]; const reader = new FileReader();
  reader.onload = function(e){
    const text = e.target.result; const lines = text.trim().split("\\n");
    for(let i=1;i<lines.length;i++){
      if(!lines[i].trim()) continue;
      const cols = lines[i].split(",");
      const nama = (cols[0]||"").trim();
      const kelas = (cols[1]||"").trim();
      if(nama && kelas && dataKelas[kelas]) dataKelas[kelas].push({nama: nama, gender: "L"});
    }
    saveAll(); alert("✅ Siswa berhasil ditambahkan dari template!"); fileInput.value = "";
  };
  reader.readAsText(file);
}

// ======= GRAFIK =======
let pieChart = null, barChart = null;
function tampilkanGrafik(data, judul){
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("guruPanel").style.display = "none";
  document.getElementById("grafikPanel").style.display = "block";
  const ctxPie = document.getElementById("pieChart");
  const ctxBar = document.getElementById("barChart");
  if(pieChart) pieChart.destroy();
  if(barChart) barChart.destroy();
  const bulanIni = new Date().getMonth();
  let countStatus = {Hadir:0,Izin:0,Sakit:0,Alpha:0,Terlambat:0};
  data.filter(d => new Date(d.tanggal).getMonth() === bulanIni).forEach(d => { if(countStatus[d.status]!==undefined) countStatus[d.status]++; });
  pieChart = new Chart(ctxPie, {
    type: "pie",
    data: { labels: Object.keys(countStatus), datasets: [{ data: Object.values(countStatus), backgroundColor: ["#22c55e","#f59e0b","#3b82f6","#ef4444","#8b5cf6"] }] },
    options: { plugins: { title: { display: true, text: `Rekap Bulan Ini (${judul})` } } }
  });
  let perBulan = Array(12).fill(0);
  data.forEach(d => { perBulan[new Date(d.tanggal).getMonth()]++; });
  barChart = new Chart(ctxBar, {
    type: "bar",
    data: { labels: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"], datasets: [{ label: "Jumlah Absensi", data: perBulan, backgroundColor: "#2563eb" }] },
    options: { plugins: { title: { display: true, text: `Rekap Tahunan (${judul})` } } }
  });
}
function tampilkanGrafikGuru(){ if(!userKelas){ alert("Tidak ada kelas terdaftar untuk guru ini."); return; } const data = absensiLog.filter(l => l.kelas === userKelas); tampilkanGrafik(data, userKelas); }
function tampilkanGrafikAdmin(){ const kelas = document.getElementById("kelasGrafik").value; let data = absensiLog; if(kelas !== "Semua") data = absensiLog.filter(l => l.kelas === kelas); tampilkanGrafik(data, kelas); }
function tutupGrafik(){ document.getElementById("grafikPanel").style.display = "none"; if(userRole==="admin") document.getElementById("adminPanel").style.display = "block"; else document.getElementById("guruPanel").style.display = "block"; }

// ======= INIT =======
document.getElementById("login").style.display = "block";
saveAll();
