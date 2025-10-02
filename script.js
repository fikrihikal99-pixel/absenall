
// ========== CONFIG & DATA ==========
const CLASS_SHORT = ["1A","1B","2A","2B","3A","3B","3C","4A","4B","5A","5B","6A","6B"];
const CLASS_LIST = CLASS_SHORT.map(s=>"Kelas "+s);

let dataKelas = JSON.parse(localStorage.getItem("dataKelas")) || (function(){
  const o = {};
  CLASS_LIST.forEach(c => o[c]=[]);
  return o;
})();
let akunGuru = JSON.parse(localStorage.getItem("akunGuru")) || []; // {username,password,kelas}
let absensiLog = JSON.parse(localStorage.getItem("absensiLog")) || []; // {tanggal,kelas,nama,status}
let session = JSON.parse(localStorage.getItem("session")) || null;
const statusOptions = ["Hadir","Izin","Sakit","Alpha","Terlambat"];
let currentKelas = null;

// ========== UTIL =========
function saveAll(){ localStorage.setItem("dataKelas", JSON.stringify(dataKelas)); localStorage.setItem("akunGuru", JSON.stringify(akunGuru)); localStorage.setItem("absensiLog", JSON.stringify(absensiLog)); }
function el(id){ return document.getElementById(id); }

// ========== INIT UI =========
function initClassSelectors(){
  const selKelasBaru = el("kelasBaru");
  const selGuruKelas = el("guruKelas");
  const selKelasGrafik = el("kelasGrafik");
  if(selKelasBaru) selKelasBaru.innerHTML = "";
  if(selGuruKelas) selGuruKelas.innerHTML = "";
  if(selKelasGrafik) selKelasGrafik.innerHTML = "<option value='Semua'>Semua</option>";
  CLASS_LIST.forEach(c => {
    if(selKelasBaru){ let o=document.createElement("option"); o.value=c; o.textContent=c; selKelasBaru.appendChild(o); }
    if(selGuruKelas){ let o=document.createElement("option"); o.value=c; o.textContent=c; selGuruKelas.appendChild(o); }
    if(selKelasGrafik){ let o=document.createElement("option"); o.value=c; o.textContent=c; selKelasGrafik.appendChild(o); }
  });
}

// ========== AUTH =========
function login(){
  const u = el("username").value.trim();
  const p = el("password").value.trim();
  if(u==="admin" && p==="1234"){
    session = {role:"admin"};
    localStorage.setItem("session", JSON.stringify(session));
    showAdmin();
    return;
  }
  const guru = akunGuru.find(g=>g.username===u && g.password===p);
  if(guru){ session = {role:"guru", kelas:guru.kelas, username:guru.username}; localStorage.setItem("session", JSON.stringify(session)); showGuru(guru.kelas); return; }
  alert("Username / Password salah");
}

function checkSession(){
  session = JSON.parse(localStorage.getItem("session"));
  initClassSelectors();
  if(session){
    if(session.role==="admin") showAdmin();
    else if(session.role==="guru") showGuru(session.kelas);
  } else {
    el("loginPanel").style.display = "block";
  }
}

function logout(){
  session = null; localStorage.removeItem("session");
  el("adminPanel").style.display = "none"; el("guruPanel").style.display = "none"; el("grafikPanel").style.display = "none";
  el("loginPanel").style.display = "block";
}

// ========== ADMIN FUNCTIONS =========
function tambahSiswa(){
  const nama = el("namaBaru").value.trim();
  const jk = el("genderBaru").value;
  const kelas = el("kelasBaru").value;
  if(!nama || !kelas){ alert("Nama & Kelas wajib"); return; }
  dataKelas[kelas].push({nama: nama, jk: jk});
  saveAll();
  el("namaBaru").value = "";
  alert("Siswa ditambahkan");
}

function tambahGuru(){
  const u = el("guruUser").value.trim();
  const p = el("guruPass").value.trim();
  const k = el("guruKelas").value;
  if(!u || !p || !k){ alert("Lengkapi data guru"); return; }
  akunGuru.push({username:u,password:p,kelas:k});
  saveAll(); renderDaftarGuru(); el("guruUser").value=""; el("guruPass").value="";
  alert("Guru ditambahkan");
}

function renderDaftarGuru(){
  const ul = el("daftarGuru"); ul.innerHTML = "";
  akunGuru.forEach((g,i)=>{
    const li = document.createElement("li");
    li.innerHTML = `${g.username} (${g.kelas}) <button onclick="resetPass(${i})">Reset Pass</button> <button onclick="hapusGuru(${i})" class="danger">Hapus</button>`;
    ul.appendChild(li);
  });
}

function resetPass(i){ akunGuru[i].password = "1234"; saveAll(); renderDaftarGuru(); alert("Password direset ke 1234"); }
function hapusGuru(i){ if(!confirm("Hapus akun guru?")) return; akunGuru.splice(i,1); saveAll(); renderDaftarGuru(); alert("Akun dihapus"); }

// ========== TEMPLATE XLSX / UPLOAD =========
function downloadTemplateXLSX(){
  const wb = XLSX.utils.book_new();
  const ws_data = [["Nama","Kelas"]];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Siswa");
  XLSX.writeFile(wb, "template_siswa.xlsx");
}

