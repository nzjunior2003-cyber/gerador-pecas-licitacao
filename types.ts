

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
  matricula: string;
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
    numero: string;
    ano: string;
    pae: string;
    necessidade: string;
    fontesPesquisa: string[];
    fonteOutro: string;
    justificativaTecnica: string;
    restricaoFornecedores: 'sim' | 'nao' | '';
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
    sustentabilidade: string[];
    sustentabilidadeOutro: string;
    prioridadeLei: string[];
    prioridadeJust: string;
    treinamento: 'sim' | 'nao' | '';
    solucaoContratacao: string;
    garantiaContratual: string;
    garantiaOutroNum: string;
    garantiaOutroTipo: 'dias' | 'meses' | 'anos';
    assistenciaTecnica: 'sim' | 'nao' | '';
    assistenciaJust: string;
    manutencao: 'sim' | 'nao' | '';
    manutencaoDesc: string;
    metodoQuantitativo: string[];
    metodoOutro: string;
    descricaoQuantitativo: string;
    itens: EtpItem[];
    viabilidade: 'sim' | 'nao' | '';
    justificativaParcelamento: string;
    resultadosPretendidos: string;
    providencias: string;
    impactosAmbientais: string;
    contratacoesCorrelatas: string;
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
    metodologia: 'menor' | 'media' | 'mediana' | '';
    precosEncontrados: OrcamentoPrecos;
    precosIncluidos: OrcamentoPrecosInclusao;
    houveDescarte: 'sim' | 'nao' | '';
    justificativaDescarte: string;
    assinante1Nome: string;
}