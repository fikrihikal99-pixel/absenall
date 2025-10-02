
const CLASS_LIST = ["1A","1B","2A","2B","3A","3B","3C","4A","4B","5A","5B","6A","6B"];

let akunGuru = JSON.parse(localStorage.getItem("akunGuru")) || [];
let userRole = null;
let userKelas = null;

// isi select kelas
function initClassSelectors(){
  const guruKelas = document.getElementById("guruKelas");
  if(!guruKelas) return;
  guruKelas.innerHTML = "";
  CLASS_LIST.forEach(c => {
    let opt = document.createElement("option");
    opt.value = "Kelas "+c;
    opt.textContent = "Kelas "+c;
    guruKelas.appendChild(opt);
  });
}

// login
function login(){
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  if(u === "admin" && p === "1234"){
    userRole = "admin";
    localStorage.setItem("session", JSON.stringify({role:"admin"}));
    showAdminPanel();
  } else {
    const guru = akunGuru.find(g => g.username === u && g.password === p);
    if(guru){
      userRole = "guru";
      userKelas = guru.kelas;
      localStorage.setItem("session", JSON.stringify({role:"guru",kelas:userKelas}));
      showGuruPanel();
    } else {
      alert("❌ Username/Password salah!");
    }
  }
}

function showAdminPanel(){
  document.getElementById("login").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  document.getElementById("guruPanel").style.display = "none";
  initClassSelectors();
  renderGuruList();
}
function showGuruPanel(){
  document.getElementById("login").style.display = "none";
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("guruPanel").style.display = "block";
  document.getElementById("absensiTabel").textContent = "Absensi untuk "+userKelas;
}

function logout(){
  localStorage.removeItem("session");
  userRole = null; userKelas = null;
  document.getElementById("login").style.display = "block";
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("guruPanel").style.display = "none";
}

// tambah guru
function tambahGuru(){
  const u = document.getElementById("guruUser").value.trim();
  const p = document.getElementById("guruPass").value.trim();
  const k = document.getElementById("guruKelas").value;
  if(u && p){
    akunGuru.push({username:u, password:p, kelas:k});
    localStorage.setItem("akunGuru", JSON.stringify(akunGuru));
    renderGuruList();
    alert("✅ Guru ditambahkan!");
  }
}
function renderGuruList(){
  const div = document.getElementById("guruList");
  div.innerHTML = "";
  akunGuru.forEach(g => {
    const d = document.createElement("div");
    d.textContent = g.username+" ("+g.kelas+")";
    div.appendChild(d);
  });
}

// cek session saat load
function checkSession(){
  const sess = JSON.parse(localStorage.getItem("session"));
  if(sess){
    if(sess.role === "admin"){
      showAdminPanel();
    } else if(sess.role === "guru"){
      userRole = "guru";
      userKelas = sess.kelas;
      showGuruPanel();
    }
  }
}

window.onload = () => {
  initClassSelectors();
  checkSession();
};
