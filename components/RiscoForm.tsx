
import React from 'react';
import { RiscoData, RiskItem } from '../types';

interface RiscoFormProps {
  data: RiscoData;
  setData: React.Dispatch<React.SetStateAction<RiscoData>>;
}

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 dark:bg-gray-700/50 dark:border-gray-600">
        <h2 className="text-xl font-bold text-cbmpa-red mb-4 pb-2 border-b-2 border-cbmpa-red">{title}</h2>
        {children}
    </div>
);

const Field: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
    <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export const RiscoForm: React.FC<RiscoFormProps> = ({ data, setData }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRiskChange = (id: string, field: keyof RiskItem, value: string) => {
        setData(prev => ({
            ...prev,
            riscos: prev.riscos.map(r => r.id === id ? { ...r, [field]: value } : r)
        }));
    };

    const addRisk = () => {
        const newRisk: RiskItem = {
            id: Date.now().toString(),
            descricao: '', probabilidade: '', impacto: '', dano: '',
            prevDesc: '', prevResp: '', contDesc: '', contResp: ''
        };
        setData(prev => ({ ...prev, riscos: [...prev.riscos, newRisk] }));
    };

    const removeRisk = (id: string) => {
        setData(prev => ({ ...prev, riscos: prev.riscos.filter(r => r.id !== id) }));
    };

    const inputClasses = "w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";

    return (
        <div className="space-y-6">
            <Section title="Identificação do Documento">
                <Field label="PAE nº" required>
                    <input type="text" name="pae" value={data.pae} onChange={handleChange} required className={inputClasses} />
                </Field>
            </Section>

            <Section title="Análise de Riscos">
                {data.riscos.map((risco, index) => (
                    <div key={risco.id} className="p-4 border-2 border-cbmpa-red rounded-lg mb-4 bg-white dark:bg-gray-800 shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-gray-200">Risco {index + 1}</h3>
                            <button onClick={() => removeRisk(risco.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">Remover</button>
                        </div>
                        <Field label="Descrição do Risco" required><textarea value={risco.descricao} onChange={e => handleRiskChange(risco.id, 'descricao', e.target.value)} required className={`${inputClasses} h-20`}/></Field>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Field label="Probabilidade" required>
                                <select value={risco.probabilidade} onChange={e => handleRiskChange(risco.id, 'probabilidade', e.target.value)} required className={inputClasses}>
                                    <option value="">Selecione</option>
                                    <option value="baixa">Baixa</option>
                                    <option value="media">Média</option>
                                    <option value="alta">Alta</option>
                                </select>
                            </Field>
                            <Field label="Impacto" required>
                                <select value={risco.impacto} onChange={e => handleRiskChange(risco.id, 'impacto', e.target.value)} required className={inputClasses}>
                                    <option value="">Selecione</option>
                                    <option value="baixo">Baixo</option>
                                    <option value="medio">Médio</option>
                                    <option value="alto">Alto</option>
                                </select>
                            </Field>
                        </div>
                        <Field label="Dano" required><textarea value={risco.dano} onChange={e => handleRiskChange(risco.id, 'dano', e.target.value)} required className={`${inputClasses} h-20`}/></Field>
                        
                        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/30 dark:border-green-700">
                             <h4 className="font-semibold text-green-800 dark:text-green-300">Ação Preventiva</h4>
                             <Field label="Descrição" required><textarea value={risco.prevDesc} onChange={e => handleRiskChange(risco.id, 'prevDesc', e.target.value)} required className={`${inputClasses} h-20`}/></Field>
                             <Field label="Responsável" required><input type="text" value={risco.prevResp} onChange={e => handleRiskChange(risco.id, 'prevResp', e.target.value)} required className={inputClasses}/></Field>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700">
                             <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Ação Contingencial</h4>
                             <Field label="Descrição" required><textarea value={risco.contDesc} onChange={e => handleRiskChange(risco.id, 'contDesc', e.target.value)} required className={`${inputClasses} h-20`}/></Field>
                             <Field label="Responsável" required><input type="text" value={risco.contResp} onChange={e => handleRiskChange(risco.id, 'contResp', e.target.value)} required className={inputClasses}/></Field>
                        </div>
                    </div>
                ))}
                <button onClick={addRisk} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition mt-2">➕ Adicionar Risco</button>
            </Section>

            <Section title="Assinatura">
                <div className="grid md:grid-cols-2 gap-6">
                    <Field label="Cidade" required><input type="text" name="cidade" value={data.cidade} onChange={handleChange} required className={inputClasses} /></Field>
                    <Field label="Data" required><input type="date" name="data" value={data.data} onChange={handleChange} required className={inputClasses} /></Field>
                    <Field label="Nome do Servidor" required><input type="text" name="nome" value={data.nome} onChange={handleChange} required className={inputClasses} /></Field>
                    <Field label="Cargo" required><input type="text" name="cargo" value={data.cargo} onChange={handleChange} required className={inputClasses} /></Field>
                    <Field label="Matrícula" required><input type="text" name="matricula" value={data.matricula} onChange={handleChange} required className={inputClasses} /></Field>
                </div>
            </Section>
        </div>
    );
};