function uploadTemplateXLSX(){
  const fi = el("uploadFileXlsx");
  if(!fi.files.length){ alert("Pilih file .xlsx"); return; }
  const reader = new FileReader();
  reader.onload = function(e){
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, {type:"array"});
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {header:1});
    for(let i=1;i<rows.length;i++){
      const r = rows[i]; if(!r || r.length<2) continue;
      const nama = String(r[0]).trim(); const kelasShort = String(r[1]).trim();
      const kelas = "Kelas "+kelasShort;
      if(!nama || !CLASS_LIST.includes(kelas)) continue;
      // default jk L jika belum ada
      dataKelas[kelas].push({nama: nama, jk: "L"});
    }
    saveAll(); alert("Upload selesai"); el("uploadFileXlsx").value = "";
  };
  reader.readAsArrayBuffer(fi.files[0]);
}

// ========== GURU / ABSENSI =========
function showAdmin(){
  el("loginPanel").style.display = "none";
  el("adminPanel").style.display = "block";
  el("grafikPanel").style.display = "none";
  el("guruPanel").style.display = "none";
  renderDaftarGuru();
  initClassSelectors();
}

function showGuru(kelas){
  currentKelas = kelas;
  el("loginPanel").style.display = "none";
  el("adminPanel").style.display = "none";
  el("grafikPanel").style.display = "none";
  el("guruPanel").style.display = "block";
  el("infoGuru").textContent = "Anda sebagai guru kelas: "+kelas;
  // set tanggal default today
  const today = new Date().toISOString().slice(0,10);
  el("tanggalInput").value = today;
  renderTabelAbsensi(kelas, today);
}

function renderTabelAbsensi(kelas, tanggal){
  const container = el("tabelAbsensi"); container.innerHTML = "";
  const students = dataKelas[kelas] || [];
  if(!students.length){ container.innerHTML = "<em>Belum ada siswa di kelas ini.</em>"; return; }
  let html = `<table><tr><th>Nama</th><th>JK</th><th>Status</th></tr>`;
  students.forEach(s => {
    const key = `${kelas}|${s.nama}|${tanggal}`;
    const saved = absensiLog.find(x=>x.key===key);
    const sel = saved ? saved.status : "Hadir";
    html += `<tr><td>${s.nama}</td><td>${s.jk}</td><td><select id="${key}">`;
    statusOptions.forEach(opt => { html += `<option value="${opt}" ${sel===opt?'selected':''}>${opt}</option>`; });
    html += `</select></td></tr>`;
  });
  html += `</table>`;
  container.innerHTML = html;
}

function simpanAbsensi(){
  const tanggal = el("tanggalInput").value;
  if(!tanggal){ alert("Pilih tanggal"); return; }
  const students = dataKelas[currentKelas] || [];
  students.forEach(s => {
    const key = `${currentKelas}|${s.nama}|${tanggal}`;
    const sel = el(key).value;
    // remove old record with same key
    absensiLog = absensiLog.filter(x=>x.key!==key);
    absensiLog.push({key:key, tanggal: tanggal, kelas: currentKelas, nama: s.nama, status: sel});
  });
  saveAll(); alert("Absensi tersimpan"); renderTabelAbsensi(currentKelas, tanggal);
}

function unduhCSV_kelas(kelas){
  let csv = "Tanggal,Kelas,Nama,JK,Status\n";
  absensiLog.filter(r=>r.kelas===kelas).forEach(r=> csv += `${r.tanggal},${r.kelas},${r.nama},${getJK(r.kelas,r.nama)},${r.status}\n`);
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `absensi_${kelas}.csv`; a.click();
}

function getJK(kelas,nama){ const s = (dataKelas[kelas]||[]).find(x=>x.nama===nama); return s? s.jk : ""; }

// ========== GRAFIK =========
let pieChart=null, barChart=null;
function tampilkanGrafik(data, judul){
  el("adminPanel").style.display = "none"; el("guruPanel").style.display = "none"; el("grafikPanel").style.display = "block";
  const ctxPie = el("pieChart"); const ctxBar = el("barChart");
  if(pieChart) pieChart.destroy(); if(barChart) barChart.destroy();
  const bulanIni = new Date().getMonth();
  const filtered = data.filter(d=> new Date(d.tanggal).getMonth()===bulanIni);
  const counts = {Hadir:0,Izin:0,Sakit:0,Alpha:0,Terlambat:0};
  filtered.forEach(d=>{ if(counts[d.status]!==undefined) counts[d.status]++; });
  pieChart = new Chart(ctxPie, { type:"pie", data:{ labels:Object.keys(counts), datasets:[{ data:Object.values(counts) }] }, options:{ plugins:{ title:{ display:true, text:`Rekap Bulan Ini (${judul})` } } } });
  // per bulan (jumlah status entries per month)
  const perBulan = Array(12).fill(0);
  data.forEach(d=>{ perBulan[new Date(d.tanggal).getMonth()]++; });
  barChart = new Chart(ctxBar, { type:"bar", data:{ labels:["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"], datasets:[{ label:"Jumlah", data:perBulan }] } );
}

function tampilkanGrafikGuru(){ const data = absensiLog.filter(l=>l.kelas===currentKelas); tampilkanGrafik(data, currentKelas); }
function tampilkanGrafikAdmin(){ const k = el("kelasGrafik").value; const data = (k==="Semua")? absensiLog : absensiLog.filter(l=>l.kelas===k); tampilkanGrafik(data, k); }
function tutupGrafik(){ el("grafikPanel").style.display = "none"; if(session && session.role==="admin") el("adminPanel").style.display="block"; else el("guruPanel").style.display="block"; }

// ========== EXPORT ALL CSV =========
function exportAllCSV(){
  let csv = "Tanggal,Kelas,Nama,JK,Status\n";
  absensiLog.forEach(r=> csv += `${r.tanggal},${r.kelas},${r.nama},${getJK(r.kelas,r.nama)},${r.status}\n`);
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "absensi_all.csv"; a.click();
}

// ========== INIT =========
window.onload = function(){ initClassSelectors(); checkSession(); };
