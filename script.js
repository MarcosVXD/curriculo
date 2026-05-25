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

document.getElementById('formCurriculo')
.addEventListener('submit', function(e){

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

  const maxSize = 5 * 1024 * 1024;

  if(arquivo.size > maxSize){

    error.style.display = 'block';

    error.textContent = 'O PDF deve ter no máximo 5MB.';

    return;

  }

  console.log("Nome do candidato:", nome);

  console.log("Arquivo:", arquivo.name);

  success.style.display = 'block';

  this.reset();

  fileName.textContent = 'Nenhum arquivo selecionado';

});