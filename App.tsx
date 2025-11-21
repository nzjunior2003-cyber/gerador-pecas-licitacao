
import React, { useState, useMemo, useEffect } from 'react';
import { DocumentType, DfdData, EtpData, RiscoData, OrcamentoData } from './types';
import { generatePdf } from './services/pdfGenerator';
import { DfdForm } from './components/DfdForm';
import { EtpForm } from './components/EtpForm';
import { RiscoForm } from './components/RiscoForm';
import { OrcamentoForm } from './components/OrcamentoForm';
import { useFormWithHistory } from './hooks/useFormWithHistory';
import { GoogleGenAI, Type } from "@google/genai";

const today = new Date().toISOString().split('T')[0];

const initialSignatory = {
  cidade: 'Belém',
  data: today,
  nome: '',
  cargo: '',
  funcao: '',
};

const initialDfdState: DfdData = {
  ...initialSignatory,
  numeroMemo: '',
  ano: new Date().getFullYear().toString(),
  unidade: '',
  problema: '',
  quantitativo: '',
  prazo: today,
  justificativaPrazo: '',
  statusPCA: '',
  nomeGuerra: '',
};

const initialEtpState: EtpData = {
  ...initialSignatory,
  numero: '',
  ano: new Date().getFullYear().toString(),
  pae: '',
  necessidade: '',
  fontesPesquisa: [],
  fonteOutro: '',
  justificativaTecnica: '',
  restricaoFornecedores: '',
  tipoObjeto: [],
  natureza: '',
  monopolio: '',
  vigencia: '',
  vigenciaOutroNum: '',
  vigenciaOutroTipo: 'dias',
  prorrogacao: '',
  transicao: '',
  transicaoContrato: '',
  transicaoPrazo: '',
  padraoQualidade: [],
  sustentabilidade: [],
  sustentabilidadeOutro: '',
  prioridadeLeiTipo: '',
  prioridadeLeiJustificativa: '',
  treinamento: '',
  solucaoContratacao: '',
  garantiaContratual: '',
  garantiaOutroNum: '',
  garantiaOutroTipo: 'dias',
  assistenciaTecnica: '',
  manutencao: '',
  metodoQuantitativo: [],
  metodoOutro: '',
  descricaoQuantitativo: '',
  itens: [],
  meiosPesquisa: [],
  meiosPesquisaOutro: '',
  parcelamento: '',
  motivosNaoParcelamento: [],
  motivosNaoParcelamentoOutro: '',
  contratacoesCorrelatas: '',
  contratacoesCorrelatasEspecificar: '',
  previsaoPCA: '',
  itemPCA: '',
  justificativaPCA: '',
  beneficios: [],
  beneficiosOutro: '',
  pendencias: '',
  pendenciasEspecificar: '',
  pendenciasResponsaveis: '',
  impactoAmbiental: '',
  impactos: '',
  medidasMitigacao: '',
  viabilidade: '',
};

const initialRiscoState: RiscoData = {
    ...initialSignatory,
    pae: '',
    riscos: []
};

const initialOrcamentoState: OrcamentoData = {
    cidade: 'Belém',
    data: today,
    pae: '',
    tipoOrcamento: 'licitacao',
    numeroAta: '',
    anoAta: '2024',
    orgaoAta: '',
    estadoAta: '',
    modalidadeLicitacao: 'pregao_eletronico_comum',
    itemGroups: [],
    fontesPesquisa: ['direta'], // Pre-selected based on PDF
    justificativaAusenciaFonte: '',
    justificativaPesquisaDireta: '',
    fornecedoresDiretos: [],
    metodologia: '',
    precosEncontrados: {},
    precosIncluidos: {},
    houveDescarte: 'nao',
    justificativaDescarte: '',
    assinante1Nome: '',
    assinante1NomeGuerra: '',
    assinante1Cargo: '',
    assinante1Funcao: '',
    assinante2Nome: '',
    assinante2NomeGuerra: '',
    assinante2Cargo: '',
    assinante2Funcao: '',
};

