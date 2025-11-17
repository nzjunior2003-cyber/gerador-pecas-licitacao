

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentType, DfdData, EtpData, RiscoData, OrcamentoData, OrcamentoItemGroup, EtpItem, RiskItem, EtpQualidadeItem } from '../types';

// --- INSTRUÇÕES PARA ADICIONAR A FONTE MONTSERRAT ---
// 1. Obtenha os arquivos .ttf da fonte Montserrat (ex: Montserrat-Regular.ttf e Montserrat-Bold.ttf).
// 2. Converta cada arquivo .ttf para uma string Base64. Você pode usar uma ferramenta online.
// 3. Cole a string Base64 resultante nas variáveis correspondentes abaixo.
const montserratRegularBase64 = ''; 
const montserratBoldBase64 = ''; 

const FONT_FAMILY = 'Montserrat';
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 25;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Style Constants
const HEADER_BLUE_DARK = '#2F5597';
const HEADER_TEXT_WHITE = '#FFFFFF';
const BORDER_COLOR_DARK = '#444444';

let yPos = MARGIN_TOP;

const registerMontserratFont = (doc: jsPDF) => {
    try {
        if (montserratRegularBase64 && montserratBoldBase64) {
            const fontList = doc.getFontList();
            if (fontList[FONT_FAMILY]) {
                return;
            }
            doc.addFileToVFS('Montserrat-Regular.ttf', montserratRegularBase64);
            doc.addFileToVFS('Montserrat-Bold.ttf', montserratBoldBase64);
            doc.addFont('Montserrat-Regular.ttf', FONT_FAMILY, 'normal');
            doc.addFont('Montserrat-Bold.ttf', FONT_FAMILY, 'bold');
        } else {
             console.warn("Dados da fonte Montserrat não fornecidos. Usando Helvetica.");
        }
    } catch (e) {
        console.error("Erro ao registrar a fonte Montserrat.", e);
    }
}

const setDefaultFont = (doc: jsPDF) => {
    try {
        doc.getFont(FONT_FAMILY, 'normal'); 
        doc.setFont(FONT_FAMILY, 'normal');
    } catch(e) {
        doc.setFont('helvetica', 'normal');
    }
}

const checkAndAddPage = (doc: jsPDF, neededHeight: number) => {
    if (yPos + neededHeight > (PAGE_HEIGHT - MARGIN_BOTTOM)) {
        doc.addPage();
        yPos = MARGIN_TOP;
        return true;
    }
    return false;
};

const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
    doc.setFontSize(14);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text(title.toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 7;
    if (subtitle) {
        doc.setFontSize(11);
        doc.setFont(FONT_FAMILY, 'normal');
        doc.text(subtitle, PAGE_WIDTH / 2, yPos, { align: 'center' });
        yPos += 8;
    }
    yPos += 5; // Extra space after header
};

