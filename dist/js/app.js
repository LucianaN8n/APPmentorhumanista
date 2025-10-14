
let Cap = window.Capacitor || null;

const $ = (s)=>document.querySelector(s);
const esc = (s)=>String(s ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
const pad = (n)=>String(n).padStart(2,'0');

const PROTO = { semanas:[
 { titulo:"Semana 1 — Base & sobrevivência", itens:["Awareness Gestalt (2–3 min)...","Figura–fundo...","Ativação comportamental (2–3 micro-atividades/dia)","Psychoed curta...","Tarefas (casa): AC diária; Sono; Diário STOP"], indicadores:["PHQ-9 + BADS-SF","% AC cumpridas","Sono (h)","Relato qualitativo"] },
 { titulo:"Semana 2 — Regulação & contato", itens:["Cadeiras internas (Crítico×Vulnerável)","Hierarquia social (0–100)","Exposições leves SEM segurança","Tarefas (casa): 2–3 exposições"], indicadores:["SUDS antes/depois","Previsto×Ocorrido","Tempo em contato"] },
 { titulo:"Semana 3 — Habilidade/Exposição (médio)", itens:["Role-play/Monodrama","FAP pedido/limite","Exposições médias 2–3x/semana","Tarefas (casa)"], indicadores:["Pedido feito?","Tempo total em contato","BADS-SF comparação"] },
 { titulo:"Semana 4 — Consolidação", itens:["Exposição alta 1x","Gestalt — polaridades","Plano do mês","Tarefas (casa)"], indicadores:["PHQ-9 final + mini-LSAS","% sem segurança","1º passo do mês"] }
]};

function renderPlan(semanas=PROTO.semanas){
  const editor = document.querySelector('#plano-editor'); editor.innerHTML='';
  semanas.forEach((w)=>{
    const el = document.createElement('div');
    el.className = 'plan week';
    el.innerHTML = `<h3>${esc(w.titulo)}</h3>
      <div class="table-like">
        <div class="cell"><b>Intervenções</b>
          <ul>${w.itens.map(i=>`<li contenteditable="true">${esc(i)}</li>`).join('')}</ul>
        </div>
        <div class="cell"><b>Indicadores</b>
          <ul>${w.indicadores.map(i=>`<li contenteditable="true">${esc(i)}</li>`).join('')}</ul>
        </div>
      </div>`;
    editor.appendChild(el);
  });
}

function renderGuides(){
  const box = document.querySelector('#guides'); box.innerHTML='';
  ["Gestalt — Awareness","Figura–Fundo","Cadeiras Internas","AC (Depressão)","Exposição Social","FAP — Pedido/Limite"]
    .forEach(t=>{
      const el = document.createElement('div'); el.className='guide';
      el.innerHTML = `<h3>${esc(t)}</h3><div>Resumo prático para uso em sessão.</div>`;
      box.appendChild(el);
    });
}

renderPlan(); renderGuides();
document.querySelector('#btn-carregar')?.addEventListener('click', ()=>renderPlan(PROTO.semanas));
document.querySelector('#btn-pdf-direto')?.addEventListener('click', exportPdfDireto);

function px2pt(px){ return px*0.75; } function round2(v){ return Math.round(v*100)/100; }
async function exportPdfDireto(){
  if(!(window.html2canvas && window.jspdf)){ alert('Libs em /vendor ausentes.'); return; }
  const tpl = document.getElementById('tpl-print'); const node = tpl.content.cloneNode(true);
  const root = node.querySelector('#print-root');
  const get=(s)=>document.querySelector(s); const nome=(get('#f-nome').value||'Paciente').trim();
  root.querySelector('#p-nome').textContent = nome;
  root.querySelector('#p-queixa').textContent = get('#f-queixa').value||'—';
  root.querySelector('#p-objetivo').textContent = get('#f-objetivo').value||'—';
  root.querySelector('#p-intensidade').textContent = get('#f-intensidade').value||'—';
  root.querySelector('#p-gatilho').textContent = get('#f-gatilho').value||'—';
  root.querySelector('#p-funcao').textContent = get('#f-funcao').value||'—';
  root.querySelector('#p-pref').textContent = get('#f-preferencias').value||'—';
  const now=new Date(); const dh = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  root.querySelector('#meta-data').textContent = dh;

  const alvo=root.querySelector('#p-semanas');
  document.querySelectorAll('#plano-editor .week').forEach(w=>{
    const titulo = w.querySelector('h3')?.textContent||'';
    const its = Array.from(w.querySelectorAll('.cell:nth-child(1) li')).map(li=>li.textContent.trim());
    const inds = Array.from(w.querySelectorAll('.cell:nth-child(2) li')).map(li=>li.textContent.trim());
    const block=document.createElement('div'); block.className='block';
    block.innerHTML=`<h3>${titulo}</h3><div class="table-like">
      <div class="cell"><b>Intervenções</b><ul>${its.map(i=>`<li>${i}</li>`).join('')}</ul></div>
      <div class="cell"><b>Indicadores</b><ul>${inds.map(i=>`<li>${i}</li>`).join('')}</ul></div></div>`;
    alvo.appendChild(block);
  });

  const mount=document.createElement('div'); mount.style.position='fixed'; mount.style.left='-10000px'; mount.appendChild(root); document.body.appendChild(mount);
  const A4_W=794, A4_H=1123; const prevW=root.style.width; root.style.width=A4_W+'px';
  const device=Math.max(2, Math.ceil(window.devicePixelRatio||1));
  const canvas=await html2canvas(root,{scale:3*device/3,backgroundColor:'#fff'});
  const imgW=canvas.width,imgH=canvas.height;
  const { jsPDF }=window.jspdf; const pdf=new jsPDF('p','pt','a4'); const pageW=px2pt(A4_W),pageH=px2pt(A4_H);
  const pageSlicePx=Math.floor(A4_H*(canvas.width/A4_W)); const margin=6,overlap=4;
  let rendered=0,page=0; while(rendered<imgH){
    let sliceH=Math.min(pageSlicePx,imgH-rendered); if(rendered+sliceH<imgH) sliceH+=overlap;
    const pageCanvas=document.createElement('canvas'); pageCanvas.width=imgW; pageCanvas.height=sliceH;
    pageCanvas.getContext('2d').drawImage(canvas,0,rendered,imgW,sliceH,0,0,imgW,sliceH);
    const url=pageCanvas.toDataURL('image/png'); if(page>0) pdf.addPage();
    const x=round2(px2pt(margin)),y=round2(px2pt(margin)); const w=round2(pageW-px2pt(margin*2)),h=round2(pageH-px2pt(margin*2));
    pdf.addImage(url,'PNG',x,y,w,h); pdf.setFontSize(9); pdf.setTextColor(68,104,108);
    pdf.text(nome,x,pageH-px2pt(5)); const tw=pdf.getTextWidth(dh); pdf.text(dh,pageW-x-tw,pageH-px2pt(5));
    rendered+=(pageSlicePx); page++;
  }
  const nomePaciente=(nome||'paciente').replace(/\s+/g,'_').toLowerCase();

  if(Cap && Cap.Plugins && Cap.Plugins.Filesystem && Cap.Plugins.Share){
    try{
      const blob=pdf.output('blob'); const buf=await blob.arrayBuffer(); const bytes=new Uint8Array(buf);
      const b64=btoa(String.fromCharCode(...bytes)); const fname=`parecer_${nomePaciente}.pdf`;
      await Cap.Plugins.Filesystem.writeFile({path:fname,data:b64,directory:'Documents'});
      const url=`capacitor://localhost/_capacitor_file_${fname}`;
      await Cap.Plugins.Share.share({title:'Parecer em PDF',text:'Gerado pelo Mentor Humanista',url,dialogTitle:'Compartilhar PDF'});
    }catch(e){ console.error(e); pdf.save(`parecer_${nomePaciente}.pdf`); }
  } else {
    pdf.save(`parecer_${nomePaciente}.pdf`);
  }
  root.style.width=prevW; mount.remove();
}