const documentOptions = [
    { 
        type: DocumentType.DFD, 
        title: "DFD", 
        description: "Documento de Formalização da Demanda", 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-5-4h.01M12 12h.01M12 16h.01" /></svg>,
        color: 'from-sky-500 to-indigo-500'
    },
    { 
        type: DocumentType.ETP, 
        title: "ETP", 
        description: "Estudo Técnico Preliminar", 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
        color: 'from-amber-500 to-orange-500'
    },
    { 
        type: DocumentType.ORCAMENTO, 
        title: "Orçamento", 
        description: "Orçamento Estimado (Pesquisa de Preço)", 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
        color: 'from-green-500 to-emerald-500'
    },
    { 
        type: DocumentType.RISCO, 
        title: "Análise de Risco", 
        description: "Análise de Risco", 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 0118-8.944c0 1.964-.372 3.843-1.035 5.574A11.945 11.945 0 0121 12a11.955 11.955 0 01-2.618-6.984v-.001z" /></svg>,
        color: 'from-red-500 to-red-600'
    },
    { 
        type: DocumentType.TR_BENS, 
        title: "TR (Bens)", 
        description: "Termo de Referência (Bens)", 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        color: 'from-gray-600 to-gray-700'
    },
    { 
        type: DocumentType.TR_SERVICOS, 
        title: "TR (Serviços)", 
        description: "Termo de Referência (Serviços)", 
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        color: 'from-slate-600 to-slate-700'
    }
];

const DocumentSelector: React.FC<{onSelect: (docType: DocumentType) => void}> = ({ onSelect }) => (
    <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Selecione o Tipo de Documento</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Clique em uma das opções abaixo para começar a preencher o formulário correspondente.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentOptions.map(doc => (
                <button 
                    key={doc.type} 
                    onClick={() => onSelect(doc.type)}
                    className={`flex flex-col justify-center items-center p-6 bg-gradient-to-br ${doc.color} text-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 min-h-[180px]`}
                >
                    {doc.icon}
                    <span className="font-bold text-xl mb-1">{doc.title}</span>
                    <span className="text-sm opacity-90 text-center">{doc.description}</span>
                </button>
            ))}
        </div>
    </div>
);

const Toast: React.FC<{
  message: string;
  type: 'success' | 'info' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 max-w-sm w-full p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down z-50";
  const typeClasses = {
    success: 'bg-green-100 border border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-600 dark:text-green-300',
    info: 'bg-blue-100 border border-blue-400 text-blue-800 dark:bg-blue-900/50 dark:border-blue-600 dark:text-blue-300',
    error: 'bg-red-100 border border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-600 dark:text-red-300',
  };
   const Icon = {
    success: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    error: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      <div className="flex-shrink-0">{Icon[type]}</div>
      <div className="flex-grow">{message}</div>
      <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 hover:bg-white/50 dark:hover:bg-white/20">
        <span className="sr-only">Dismiss</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>
    </div>
  );
};


