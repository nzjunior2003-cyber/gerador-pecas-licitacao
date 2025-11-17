
import React from 'react';
import { DfdData } from '../types';
import { AiAssistant } from './AiAssistant';

interface DfdFormProps {
  data: DfdData;
  setData: React.Dispatch<React.SetStateAction<DfdData>>;
}

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-cbmpa-red mb-4 pb-2 border-b-2 border-cbmpa-red">{title}</h2>
        {children}
    </div>
);

const Field: React.FC<{ label: string, required?: boolean, children: React.ReactNode, note?: string }> = ({ label, required, children, note }) => (
    <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {note && <p className="text-xs text-gray-500 mt-1 italic">{note}</p>}
    </div>
);


export const DfdForm: React.FC<DfdFormProps> = ({ data, setData }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, statusPCA: e.target.value as DfdData['statusPCA'] });
  };

  return (
    <div className="space-y-6">
      <Section title="Identificação do Memorando">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="Número do Memorando" required>
            <input type="text" name="numeroMemo" value={data.numeroMemo} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" />
          </Field>
          <Field label="Ano" required>
            <input type="text" name="ano" value={data.ano} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" />
          </Field>
        </div>
        <Field label="Unidade de Compras (Destinatário)" required>
          <input type="text" name="unidade" value={data.unidade} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" />
        </Field>
      </Section>

      <Section title="Conteúdo da Solicitação">
        <Field label="Problema a ser Solucionado" required note="Não indicar o bem ou serviço, mas o que se espera resolver.">
          <div className="relative">
            <textarea name="problema" value={data.problema} onChange={handleChange} required minLength={100} className="w-full p-2 border border-gray-300 rounded-md h-24 pr-10"></textarea>
            <AiAssistant
                fieldName="Problema a ser Solucionado"
                onGeneratedText={(text) => setData(prev => ({ ...prev, problema: text }))}
            />
          </div>
        </Field>
        <Field label="Quantitativo Necessário" required note="Indicar quantidade e periodicidade estimada.">
          <div className="relative">
            <textarea name="quantitativo" value={data.quantitativo} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md h-20 pr-10"></textarea>
            <AiAssistant
                fieldName="Quantitativo Necessário"
                onGeneratedText={(text) => setData(prev => ({ ...prev, quantitativo: text }))}
            />
          </div>
        </Field>
        <div className="grid md:grid-cols-2 gap-6">
            <Field label="Prazo Limite para Conclusão" required>
                <input type="date" name="prazo" value={data.prazo} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" />
            </Field>
            <Field label="Justificativa do Prazo" required>
                <div className="relative">
                  <input type="text" name="justificativaPrazo" value={data.justificativaPrazo} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md pr-10" />
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
                  <label htmlFor="pca-sim">A contratação está prevista no PCA.</label>
              </div>
              <div className="flex items-center">
                  <input type="radio" id="pca-nao" name="statusPCA" value="nao" checked={data.statusPCA === 'nao'} onChange={handleRadioChange} className="mr-2" />
                  <label htmlFor="pca-nao">A contratação não está prevista no PCA.</label>
              </div>
              <div className="flex items-center">
                  <input type="radio" id="pca-inexistente" name="statusPCA" value="inexistente" checked={data.statusPCA === 'inexistente'} onChange={handleRadioChange} className="mr-2" />
                  <label htmlFor="pca-inexistente">Ainda não há PCA aprovado para este exercício.</label>
              </div>
          </div>
      </Section>

      <Section title="Assinatura">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="Cidade" required><input type="text" name="cidade" value={data.cidade} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" /></Field>
          <Field label="Data" required><input type="date" name="data" value={data.data} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" /></Field>
          <Field label="Nome do Servidor" required><input type="text" name="nome" value={data.nome} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" /></Field>
          <Field label="Cargo" required><input type="text" name="cargo" value={data.cargo} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" /></Field>
          <Field label="Matrícula" required><input type="text" name="matricula" value={data.matricula} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-md" /></Field>
        </div>
      </Section>
    </div>
  );
};
