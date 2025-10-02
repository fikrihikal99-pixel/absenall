// Data awal
let users = JSON.parse(localStorage.getItem("users")) || [
  {username:"admin", password:"1234", role:"admin"}
];
let siswa = JSON.parse(localStorage.getItem("siswa")) || [];
let absensi = JSON.parse(localStorage.getItem("absensi")) || {};
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// Daftar kelas
const kelasList = ["1A","1B","2A","2B","3A","3B","3C","4A","4B","5A","5B","6A","6B"];

// Cek login saat reload
window.onload = function(){
  if(currentUser){
    if(currentUser.role === "admin") showAdmin();
    else showGuru(currentUser);
  }
  loadKelasDropdown();
};

// Login
function login(){
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;
  const user = users.find(x=>x.username===u && x.password===p);
  if(user){
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
    if(user.role==="admin") showAdmin();
    else showGuru(user);
  } else {
    alert("Login gagal");
  }
}

// Logout
function logout(){
  currentUser = null;
  localStorage.removeItem("currentUser");
  location.reload();
}

// Tampilkan admin
function showAdmin(){
  document.getElementById("loginPanel").style.display="none";
  document.getElementById("adminPanel").style.display="block";
  document.getElementById("guruPanel").style.display="none";
  updateGuruList();
}

// Tampilkan guru
function showGuru(user){
  document.getElementById("loginPanel").style.display="none";
  document.getElementById("adminPanel").style.display="none";
  document.getElementById("guruPanel").style.display="block";
  document.getElementById("kelasGuru").innerText="Kelas: "+user.kelas;

  const tbody=document.querySelector("#absensiTable tbody");
  tbody.innerHTML="";
  siswa.filter(s=>s.kelas===user.kelas).forEach(s=>{
    let tr=document.createElement("tr");
    tr.innerHTML=`<td>${s.nama}</td><td><input type="checkbox" ${getHadir(user.kelas,s.nama)?"checked":""}></td>`;
    tbody.appendChild(tr);
  });
  loadChart(user.kelas);
}

// Tambah guru
function tambahGuru(){
  const u=document.getElementById("guruUsername").value;
  const p=document.getElementById("guruPassword").value;
  const k=document.getElementById("guruKelas").value;
  if(!u||!p||!k){ alert("Lengkapi data"); return;}
  users.push({username:u,password:p,role:"guru",kelas:k});
  localStorage.setItem("users",JSON.stringify(users));
  updateGuruList();
  alert("Guru ditambahkan");
}

// Update daftar guru
function updateGuruList(){
  const ul=document.getElementById("guruList");
  ul.innerHTML="";
  users.filter(u=>u.role==="guru").forEach(g=>{
    let li=document.createElement("li");
    li.textContent=`${g.username} (${g.kelas})`;
    ul.appendChild(li);
  });
}

// Load dropdown kelas
function loadKelasDropdown(){
  const sel=document.getElementById("guruKelas");
  sel.innerHTML="";
  kelasList.forEach(k=>{
    let opt=document.createElement("option");
    opt.value=k; opt.text=k;
    sel.appendChild(opt);
  });
}

// Download template siswa
function downloadTemplateSiswa(){
  const wb=XLSX.utils.book_new();
  const ws_data=[["Nama","Kelas"]];
  const ws=XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb,ws,"Template");
  XLSX.writeFile(wb,"template_siswa.xlsx");
}

// Upload siswa dari excel
function uploadSiswa(input){
  const file=input.files[0];
  const reader=new FileReader();
  reader.onload=function(e){
    const data=new Uint8Array(e.target.result);
    const workbook=XLSX.read(data,{type:'array'});
    const sheet=workbook.Sheets[workbook.SheetNames[0]];
    const json=XLSX.utils.sheet_to_json(sheet);
    json.forEach(row=>{
      if(row.Nama && row.Kelas){
        siswa.push({nama:row.Nama,kelas:row.Kelas});
      }
    });
    localStorage.setItem("siswa",JSON.stringify(siswa));
    alert("Data siswa terupload");
  };
  reader.readAsArrayBuffer(file);
}

// Simpan absensi harian
function simpanAbsensi(){
  const date=new Date().toISOString().slice(0,10);
  const kelas=currentUser.kelas;
  const checkboxes=document.querySelectorAll("#absensiTable tbody input");
  checkboxes.forEach((cb,i)=>{
    const nama=siswa.filter(s=>s.kelas===kelas)[i].nama;
    if(!absensi[kelas]) absensi[kelas]={};
    if(!absensi[kelas][date]) absensi[kelas][date]=[];
    if(cb.checked){
      if(!absensi[kelas][date].includes(nama))
        absensi[kelas][date].push(nama);
    }
  });
  localStorage.setItem("absensi",JSON.stringify(absensi));
  loadChart(kelas);
  alert("Absensi tersimpan");
}

// Cek hadir
function getHadir(kelas,nama){
  const date=new Date().toISOString().slice(0,10);
  return absensi[kelas] && absensi[kelas][date] && absensi[kelas][date].includes(nama);
}

// Chart bulanan
function loadChart(kelas){
  const ctx=document.getElementById("absensiChart");
  const bulan=new Date().toISOString().slice(0,7);
  const tanggal=[];
  const jumlah=[];
  for(let d=1;d<=31;d++){
    let t=bulan+"-"+String(d).padStart(2,"0");
    tanggal.push(d);
    if(absensi[kelas] && absensi[kelas][t]){
      jumlah.push(absensi[kelas][t].length);
    } else {
      jumlah.push(0);
    }
  }
  new Chart(ctx,{
    type:"line",
    data:{labels:tanggal, datasets:[{label:"Jumlah Hadir",data:jumlah}]},
    options:{responsive:true}
  });
}
