// Código original permanece inalterado, mas remove execução automática DOMContentLoaded
let checklistEditando = null;
let itensOrcamento = [];
let streamCamera = null;
let fotosVeiculo = JSON.parse(localStorage.getItem('fotosVeiculo') || '[]');
const OFICINAS_VALIDAS = ['of_k3m9d82j1l9xp2q','of_p8n2k91m3x7y4z'];
function getOficinaId(){const params=new URLSearchParams(window.location.search);const id=params.get('oficina')||'modelo';if(!OFICINAS_VALIDAS.includes(id)&&id!=='modelo'){console.warn('⚠️ oficinaId inválido:',id);if(typeof mostrarNotificacao==='function'){mostrarNotificacao('Acesso negado. Entre em contato com o suporte.','error');}return 'modelo';}return id;}
const OFICINA_ID=getOficinaId();
function normalizeId(value){if(window.CoreUtils?.normalizeId)return window.CoreUtils.normalizeId(value);return String(value??'').trim();}
function gerarIdChecklist(){if(window.CoreUtils?.generateStableId)return window.CoreUtils.generateStableId('chk');return`chk_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;}
function getChecklistStorageKey(){const oficinaId=window.OFICINA_CONFIG?.oficina_id||'sem_identificacao';return`checklists_${oficinaId}`;}
function carregarChecklistsLocais(){const chaveAtual=getChecklistStorageKey();const checklistsOficina=JSON.parse(localStorage.getItem(chaveAtual)||'[]');if(checklistsOficina.length>0)return checklistsOficina;const legado=JSON.parse(localStorage.getItem('checklists')||'[]');const oficinaAtual=window.OFICINA_CONFIG?.oficina_id;if(!oficinaAtual||legado.length===0)return[];const filtrados=legado.filter(c=>(c.oficina_id||oficinaAtual)===oficinaAtual);if(filtrados.length>0){salvarLocalStorage(chaveAtual,filtrados);}return filtrados;}
function salvarLocalStorage(chave,valor){try{localStorage.setItem(chave,JSON.stringify(valor));return true;}catch(e){if(e.name==='QuotaExceededError'||e.code===22){alert('⚠️ ESPAÇO ESGOTADO!\n\n'+'O armazenamento local está cheio.\n'+'Ações:\n'+'1. Exporte seus dados (botão "Exportar")\n'+'2. Limpe dados antigos\n'+'3. Sincronize com a nuvem');console.error('localStorage cheio:',e);}else{console.error('Erro ao salvar:',e);alert('Erro ao salvar dados: '+e.message);}return false;}}
function gerarNumeroOS(){const placa=(document.getElementById('placa')?.value||'SEM').replace(/[^a-zA-Z0-9]/g,'').toUpperCase();let dataRaw=document.getElementById('data')?.value;let dataObj=dataRaw?new Date(dataRaw+'T00:00:00'):new Date();const dia=String(dataObj.getDate()).padStart(2,'0');const mes=String(dataObj.getMonth()+1).padStart(2,'0');const ano=String(dataObj.getFullYear()).slice(-2);return`${placa}-${dia}${mes}${ano}`;}
function calcularDataPrevisao(){const hoje=new Date();let diasAdicionados=0;let diasUteis=0;while(diasUteis<3){diasAdicionados++;const dataTemp=new Date(hoje);dataTemp.setDate(dataTemp.getDate()+diasAdicionados);const diaSemana=dataTemp.getDay();if(diaSemana!==0&&diaSemana!==6){diasUteis++;}}const previsao=new Date(hoje);previsao.setDate(previsao.getDate()+diasAdicionados);previsao.setHours(18,0,0,0);return firebase.firestore.Timestamp.fromDate(previsao);}
// ... resto do código permanece igual, mas SEM document.addEventListener('DOMContentLoaded')
// REMOVER:
// document.addEventListener('DOMContentLoaded', () => { ... });
console.log('✅ Checklist.js carregado (aguardando iniciarSistema)');