function App() {
  const [docType, setDocType] = useState<DocumentType>(DocumentType.NONE);
  const [dfdData, setDfdData, undoDfd, canUndoDfd, resetDfdData] = useFormWithHistory<DfdData>(initialDfdState);
  const [etpData, setEtpData, undoEtp, canUndoEtp, resetEtpData] = useFormWithHistory<EtpData>(initialEtpState);
  const [riscoData, setRiscoData, undoRisco, canUndoRisco, resetRiscoData] = useFormWithHistory<RiscoData>(initialRiscoState);
  const [orcamentoData, setOrcamentoData, undoOrcamento, canUndoOrcamento, resetOrcamentoData] = useFormWithHistory<OrcamentoData>(initialOrcamentoState);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
        const timer = setTimeout(() => {
            setToast(null);
        }, 4000); // 4 seconds
        return () => clearTimeout(timer);
    }
  }, [toast]);
  
  const { undo, canUndo } = useMemo(() => {
    switch (docType) {
        case DocumentType.DFD: return { undo: undoDfd, canUndo: canUndoDfd };
        case DocumentType.ETP: return { undo: undoEtp, canUndo: canUndoEtp };
        case DocumentType.RISCO: return { undo: undoRisco, canUndo: canUndoRisco };
        case DocumentType.ORCAMENTO: return { undo: undoOrcamento, canUndo: canUndoOrcamento };
        default: return { undo: () => {}, canUndo: false };
    }
  }, [docType, canUndoDfd, undoDfd, canUndoEtp, undoEtp, canUndoRisco, undoRisco, canUndoOrcamento, undoOrcamento]);
  
  const currentDocInfo = useMemo(() => documentOptions.find(d => d.type === docType), [docType]);

  const clearForm = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os campos? Esta ação não pode ser desfeita.')) {
      switch (docType) {
        case DocumentType.DFD: resetDfdData(initialDfdState); break;
        case DocumentType.ETP: resetEtpData(initialEtpState); break;
        case DocumentType.RISCO: resetRiscoData(initialRiscoState); break;
        case DocumentType.ORCAMENTO: resetOrcamentoData(initialOrcamentoState); break;
      }
    }
  };

  const saveDraft = () => {
    if (!docType) {
        setToast({ message: 'Selecione um tipo de documento para salvar.', type: 'info' });
        return;
    }
    let dataToSave;
    switch(docType) {
        case DocumentType.DFD: dataToSave = dfdData; break;
        case DocumentType.ETP: dataToSave = etpData; break;
        case DocumentType.RISCO: dataToSave = riscoData; break;
        case DocumentType.ORCAMENTO: dataToSave = orcamentoData; break;
        default: setToast({ message: 'Tipo de documento não suportado para rascunho.', type: 'error' }); return;
    }
    localStorage.setItem(`rascunho_cbmpa_${docType}`, JSON.stringify(dataToSave));
    setToast({ message: 'Rascunho salvo com sucesso!', type: 'success' });
  };

  const loadDraft = () => {
    if (!docType) {
        setToast({ message: 'Selecione um tipo de documento para carregar.', type: 'info' });
        return;
    }
    const savedData = localStorage.getItem(`rascunho_cbmpa_${docType}`);
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        switch(docType) {
            case DocumentType.DFD: resetDfdData(parsedData); break;
            case DocumentType.ETP: resetEtpData(parsedData); break;
            case DocumentType.RISCO: resetRiscoData(parsedData); break;
            case DocumentType.ORCAMENTO: resetOrcamentoData(parsedData); break;
        }
        setToast({ message: 'Rascunho carregado com sucesso!', type: 'success' });
    } else {
        setToast({ message: 'Nenhum rascunho encontrado para este tipo de documento.', type: 'info' });
    }
  };

  const handleGeneratePdf = async () => {
    if (!docType) {
        setToast({ message: 'Por favor, selecione um tipo de documento.', type: 'error' });
        return;
    }
    
    setIsLoading(true);
    // Give browser time to render loading spinner
    await new Promise(resolve => setTimeout(resolve, 50));

    if (docType === DocumentType.DFD) {
        try {
            setToast({ message: 'Analisando e aprimorando o texto com IA...', type: 'info' });
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const formattedPrazo = dfdData.prazo ? new Date(dfdData.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '...';
            
            const prompt = `Você é um especialista em redação de documentos oficiais para a administração pública brasileira. Sua tarefa é gerar três parágrafos distintos, formais, claros e coesos para um 'Documento de Formalização da Demanda' (DFD), baseados nas ideias fornecidas pelo usuário. Retorne um objeto JSON com uma única chave "paragrafos", que deve ser um array contendo os três parágrafos como strings.

1.  Para o primeiro parágrafo, elabore um texto sobre o seguinte problema: "${dfdData.problema}". O parágrafo DEVE começar com a frase exata "Solicito que seja providenciada a solução para ".
2.  Para o segundo parágrafo, elabore um texto sobre o seguinte quantitativo: "${dfdData.quantitativo}". O parágrafo DEVE começar com a frase exata "Estimo que o quantitativo necessário é de ".
3.  Para o terceiro parágrafo, combine o prazo e a justificativa. Use a data "${formattedPrazo}" e a justificativa "${dfdData.justificativaPrazo}". O parágrafo DEVE começar com a frase exata "Informo que a aquisição deve ser concluída até ${formattedPrazo}, tendo em vista que ".

O resultado deve ser exclusivamente o objeto JSON, sem nenhuma explicação ou texto introdutório.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                           paragrafos: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                           }
                        },
                        required: ["paragrafos"]
                    }
                }
            });

            const aiResult = JSON.parse(response.text);
            const dataForPdf = { ...dfdData, aiParagraphs: aiResult.paragrafos };


            setToast({ message: 'Texto aprimorado! Gerando PDF...', type: 'success' });
            const result = generatePdf(docType, dataForPdf as DfdData);
            if (!result.success) {
                setToast({ message: `Ocorreu um erro ao gerar o PDF: ${result.error}`, type: 'error' });
            }
        } catch (e) {
            console.error("AI analysis failed:", e);
            setToast({ message: 'Falha na análise da IA. Gerando PDF com os dados originais.', type: 'info' });
            const result = generatePdf(docType, dfdData); // Fallback
            if (!result.success) {
                setToast({ message: `Ocorreu um erro ao gerar o PDF: ${result.error}`, type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    } else {
        // Logic for other documents
        let data;
        switch(docType) {
            case DocumentType.ETP: data = etpData; break;
            case DocumentType.RISCO: data = riscoData; break;
            case DocumentType.ORCAMENTO: data = orcamentoData; break;
            default: 
                setToast({ message: 'Geração de PDF para este documento ainda não foi implementada.', type: 'info' }); 
                setIsLoading(false);
                return;
        }
        const result = generatePdf(docType, data);
        setIsLoading(false);
        if (!result.success) {
            setToast({ message: `Ocorreu um erro ao gerar o PDF: ${result.error}`, type: 'error' });
        }
    }
  };

  const renderForm = () => {
    switch (docType) {
      case DocumentType.DFD:
        return <DfdForm data={dfdData} setData={setDfdData} />;
      case DocumentType.ETP:
        return <EtpForm data={etpData} setData={setEtpData} />;
      case DocumentType.RISCO:
        return <RiscoForm data={riscoData} setData={setRiscoData} />;
      case DocumentType.ORCAMENTO:
        return <OrcamentoForm data={orcamentoData} setData={setOrcamentoData} />;
      case DocumentType.TR_BENS:
      case DocumentType.TR_SERVICOS:
        return <div className="text-center p-8 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-300">Este formulário ainda está em desenvolvimento.</div>;
      default:
        return <DocumentSelector onSelect={setDocType} />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-cbmpa-blue-start to-cbmpa-blue-end min-h-screen p-4 sm:p-8">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="w-16 h-16 border-4 border-white border-t-cbmpa-red rounded-full animate-spin"></div>
            </div>
        )}
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <header className="bg-gradient-to-r from-cbmpa-red to-cbmpa-purple text-white p-6 sm:p-8 text-center relative">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-shadow">🔥 GERADOR DE DOCUMENTOS CBMPA 🔥</h1>
          <p className="text-sm sm:text-base opacity-90">Sistema de Elaboração de Documentos de Contratação</p>
        </header>

        <main className="p-4 sm:p-8">
          {docType === DocumentType.NONE ? (
             <DocumentSelector onSelect={setDocType} />
          ) : (
            <>
                <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">{currentDocInfo?.description}</h2>
                    <button onClick={() => setDocType(DocumentType.NONE)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors">
                        ← Mudar Documento
                    </button>
                </div>

                {renderForm()}
                
                <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-center">
                    <button onClick={saveDraft} className="flex-grow sm:flex-grow-0 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105">💾 Salvar Rascunho</button>
                    <button onClick={loadDraft} className="flex-grow sm:flex-grow-0 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105">📂 Carregar Rascunho</button>
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className="flex-grow sm:flex-grow-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ↩️ Desfazer
                    </button>
                    <button onClick={clearForm} className="flex-grow sm:flex-grow-0 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105">🗑️ Limpar Tudo</button>
                    <button onClick={handleGeneratePdf} className="flex-grow sm:flex-grow-0 bg-gradient-to-r from-cbmpa-red to-cbmpa-purple text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 shadow-lg">📄 GERAR PDF</button>
                </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
export default App;