const addSectionTitle = (doc: jsPDF, title: string, subtitle?: string) => {
    const neededHeight = subtitle ? 22 : 15;
    if(checkAndAddPage(doc, neededHeight)) {
        yPos += 5; // add some padding if a new page was added
    }

    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(11);
    doc.text(title, MARGIN_LEFT, yPos);
    yPos += 6;

    if (subtitle) {
        doc.setFont(FONT_FAMILY, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(subtitle, MARGIN_LEFT, yPos);
        yPos += 8;
        doc.setTextColor(0);
    }
    yPos += 2;
};


const addText = (doc: jsPDF, text: string, options: { isBold?: boolean, indent?: number, isQuestion?: boolean } = {}) => {
    const { isBold = false, indent = 0, isQuestion = false } = options;
    const effectiveWidth = USABLE_WIDTH - indent;
    const lines = doc.splitTextToSize(text || 'Não informado.', effectiveWidth);
    
    checkAndAddPage(doc, lines.length * 5 + 2);

    doc.setFont(FONT_FAMILY, isBold || isQuestion ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.text(lines, MARGIN_LEFT + indent, yPos);
    yPos += lines.length * 5 + (isQuestion ? 2 : 0); 
};

const addSignatory = (doc: jsPDF, data: { cidade: string; data: string; nome: string; cargo: string; funcao: string; }) => {
    checkAndAddPage(doc, 40);
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    addText(doc, `${data.cidade} (PA), ${formattedDate}.`);
    yPos += 30;

    checkAndAddPage(doc, 20);
    addText(doc, data.nome, { isBold: true });
    yPos -= 2; // small adjustment
    addText(doc, data.cargo);
    addText(doc, `Função: ${data.funcao}`);
};

const commonAutoTableOptions = {
    theme: 'grid',
    styles: { font: FONT_FAMILY, fontSize: 9, cellPadding: 2, lineColor: BORDER_COLOR_DARK, lineWidth: 0.1 },
    headStyles: { fillColor: HEADER_BLUE_DARK, textColor: HEADER_TEXT_WHITE, fontStyle: 'bold' as const },
    footStyles: { fillColor: '#EAEAEA', textColor: '#000000', fontStyle: 'bold' as const },
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
};

// --- DFD ---
const generateDfdPdf = (doc: jsPDF, data: DfdData) => {
    // 1. Title
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(12);
    doc.text('DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 15;

    // 2. Memo
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(11);
    doc.text(`Memorando nº ${data.numeroMemo}/${data.ano}`, MARGIN_LEFT, yPos);
    yPos += 15;

    // 3. Body
    doc.text(`À ${data.unidade || '... (unidade de compras do órgão)'},`, MARGIN_LEFT, yPos);
    yPos += 15;

    const bodyStyle = {
        align: 'justify' as const,
        lineHeightFactor: 1.5
    };

    const p1 = `Solicito que seja providenciada a solução para ${data.problema || '... (expor o problema a ser solucionado)'}.`;
    let lines = doc.splitTextToSize(p1, USABLE_WIDTH);
    doc.text(lines, MARGIN_LEFT, yPos, bodyStyle);
    yPos += lines.length * 5 * bodyStyle.lineHeightFactor;
    yPos += 5;

    const p2 = `Estimo que o quantitativo necessário é de ${data.quantitativo || '... (indicar a quantidade x periodicidade)'}.`;
    lines = doc.splitTextToSize(p2, USABLE_WIDTH);
    doc.text(lines, MARGIN_LEFT, yPos, bodyStyle);
    yPos += lines.length * 5 * bodyStyle.lineHeightFactor;
    yPos += 5;
    
    const formattedPrazo = data.prazo ? new Date(data.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '... (indicar prazo para o término do processo de compra)';
    const p3 = `Informo que a aquisição deve ser feita até ${formattedPrazo}, considerando que ${data.justificativaPrazo || '... (justificar o prazo indicado)'}.`;
    lines = doc.splitTextToSize(p3, USABLE_WIDTH);
    doc.text(lines, MARGIN_LEFT, yPos, bodyStyle);
    yPos += lines.length * 5 * bodyStyle.lineHeightFactor;
    yPos += 10;

    doc.text('Por fim, ressalto que:', MARGIN_LEFT, yPos);
    yPos += 10;

    // 4. Checkboxes
    const checkboxSize = 4;
    const checkboxTextIndent = 7;
    const checkboxOptions = [
        { key: 'sim', text: 'a contratação pretendida está prevista no Plano de Contratações Anual deste exercício.'},
        { key: 'nao', text: 'a contratação pretendida não está prevista no Plano de Contratações Anual deste exercício.'},
        { key: 'inexistente', text: 'ainda não há Plano de Contratações Anual aprovado para este exercício.'},
    ];

    checkboxOptions.forEach(option => {
        checkAndAddPage(doc, 15);
        const isChecked = data.statusPCA === option.key;
        const textLines = doc.splitTextToSize(option.text, USABLE_WIDTH - checkboxTextIndent);
        
        const checkboxY = yPos - checkboxSize + 2;
        doc.setLineWidth(0.3);
        doc.rect(MARGIN_LEFT, checkboxY, checkboxSize, checkboxSize);
        if (isChecked) {
            doc.setFont(FONT_FAMILY, 'bold');
            doc.text('X', MARGIN_LEFT + 1, yPos + 1);
            doc.setFont(FONT_FAMILY, 'normal');
        }

        doc.text(textLines, MARGIN_LEFT + checkboxTextIndent, yPos);
        yPos += textLines.length * 5 + 5;
    });
    
    yPos += 20;

    // 5. Signature
    checkAndAddPage(doc, 40);
    const date = new Date(data.data + 'T00:00:00');
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    doc.text(`${data.cidade || 'Cidade'} (PA), ${formattedDate}.`, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 30;

    doc.text('(Assinatura)', PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text((data.nome || 'NOME DO SERVIDOR').toUpperCase(), PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(`${data.cargo || 'Cargo'} e ${data.funcao || 'função'}`, PAGE_WIDTH / 2, yPos, { align: 'center' });
};


// --- ETP ---
const generateEtpPdf = (doc: jsPDF, data: EtpData) => {
    addHeader(doc, 'ESTUDO TÉCNICO PRELIMINAR (ETP)', `PAE Nº ${data.pae}`);

    // Section 1
    addSectionTitle(doc, '1 – DESCRIÇÃO DA NECESSIDADE', '(art. 18, §1º, I, da Lei Federal nº 14.133/21)');
    addText(doc, data.necessidade);
    yPos += 5;

    // Section 2
    addSectionTitle(doc, '2 – LEVANTAMENTO DE MERCADO', '(arts. 18, §1º, V, e 44 da Lei Federal nº 14.133/21)');
    addText(doc, `Fontes pesquisadas: ${data.fontesPesquisa?.join(', ')}${data.fonteOutro ? ` (Outro: ${data.fonteOutro})` : ''}.`);
    addText(doc, `Justificativa técnica e econômica: ${data.justificativaTecnica}`);
    addText(doc, `Restrição de fornecedores: ${data.restricaoFornecedores === 'sim' ? 'Sim' : 'Não'}`);
    yPos += 5;

    // Section 3
    addSectionTitle(doc, '3 – DESCRIÇÃO DOS REQUISITOS DE CONTRATAÇÃO', '(art. 18, §1º, III, da Lei Federal nº 14.133/21)');
    addText(doc, `Tipo de objeto: ${data.tipoObjeto?.join(', ')}`);
    addText(doc, `Natureza: ${data.natureza}`);
    addText(doc, `Monopólio: ${data.monopolio}`);
    let vigenciaText = data.vigencia === 'outro' ? `${data.vigenciaOutroNum} ${data.vigenciaOutroTipo}` : data.vigencia;
    addText(doc, `Vigência: ${vigenciaText}`);
    addText(doc, `Prorrogação: ${data.prorrogacao}`);
    addText(doc, `Transição Contratual: ${data.transicao}`);
    if (data.transicao === 'sim') addText(doc, `Contrato: ${data.transicaoContrato}, Prazo: ${data.transicaoPrazo}`, { indent: 5 });
    
    addText(doc, 'Padrão Mínimo de Qualidade:', { isBold: true });
    data.padraoQualidade?.forEach((item: EtpQualidadeItem) => addText(doc, `- ${item.descricao}`, { indent: 5 }));
    
    addText(doc, 'Quais critérios de sustentabilidade?', { isQuestion: true });
    data.sustentabilidade?.forEach(s => addText(doc, `(X) ${s}`, { indent: 5 }));
    if(data.sustentabilidade?.includes('Outro.') && data.sustentabilidadeOutro) addText(doc, `Especificar: ${data.sustentabilidadeOutro}`, { indent: 10 });
    
    addText(doc, 'Há prioridade para aquisição ou contratação, conforme Lei nº 12.035/2010?', { isQuestion: true });
    if(data.prioridadeLeiTipo) {
      const prioridadeText = data.prioridadeLeiTipo === 'reciclados' ? 'Sim, para produtos reciclados e recicláveis.' 
          : data.prioridadeLeiTipo === 'sustentaveis' ? 'Sim, para bens, serviços e obras que considerem critérios compatíveis com padrões de consumo social e ambientalmente sustentáveis.' 
          : 'Não.';
      addText(doc, `(X) ${prioridadeText}`, { indent: 5 });
      if (data.prioridadeLeiTipo === 'nao' && data.prioridadeLeiJustificativa) {
        addText(doc, `Justificativa: ${data.prioridadeLeiJustificativa}`, { indent: 10 });
      }
    }

    addText(doc, 'Há necessidade de treinamento?', { isQuestion: true });
    addText(doc, data.treinamento === 'sim' ? '(X) Sim' : data.treinamento === 'nao' ? '(X) Não' : 'Não informado', { indent: 5 });
    yPos += 5;

    // Section 4
    addSectionTitle(doc, '4 – DESCRIÇÃO DA SOLUÇÃO', '(art. 18, §1º, VII, da Lei Federal nº 14.133/21)');
    addText(doc, 'O que será contratado?', { isQuestion: true });
    addText(doc, data.solucaoContratacao);

    addText(doc, 'Qual o prazo da garantia contratual?', { isQuestion: true });
    let garantiaText = '';
    switch(data.garantiaContratual) {
        case 'nao_ha': garantiaText = 'Não há.'; break;
        case '90_dias': garantiaText = '90 dias.'; break;
        case '12_meses': garantiaText = '12 meses.'; break;
        case 'outro': garantiaText = `Outro: ${data.garantiaOutroNum} ${data.garantiaOutroTipo}`; break;
        default: garantiaText = 'Não informado.';
    }
    addText(doc, `(X) ${garantiaText}`, { indent: 5 });

    addText(doc, 'Há necessidade de assistência técnica?', { isQuestion: true });
    addText(doc, data.assistenciaTecnica === 'sim' ? '(X) Sim' : data.assistenciaTecnica === 'nao' ? '(X) Não' : 'Não informado', { indent: 5 });

    addText(doc, 'Há necessidade de manutenção?', { isQuestion: true });
    addText(doc, data.manutencao === 'sim' ? '(X) Sim' : data.manutencao === 'nao' ? '(X) Não' : 'Não informado', { indent: 5 });
    yPos += 5;

    // Section 5
    addSectionTitle(doc, '5 – DIMENSIONAMENTO DO OBJETO', '(art. 18, §1º, IV, da Lei Federal nº 14.133/21)');
    addText(doc, 'Como se obteve o quantitativo estimado?', { isQuestion: true });
    data.metodoQuantitativo?.forEach(m => addText(doc, `(X) ${m}`, { indent: 5 }));
    if(data.metodoQuantitativo?.includes('Outro.') && data.metodoOutro) addText(doc, `Especificar: ${data.metodoOutro}`, { indent: 10 });

    addText(doc, 'Descrição do Quantitativo:', { isBold: true });
    addText(doc, data.descricaoQuantitativo);
    yPos += 5;

    // Section 6
    addSectionTitle(doc, '6 – ESTIMATIVA DO VALOR DA CONTRATAÇÃO', '(art. 18, §1º, VI, da Lei Federal nº 14.133/21)');
    addText(doc, 'Meios usados na pesquisa:', { isQuestion: true });
    data.meiosPesquisa?.forEach(m => addText(doc, `(X) ${m}`, { indent: 5 }));
    if(data.meiosPesquisa?.includes('Outro.') && data.meiosPesquisaOutro) addText(doc, `Especificar: ${data.meiosPesquisaOutro}`, { indent: 10 });
    yPos += 5;
    
    // Tabela de itens
    if (data.itens && data.itens.length > 0) {
        const body = data.itens.map((item, index) => [
            index + 1,
            item.descricao,
            item.unidade,
            item.quantidade,
            item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            (item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ]);
        const totalGeral = data.itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
        
        checkAndAddPage(doc, data.itens.length * 10 + 20);
        autoTable(doc, {
            ...commonAutoTableOptions,
            startY: yPos,
            head: [['Item', 'Descrição', 'Unidade', 'Qtd', 'Valor Unit.', 'Valor Total']],
            body: body,
            foot: [['Total', '', '', '', '', totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
            didDrawPage: (hookData) => { yPos = hookData.cursor?.y || yPos; }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Section 7
    addSectionTitle(doc, '7 – JUSTIFICATIVA PARA O PARCELAMENTO DA SOLUÇÃO', '(art. 18, §1º, VIII, art. 40, V, b, 47, II, da Lei Federal nº 14.133/21)');
    addText(doc, 'A solução será dividida em itens?', { isQuestion: true });
    addText(doc, data.parcelamento === 'sim' ? '(X) Sim.' : data.parcelamento === 'nao' ? '(X) Não.' : 'Não informado.', { indent: 5 });
    if(data.parcelamento === 'nao') {
      addText(doc, 'Por quê?', { isQuestion: true, indent: 5 });
      data.motivosNaoParcelamento?.forEach(m => addText(doc, `(X) ${m}`, { indent: 10 }));
      if(data.motivosNaoParcelamento?.includes('Outro.') && data.motivosNaoParcelamentoOutro) addText(doc, `Especificar: ${data.motivosNaoParcelamentoOutro}`, { indent: 15 });
    }
    yPos += 5;
    
    // Section 8
    addSectionTitle(doc, '8 – CONTRATAÇÕES CORRELATAS OU INTERDEPENDENTES', '(art. 18, §1º, XI, da Lei Federal nº 14.133/21)');
    addText(doc, 'Há contratações correlatas ou interdependentes?', { isQuestion: true });
    addText(doc, data.contratacoesCorrelatas === 'sim' ? '(X) Sim.' : data.contratacoesCorrelatas === 'nao' ? '(X) Não.' : 'Não informado.', { indent: 5 });
    if(data.contratacoesCorrelatas === 'sim' && data.contratacoesCorrelatasEspecificar) addText(doc, `Especificar: ${data.contratacoesCorrelatasEspecificar}`, { indent: 10 });
    yPos += 5;
    
    // Section 9
    addSectionTitle(doc, '9 – ALINHAMENTO DA CONTRATAÇÃO COM O PLANEJAMENTO', '(art. 18, §1º, II, da Lei Federal nº 14.133/21)');
    addText(doc, 'Há previsão no plano de contratações anual?', { isQuestion: true });
    addText(doc, data.previsaoPCA === 'sim' ? '(X) Sim.' : data.previsaoPCA === 'nao' ? '(X) Não.' : 'Não informado.', { indent: 5 });
    if(data.previsaoPCA === 'sim' && data.itemPCA) addText(doc, `Especificar item do PCA: ${data.itemPCA}`, { indent: 10 });
    if(data.previsaoPCA === 'nao' && data.justificativaPCA) addText(doc, `Justificativa e providências: ${data.justificativaPCA}`, { indent: 10 });
    yPos += 5;
    
    // Section 10
    addSectionTitle(doc, '10 – RESULTADOS PRETENDIDOS', '(art. 18, §1º, IX, da Lei Federal nº 14.133/21)');
    addText(doc, 'Quais os benefícios pretendidos na contratação?', { isQuestion: true });
    data.beneficios?.forEach(b => addText(doc, `(X) ${b}`, { indent: 5 }));
    if(data.beneficios?.includes('Outro.') && data.beneficiosOutro) addText(doc, `Especificar: ${data.beneficiosOutro}`, { indent: 10 });
    yPos += 5;
    
    // Section 11
    addSectionTitle(doc, '11 – PENDÊNCIAS RELATIVAS À CONTRATAÇÃO', '(art. 18, §1º, X, da Lei Federal nº 14.133/21)');
    addText(doc, 'Há providências pendentes para o sucesso da contratação?', { isQuestion: true });
    addText(doc, data.pendencias === 'sim' ? '(X) Sim.' : data.pendencias === 'nao' ? '(X) Não.' : 'Não informado.', { indent: 5 });
    if(data.pendencias === 'sim' && data.pendenciasEspecificar) addText(doc, `Especificar: ${data.pendenciasEspecificar}`, { indent: 10 });
    addText(doc, 'Quais são os setores responsáveis pelas providências pendentes?', { isQuestion: true });
    addText(doc, data.pendenciasResponsaveis);
    yPos += 5;

    // Section 12
    addSectionTitle(doc, '12 – IMPACTOS AMBIENTAIS E MEDIDAS DE MITIGAÇÃO', '(art. 18, §1º, XII, da Lei Federal nº 14.133/21)');
    addText(doc, 'Há previsão de impacto ambiental na contratação?', { isQuestion: true });
    addText(doc, data.impactoAmbiental === 'sim' ? '(X) Sim.' : data.impactoAmbiental === 'nao' ? '(X) Não.' : 'Não informado.', { indent: 5 });
    if(data.impactoAmbiental === 'sim') {
        addText(doc, `Impactos: ${data.impactos}`, { indent: 10 });
        addText(doc, `Medidas de mitigação: ${data.medidasMitigacao}`, { indent: 10 });
    }
    yPos += 5;
    
    // Section 13
    addSectionTitle(doc, '13 – DECLARAÇÃO DE VIABILIDADE');
    addText(doc, 'A contratação possui viabilidade técnica, socioeconômica e ambiental?', { isQuestion: true });
    addText(doc, data.viabilidade === 'sim' ? '(X) Sim.' : data.viabilidade === 'nao' ? '(X) Não.' : 'Não informado.', { indent: 5 });
    
    // Assinatura
    addSignatory(doc, data);
};


// --- ANÁLISE DE RISCO ---
const generateRiscoPdf = (doc: jsPDF, data: RiscoData) => {
    addHeader(doc, 'ANÁLISE DE RISCOS', `PAE Nº ${data.pae}`);
    
    if (data.riscos && data.riscos.length > 0) {
        data.riscos.forEach((risco: RiskItem, index) => {
            const tableBody = [
                ['Descrição do Risco', risco.descricao],
                ['Probabilidade', risco.probabilidade],
                ['Impacto', risco.impacto],
                ['Dano', risco.dano],
                ['Ação Preventiva', `Descrição: ${risco.prevDesc}\nResponsável: ${risco.prevResp}`],
                ['Ação Contingencial', `Descrição: ${risco.contDesc}\nResponsável: ${risco.contResp}`],
            ];
            
            checkAndAddPage(doc, 70); // Estimate height
            autoTable(doc, {
                ...commonAutoTableOptions,
                startY: yPos,
                head: [[{ content: `RISCO ${index + 1}`, colSpan: 2, styles: { halign: 'center' } }]],
                body: tableBody,
                theme: 'striped',
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
                didDrawPage: (hookData) => { yPos = hookData.cursor?.y || yPos; }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        });
    } else {
        addText(doc, 'Nenhum risco foi identificado.');
    }
    
    addSignatory(doc, data);
};

// --- ORÇAMENTO ---
const generateOrcamentoPdf = (doc: jsPDF, data: OrcamentoData) => {
    // Implementação futura do PDF de Orçamento
    doc.text("PDF de Orçamento - Em desenvolvimento", MARGIN_LEFT, yPos);
};


// --- MAIN EXPORT ---
export const generatePdf = (docType: DocumentType, data: any): { success: boolean; error?: string } => {
    const doc = new jsPDF();
    yPos = MARGIN_TOP; // Reset yPos for each new PDF generation

    try {
        registerMontserratFont(doc);
        setDefaultFont(doc);

        switch (docType) {
            case DocumentType.DFD:
                generateDfdPdf(doc, data as DfdData);
                break;
            case DocumentType.ETP:
                generateEtpPdf(doc, data as EtpData);
                break;
            case DocumentType.RISCO:
                generateRiscoPdf(doc, data as RiscoData);
                break;
            case DocumentType.ORCAMENTO:
                generateOrcamentoPdf(doc, data as OrcamentoData);
                break;
            default:
                throw new Error('Tipo de documento não suportado.');
        }

        doc.save(`${docType}_${data.pae || data.numeroMemo || 'documento'}.pdf`);
        return { success: true };
    } catch (error: any) {
        console.error('Erro ao gerar PDF:', error);
        return { success: false, error: error.message || 'Erro desconhecido.' };
    }
};
