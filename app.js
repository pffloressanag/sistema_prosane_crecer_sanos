const initialRecords = [
 {id:1,caps:"CAPS Centro",localidad:"La Rioja",escuela:"Escuela N.º 123",periodo:2025,matricula:250,controlados:230,chagas:15,vacunacion:220,nutricion:210,patologias:12,odontologia:200},
 {id:2,caps:"CAPS Norte",localidad:"Chilecito",escuela:"Escuela N.º 456",periodo:2025,matricula:180,controlados:170,chagas:10,vacunacion:165,nutricion:160,patologias:8,odontologia:150},
 {id:3,caps:"CAPS Sur",localidad:"Aimogasta",escuela:"Escuela N.º 789",periodo:2025,matricula:200,controlados:190,chagas:12,vacunacion:185,nutricion:180,patologias:10,odontologia:170}
];
const STORAGE_KEY = "prosane_crecer_sanos_records_v1";
let records = loadRecords();
let chart;

const $ = id => document.getElementById(id);
const fields = ["caps","localidad","escuela","periodo","matricula","controlados","chagas","vacunacion","nutricion","patologias","odontologia"];
const numericFields = ["periodo","matricula","controlados","chagas","vacunacion","nutricion","patologias","odontologia"];

function loadRecords(){
 try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : initialRecords; }
 catch { return initialRecords; }
}
function saveRecords(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function filteredRecords(){
 const caps=$("filterCaps").value, loc=$("filterLocalidad").value, esc=$("filterEscuela").value, year=$("filterPeriodo").value;
 return records.filter(r=>(!caps||r.caps===caps)&&(!loc||r.localidad===loc)&&(!esc||r.escuela===esc)&&(!year||String(r.periodo)===year));
}
function fillSelect(id, values, allLabel){
 const select=$(id), previous=select.value;
 select.innerHTML=`<option value="">${allLabel}</option>`+[...new Set(values)].sort().map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
 if([...select.options].some(o=>o.value===previous)) select.value=previous;
}
function refreshFilters(){
 fillSelect("filterCaps",records.map(r=>r.caps),"Todos");
 fillSelect("filterLocalidad",records.map(r=>r.localidad),"Todas");
 fillSelect("filterEscuela",records.map(r=>r.escuela),"Todas");
 fillSelect("filterPeriodo",records.map(r=>r.periodo),"Todos");
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function sum(rows,key){return rows.reduce((n,r)=>n+(Number(r[key])||0),0);}
function render(){
 const rows=filteredRecords();
 $("recordsBody").innerHTML=rows.map((r,i)=>`<tr>
 <td>${i+1}</td><td>${escapeHtml(r.caps)}</td><td>${escapeHtml(r.localidad)}</td><td>${escapeHtml(r.escuela)}</td><td>${r.periodo}</td>
 <td>${r.matricula}</td><td>${r.controlados}</td><td>${r.chagas}</td><td>${r.vacunacion}</td><td>${r.nutricion}</td><td>${r.patologias}</td><td>${r.odontologia}</td>
 <td><div class="row-actions"><button class="icon-btn" title="Editar" data-edit="${r.id}">✎</button><button class="icon-btn delete-btn" title="Eliminar" data-delete="${r.id}">✕</button></div></td></tr>`).join("");
 const keys=["matricula","controlados","chagas","vacunacion","nutricion","patologias","odontologia"];
 $("recordsFoot").innerHTML=`<tr><td colspan="5">Total de la selección</td>${keys.map(k=>`<td>${sum(rows,k)}</td>`).join("")}<td></td></tr>`;
 const matricula=sum(rows,"matricula"), controlados=sum(rows,"controlados");
 $("totalMatricula").textContent=matricula.toLocaleString("es-AR");
 $("totalControlados").textContent=controlados.toLocaleString("es-AR");
 $("coverage").textContent=(matricula?((controlados/matricula)*100).toFixed(1).replace(".",","):"0,0")+"%";
 $("recordCount").textContent=`${rows.length} ${rows.length===1?"registro":"registros"}`;
 updateChart(rows);
}
function updateChart(rows){
 const labels=["Controles","Chagas","Vacunación","Nutrición","Odontología"];
 const values=[sum(rows,"controlados"),sum(rows,"chagas"),sum(rows,"vacunacion"),sum(rows,"nutricion"),sum(rows,"odontologia")];
 if(chart) chart.destroy();
 chart=new Chart($("indicatorsChart"),{type:"bar",data:{labels,datasets:[{label:"Cantidad registrada",data:values,borderWidth:1,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}}});
}
function openNew(){
 $("recordForm").reset();$("recordId").value="";$("dialogTitle").textContent="Nuevo registro";$("periodo").value=new Date().getFullYear();$("formError").textContent="";$("recordDialog").showModal();
}
function openEdit(id){
 const r=records.find(x=>x.id===Number(id));if(!r)return;
 $("recordForm").reset();$("recordId").value=r.id;$("dialogTitle").textContent="Editar registro";$("formError").textContent="";
 fields.forEach(k=>$(k).value=r[k]);$("recordDialog").showModal();
}
$("recordForm").addEventListener("submit",e=>{
 e.preventDefault();
 const data={};fields.forEach(k=>data[k]=numericFields.includes(k)?Number($(k).value):$(k).value.trim());
 if(data.controlados>data.matricula){$("formError").textContent="Los alumnos controlados no pueden superar la matrícula.";return;}
 if(["chagas","vacunacion","nutricion","odontologia"].some(k=>data[k]>data.matricula)){$("formError").textContent="Un valor de controles no debería superar la matrícula.";return;}
 const id=$("recordId").value;
 if(id){records=records.map(r=>r.id===Number(id)?{...data,id:Number(id)}:r);}
 else{data.id=Date.now();records.push(data);}
 saveRecords();refreshFilters();render();$("recordDialog").close();
});
$("recordsBody").addEventListener("click",e=>{
 const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
 if(edit)openEdit(edit.dataset.edit);
 if(del){const id=Number(del.dataset.delete);if(confirm("¿Querés eliminar este registro?")){records=records.filter(r=>r.id!==id);saveRecords();refreshFilters();render();}}
});
["filterCaps","filterLocalidad","filterEscuela","filterPeriodo"].forEach(id=>$(id).addEventListener("change",render));
$("clearFilters").addEventListener("click",()=>{["filterCaps","filterLocalidad","filterEscuela","filterPeriodo"].forEach(id=>$(id).value="");render();});
$("addRecordBtn").addEventListener("click",openNew);
$("closeDialog").addEventListener("click",()=>$("recordDialog").close());
$("cancelDialog").addEventListener("click",()=>$("recordDialog").close());
$("exportCsv").addEventListener("click",()=>{
 const rows=filteredRecords(), headers=["CAPS","Localidad","Institución Educativa","Período","Matrícula","Alumnos controlados","Controles de Chagas","Vacunación","Valoración nutricional","Patologías detectadas","Resultados odontológicos"];
 const keys=["caps","localidad","escuela","periodo","matricula","controlados","chagas","vacunacion","nutricion","patologias","odontologia"];
 const csv=[headers,...rows.map(r=>keys.map(k=>r[k]))].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="reporte_PROSANE.csv";a.click();URL.revokeObjectURL(url);
});
refreshFilters();render();
