const inputPDF = document.getElementById('pdf');
const fileName = document.getElementById('fileName');
const success = document.getElementById('success');
const error = document.getElementById('error');

inputPDF.addEventListener('change', () => {
  const file = inputPDF.files[0];
  if(file){
    fileName.textContent = file.name;
  }else{
    fileName.textContent = 'Nenhum arquivo selecionado';
  }
});

// Adicionamos a palavra 'async' aqui para poder esperar a resposta do servidor
document.getElementById('formCurriculo').addEventListener('submit', async function(e){
  e.preventDefault();

  success.style.display = 'none';
  error.style.display = 'none';

  const nome = document.getElementById('nome').value;
  const arquivo = inputPDF.files[0];

  if(!arquivo){
    error.style.display = 'block';
    error.textContent = 'Selecione um arquivo PDF.';
    return;
  }

  if(arquivo.type !== 'application/pdf'){
    error.style.display = 'block';
    error.textContent = 'O arquivo deve ser um PDF.';
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if(arquivo.size > maxSize){
    error.style.display = 'block';
    error.textContent = 'O PDF deve ter no máximo 5MB.';
    return;
  }

  // ==========================================
  // A MÁGICA ACONTECE AQUI: ENVIO PARA O BACKEND
  // ==========================================
  
  // 1. Empacotamos os dados no formato que o servidor entende (FormData)
  const formData = new FormData();
  formData.append('nome', nome);
  formData.append('pdf', arquivo);

  try {
    // 2. Enviamos para a porta 3000 onde o Node.js está rodando
    const response = await fetch('http://localhost:3000/api/curriculos', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    // 3. Verificamos se o servidor respondeu com sucesso
    if (response.ok) {
        success.style.display = 'block';
        this.reset(); // Limpa o formulário
        fileName.textContent = 'Nenhum arquivo selecionado';
    } else {
        // Se deu erro lá no banco ou no Node, mostra aqui
        error.style.display = 'block';
        error.textContent = data.error || 'Erro ao salvar no banco de dados.';
    }

  } catch (err) {
    // Se o servidor Node.js estiver desligado, cai aqui
    error.style.display = 'block';
    error.textContent = 'Erro de conexão. O servidor Node.js está rodando?';
    console.error('Erro no fetch:', err);
  }

});