
import React from 'react';
import { DfdData } from '../types';
import { AiAssistant } from './AiAssistant';

interface DfdFormProps {
  data: DfdData;
  setData: React.Dispatch<React.SetStateAction<DfdData>>;
}

const cargoOptions = [
    'SD QBM', 'CB QBM', '3° SGT QBM', '2° SGT QBM', '1° SGT QBM', 'ST QBM',
    '2° TEN QOBM', '2° TEN QOABM', '1° TEN QOBM', '1° TEN QOABM',
    'CAP QOBM', 'CAP QOABM', 'MAJ QOBM', 'MAJ QOABM',
    'TCEL QOBM', 'CEL QOBM', 'CEL QOCBM', 'CEL QOSBM'
];

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 dark:bg-gray-700/50 dark:border-gray-600">
        <h2 className="text-xl font-bold text-cbmpa-red mb-4 pb-2 border-b-2 border-cbmpa-red">{title}</h2>
        {children}
    </div>
);

const Field: React.FC<{ label: string, required?: boolean, children: React.ReactNode, note?: string }> = ({ label, required, children, note }) => (
    <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{note}</p>}
    </div>
);


export const DfdForm: React.FC<DfdFormProps> = ({ data, setData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, statusPCA: e.target.value as DfdData['statusPCA'] });
  };

  const inputClasses = "w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";

  return (
    <div className="space-y-6">
      <Section title="Identificação do Memorando">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="Número do Memorando" required>
            <input type="text" name="numeroMemo" value={data.numeroMemo} onChange={handleChange} required className={inputClasses} />
          </Field>
          <Field label="Ano" required>
            <input type="text" name="ano" value={data.ano} onChange={handleChange} required className={inputClasses} />
          </Field>
        </div>
        <Field label="Unidade de Compras (Destinatário)" required>
          <input type="text" name="unidade" value={data.unidade} onChange={handleChange} required className={inputClasses} />
        </Field>
      </Section>

      <Section title="Conteúdo da Solicitação">
        <Field label="Problema a ser Solucionado" required note="Não indicar o bem ou serviço, mas o que se espera resolver.">
          <div className="relative">
            <textarea name="problema" value={data.problema} onChange={handleChange} required minLength={100} className={`${inputClasses} h-24 pr-10`}></textarea>
            <AiAssistant
                fieldName="Problema a ser Solucionado"
                onGeneratedText={(text) => setData(prev => ({ ...prev, problema: text }))}
            />
          </div>
        </Field>
        <Field label="Quantitativo Necessário" required note="Indicar quantidade e periodicidade estimada.">
          <div className="relative">
            <textarea name="quantitativo" value={data.quantitativo} onChange={handleChange} required className={`${inputClasses} h-20 pr-10`}></textarea>
            <AiAssistant
                fieldName="Quantitativo Necessário"
                onGeneratedText={(text) => setData(prev => ({ ...prev, quantitativo: text }))}
            />
          </div>
        </Field>
        <div className="grid md:grid-cols-2 gap-6">
            <Field label="Prazo Limite para Conclusão" required>
                <input type="date" name="prazo" value={data.prazo} onChange={handleChange} required className={inputClasses} />
            </Field>
            <Field label="Justificativa do Prazo" required>
                <div className="relative">
                  <input type="text" name="justificativaPrazo" value={data.justificativaPrazo} onChange={handleChange} required className={`${inputClasses} pr-10`} />
                  <AiAssistant
                      fieldName="Justificativa do Prazo"
                      onGeneratedText={(text) => setData(prev => ({ ...prev, justificativaPrazo: text }))}
                  />
                </div>
            </Field>
        </div>
      </Section>
      
      <Section title="Previsão no Plano de Contratações Anual (PCA)">
          <div className="space-y-2">
              <div className="flex items-center">
                  <input type="radio" id="pca-sim" name="statusPCA" value="sim" checked={data.statusPCA === 'sim'} onChange={handleRadioChange} className="mr-2" />
                  <label htmlFor="pca-sim" className="dark:text-gray-300">A contratação está prevista no PCA.</label>
              </div>
              <div className="flex items-center">
                  <input type="radio" id="pca-nao" name="statusPCA" value="nao" checked={data.statusPCA === 'nao'} onChange={handleRadioChange} className="mr-2" />
                  <label htmlFor="pca-nao" className="dark:text-gray-300">A contratação não está prevista no PCA.</label>
              </div>
              <div className="flex items-center">
                  <input type="radio" id="pca-inexistente" name="statusPCA" value="inexistente" checked={data.statusPCA === 'inexistente'} onChange={handleRadioChange} className="mr-2" />
                  <label htmlFor="pca-inexistente" className="dark:text-gray-300">Ainda não há PCA aprovado para este exercício.</label>
              </div>
          </div>
      </Section>

      <Section title="Assinatura">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="Cidade" required><input type="text" name="cidade" value={data.cidade} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Data" required><input type="date" name="data" value={data.data} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Nome do Servidor" required><input type="text" name="nome" value={data.nome} onChange={handleChange} required className={inputClasses} /></Field>
          <Field label="Cargo" required>
            <select name="cargo" value={data.cargo} onChange={handleChange} required className={inputClasses}>
                <option value="">Selecione o cargo</option>
                {cargoOptions.map(cargo => <option key={cargo} value={cargo}>{cargo}</option>)}
            </select>
          </Field>
          <Field label="Função" required><input type="text" name="funcao" value={data.funcao} onChange={handleChange} required className={inputClasses} /></Field>
        </div>
      </Section>
    </div>
  );
};