

export enum DocumentType {
  NONE = '',
  DFD = 'dfd',
  ETP = 'etp',
  ORCAMENTO = 'orcamento',
  RISCO = 'risco',
  TR_BENS = 'tr-bens',
  TR_SERVICOS = 'tr-servicos',
}

export interface Signatory {
  cidade: string;
  data: string;
  nome: string;
  cargo: string;
  funcao: string;
}

export interface DfdData extends Signatory {
  numeroMemo: string;
  ano: string;
  unidade: string;
  problema: string;
  quantitativo: string;
  prazo: string;
  justificativaPrazo: string;
  statusPCA: 'sim' | 'nao' | 'inexistente' | '';
  nomeGuerra: string;
}

export interface EtpItem {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
}

export interface EtpQualidadeItem {
    id: string;
    descricao: string;
}

export interface EtpData extends Signatory {
    // Identificação
    numero: string;
    ano: string;
    pae: string;
    // 1. Necessidade
    necessidade: string;
    // 2. Mercado
    fontesPesquisa: string[];
    fonteOutro: string;
    justificativaTecnica: string;
    restricaoFornecedores: 'sim' | 'nao' | '';
    // 3. Requisitos
    tipoObjeto: string[];
    natureza: 'continuada' | 'nao-continuada' | '';
    monopolio: 'sim' | 'nao' | '';
    vigencia: string;
    vigenciaOutroNum: string;
    vigenciaOutroTipo: 'dias' | 'meses' | 'anos';
    prorrogacao: 'sim' | 'nao' | 'na' | '';
    transicao: 'sim' | 'nao' | '';
    transicaoContrato: string;
    transicaoPrazo: string;
    padraoQualidade: EtpQualidadeItem[];
    // 3.8 Sustentabilidade
    sustentabilidade: string[];
    sustentabilidadeOutro: string;
    // 3.9 Prioridade
    prioridadeLeiTipo: 'reciclados' | 'sustentaveis' | 'nao' | '';
    prioridadeLeiJustificativa: string;
    // 3.10 Treinamento
    treinamento: 'sim' | 'nao' | '';
    // 4. Solução
    solucaoContratacao: string;
    garantiaContratual: 'nao_ha' | '90_dias' | '12_meses' | 'outro' | '';
    garantiaOutroNum: string;
    garantiaOutroTipo: 'dias' | 'meses' | 'anos';
    assistenciaTecnica: 'sim' | 'nao' | '';
    manutencao: 'sim' | 'nao' | '';
    // 5. Dimensionamento
    metodoQuantitativo: string[];
    metodoOutro: string;
    descricaoQuantitativo: string;
    itens: EtpItem[];
    // 6. Estimativa de valor
    meiosPesquisa: string[];
    meiosPesquisaOutro: string;
    // 7. Parcelamento
    parcelamento: 'sim' | 'nao' | '';
    motivosNaoParcelamento: string[];
    motivosNaoParcelamentoOutro: string;
    // 8. Contratações Correlatas
    contratacoesCorrelatas: 'sim' | 'nao' | '';
    contratacoesCorrelatasEspecificar: string;
    // 9. Alinhamento
    previsaoPCA: 'sim' | 'nao' | '';
    itemPCA: string;
    justificativaPCA: string;
    // 10. Resultados
    beneficios: string[];
    beneficiosOutro: string;
    // 11. Pendências
    pendencias: 'sim' | 'nao' | '';
    pendenciasEspecificar: string;
    pendenciasResponsaveis: string;
    // 12. Impactos Ambientais
    impactoAmbiental: 'sim' | 'nao' | '';
    impactos: string;
    medidasMitigacao: string;
    // 13. Viabilidade
    viabilidade: 'sim' | 'nao' | '';
}

export interface RiskItem {
    id: string;
    descricao: string;
    probabilidade: 'baixa' | 'media' | 'alta' | '';
    impacto: 'baixo' | 'medio' | 'alto' | '';
    dano: string;
    prevDesc: string;
    prevResp: string;
    contDesc: string;
    contResp: string;
}

export interface RiscoData extends Signatory {
    pae: string;
    riscos: RiskItem[];
}

// --- ORCAMENTO TYPES ---
export interface OrcamentoCota {
    id: string;
    ordemTR: string;
    tipo: 'COTA RESERVADA ME/EPP' | 'AMPLA CONCORRÊNCIA' | 'EXCLUSIVO' | 'ME/EPP' | '';
    quantidade: number;
}

export interface OrcamentoItemGroup {
    id: string;
    loteId?: string;
    itemTR: string;
    descricao: string;
    estimativaUnitaria: number;
    codigoSimas: string;
    unidade: string;
    cotas: OrcamentoCota[];
    quantidadeTotal: number;
}

export interface OrcamentoPrice {
    id: string;
    source: string;
    value: string;
}

export type OrcamentoPrecos = {
    [itemGroupId: string]: OrcamentoPrice[];
}

export type OrcamentoPrecosInclusao = {
    [priceId: string]: boolean;
}

export interface OrcamentoFornecedor {
    id: string;
    nome: string;
    justificativa: string;
    requisitos: 'sim' | 'nao' | '';
}

export interface OrcamentoData {
    cidade: string;
    data: string;
    pae: string;
    tipoOrcamento: 'licitacao' | 'adesao_ata' | '';
    numeroAta: string;
    anoAta: string;
    orgaoAta: string;
    estadoAta: string;
    modalidadeLicitacao: 'pregao_eletronico_comum' | 'pregao_eletronico_rp' | 'outra' | '';
    itemGroups: OrcamentoItemGroup[];
    fontesPesquisa: string[];
    justificativaAusenciaFonte: string;
    justificativaPesquisaDireta: string;
    fornecedoresDiretos: OrcamentoFornecedor[];
    metodologia: 'menor' | 'media' | 'mediana' | '';
    precosEncontrados: OrcamentoPrecos;
    precosIncluidos: OrcamentoPrecosInclusao;
    houveDescarte: 'sim' | 'nao' | '';
    justificativaDescarte: string;
    // Signatory 1
    assinante1Nome: string;
    assinante1NomeGuerra: string;
    assinante1Cargo: string;
    assinante1Funcao: string;
    // Signatory 2
    assinante2Nome: string;
    assinante2NomeGuerra: string;
    assinante2Cargo: string;
    assinante2Funcao: string;
}