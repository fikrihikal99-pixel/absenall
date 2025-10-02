
// ======= CONFIG =======
const CLASS_LIST = ["1A","1B","2A","2B","3A","3B","3C","4A","4B","5A","5B","6A","6B"];

// ======= DATA =======
let dataKelas = JSON.parse(localStorage.getItem("dataKelas")) || (function(){
  const o = {};
  CLASS_LIST.forEach(c => o["Kelas "+c] = []);
  return o;
})();
let akunGuru = JSON.parse(localStorage.getItem("akunGuru")) || [];
let absensiLog = JSON.parse(localStorage.getItem("absensiLog")) || [];
const statusOptions = ["Hadir", "Izin", "Sakit", "Alpha", "Terlambat"];
let userRole = null, userKelas = null;

// ======= UTILS =======
function saveAll(){
  localStorage.setItem("dataKelas", JSON.stringify(dataKelas));
  localStorage.setItem("akunGuru", JSON.stringify(akunGuru));
  localStorage.setItem("absensiLog", JSON.stringify(absensiLog));
}

// initialize select lists for classes in UI
function initClassSelectors(){
  const kelasBaru = document.getElementById("kelasBaru");
  const guruKelas = document.getElementById("guruKelas");
  const kelasGrafik = document.getElementById("kelasGrafik");
  CLASS_LIST.forEach(c => {
    const label = "Kelas "+c;
    const opt1 = document.createElement("option"); opt1.value = label; opt1.textContent = label; kelasBaru.appendChild(opt1);
    const opt2 = document.createElement("option"); opt2.value = label; opt2.textContent = label; guruKelas.appendChild(opt2);
    const opt3 = document.createElement("option"); opt3.value = label; opt3.textContent = label; kelasGrafik.appendChild(opt3);
  });
  // ensure "Semua" stays first
  const first = document.createElement("option"); first.value = "Semua"; first.textContent = "Semua"; kelasGrafik.insertBefore(first, kelasGrafik.firstChild);
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
    initClassSelectors();
    localStorage.setItem("session", JSON.stringify({role:"admin"}));
    renderGuruList();
  } else {
    const guru = akunGuru.find(g => g.username === u && g.password === p);
    if(guru){
      userRole = "guru";
      userKelas = guru.kelas;
      document.getElementById("login").style.display = "none";
      document.getElementById("guruPanel").style.display = "block";
      renderTabel(userKelas);
      localStorage.setItem("session", JSON.stringify({role:"guru",kelas:userKelas}));
    } else {
      alert("❌ Username/Password salah!");
    }
  }
}
function logout(){
  localStorage.removeItem("session");
  userRole = null; userKelas = null;
  document.getElementById("login").style.display = "block";
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("guruPanel").style.display = "none";
  document.getElementById("grafikPanel").style.display = "none";
    initClassSelectors();
    localStorage.setItem("session", JSON.stringify({role:"admin"}));
}

// ======= RENDER TABLE =======
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

// ======= SAVE ABSEN =======
function simpanAbsensi(){
  if(!userKelas){ alert("Tidak ada kelas terdaftar"); return; }
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

// ======= CSV DOWNLOAD =======
function unduhCSV(){
  if(!userKelas){ alert("Tidak ada kelas terdaftar"); return; }
  let csv = "Tanggal,Kelas,Nama,JK,Status\n";
  absensiLog.filter(l => l.kelas === userKelas).forEach(l => { csv += `${l.tanggal},${l.kelas},${l.nama},${getGender(l.kelas,l.nama)||""},${l.status}\n`; });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "absensi_"+userKelas+".csv"; a.click(); URL.revokeObjectURL(url);
}

function getGender(kelas, nama){
  const list = dataKelas[kelas]||[];
  const s = list.find(x=>x.nama===nama);
  return s? s.gender : "";
}

// ======= ADMIN: tambah siswa/guru =======
function tambahSiswa(){
  const nama = document.getElementById("namaBaru").value.trim();
  const gender = document.getElementById("genderBaru").value;
  const kelas = document.getElementById("kelasBaru").value;
  if(!nama){ alert("Nama tidak boleh kosong!"); return; }
  if(!dataKelas[kelas]){ alert("Kelas tidak valid"); return; }
  dataKelas[kelas].push({nama, gender}); saveAll();
  document.getElementById("namaBaru").value = ""; alert("✅ Siswa baru ditambahkan!");
}
function tambahGuru(){
  const user = document.getElementById("guruUser").value.trim();
  const pass = document.getElementById("guruPass").value.trim();
  const kelas = document.getElementById("guruKelas").value;
  if(!user || !pass){ alert("Username & Password wajib diisi!"); return; }
  akunGuru.push({username: user, password: pass, kelas}); saveAll(); document.getElementById("guruUser").value = ""; document.getElementById("guruPass").value = ""; renderGuruList(); alert("✅ Akun guru ditambahkan!");
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

// ======= XLSX TEMPLATE DOWNLOAD / UPLOAD =======
function downloadTemplateXLSX(){
  const ws_data = [["Nama","Kelas"]];
  ws_data.push(["Budi","1A"]);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Siswa");
  const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
  const blob = new Blob([wbout], {type: "application/octet-stream"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "template_siswa.xlsx"; a.click(); URL.revokeObjectURL(url);
}

function uploadTemplateXLSX(){
  const fi = document.getElementById("uploadFileXlsx");
  if(!fi.files.length){ alert("Pilih file .xlsx terlebih dahulu"); return; }
  const file = fi.files[0];
  const reader = new FileReader();
  reader.onload = function(e){
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {header:1});
    for(let i=1;i<json.length;i++){
      const row = json[i];
      if(!row || row.length < 2) continue;
      const nama = String(row[0]).trim();
      const kelasShort = String(row[1]).trim();
      const kelas = "Kelas "+kelasShort;
      if(nama && CLASS_LIST.includes(kelasShort) && dataKelas[kelas]){
        dataKelas[kelas].push({nama, gender: "L"});
      }
    }
    saveAll();
    alert("✅ Upload selesai. Siswa ditambahkan sesuai file.");
    fi.value = "";
  };
  reader.readAsArrayBuffer(file);
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
function tutupGrafik(){ document.getElementById("grafikPanel").style.display = "none";
    initClassSelectors();
    localStorage.setItem("session", JSON.stringify({role:"admin"})); if(userRole==="admin") document.getElementById("adminPanel").style.display = "block"; else document.getElementById("guruPanel").style.display = "block"; }

// ======= INIT =======
initClassSelectors();
document.getElementById("login").style.display = "block";
saveAll();


function checkSession(){
  const sess = JSON.parse(localStorage.getItem("session"));
  if(sess){
    if(sess.role === "admin"){
      userRole = "admin";
      document.getElementById("login").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      initClassSelectors();
      renderGuruList();
    } else if(sess.role === "guru"){
      userRole = "guru";
      userKelas = sess.kelas;
      document.getElementById("login").style.display = "none";
      document.getElementById("guruPanel").style.display = "block";
      renderTabel(userKelas);
    }
  }
}

window.onload = () => { initClassSelectors(); checkSession(); };