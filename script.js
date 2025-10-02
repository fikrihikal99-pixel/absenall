
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
  if(!kelasBaru || !guruKelas || !kelasGrafik) return;
  kelasBaru.innerHTML = "";
  guruKelas.innerHTML = "";
  kelasGrafik.innerHTML = "";
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
    initClassSelectors(); // FIX: panggil ulang saat admin login
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

// (the rest of script.js is unchanged, but with initClassSelectors fix at login)
// For brevity, reuse previous code for other functions... 
